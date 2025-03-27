import * as dotenv from 'dotenv'
dotenv.config()

import { hashDecisionId } from '../shared/infrastructure/utils/hash.utils'

import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  ListObjectsCommandOutput
} from '@aws-sdk/client-s3'

import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common'

import axios from 'axios'

async function main() {
  let doneCount = 0
  const s3Client = new S3Client({
    endpoint: process.env.S3_URL,
    forcePathStyle: true,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    }
  })
  const deletionRequests = await listDeletionRequests()
  for (let i = 0; i < deletionRequests.length; i++) {
    try {
      let deleteFromBuckets = false
      let deleteFromDBSDER = false
      let removeFromLabel = false
      let unpublishFromJudilibre = false
      const decision = await getDecisionBySourceId(deletionRequests[i].sourceId)
      if (decision === null) {
        deleteFromBuckets = true
      } else {
        const deletionAfterLastImport =
          deletionRequests[i].deletionDate.getTime() > new Date(decision.lastImportDate).getTime()
        if (deletionAfterLastImport === true) {
          if (decision.labelStatus === 'toBeTreated' || decision.labelStatus === 'done') {
            if (decision.publishDate !== null) {
              unpublishFromJudilibre = true
            } else {
              deleteFromDBSDER = true
              deleteFromBuckets = true
            }
          } else if (decision.labelStatus === 'loaded') {
            removeFromLabel = true
            if (decision.publishDate !== null) {
              unpublishFromJudilibre = true
            }
          } else if (decision.labelStatus === 'exported') {
            unpublishFromJudilibre = true
          } else {
            deleteFromDBSDER = true
            deleteFromBuckets = true
          }
        } else {
          console.log(
            `TCOM deletion request ${deletionRequests[i].s3Key} (sourceId: ${deletionRequests[i].sourceId}) ignored because lastImportDate (${decision.lastImportDate}) >  deletionDate (${deletionRequests[i].deletionDate})`
          )
        }
      }
      if (deleteFromBuckets) {
        console.log(`TCOM decision ${deletionRequests[i].s3Key} will be deleted from all buckets`)
        const pdfKey = `${deletionRequests[i].s3Key}`.replace(/\.json/, '.pdf')
        try {
          const deleteRawParams = {
            Bucket: process.env.S3_BUCKET_NAME_RAW,
            Key: deletionRequests[i].s3Key
          }
          await s3Client.send(new DeleteObjectCommand(deleteRawParams))
        } catch (e) {
          console.warn(
            `Could not delete document ${deletionRequests[i].s3Key} from bucket ${process.env.S3_BUCKET_NAME_RAW}`,
            e
          )
        }
        try {
          const deleteNormalizedParams = {
            Bucket: process.env.S3_BUCKET_NAME_NORMALIZED,
            Key: deletionRequests[i].s3Key
          }
          await s3Client.send(new DeleteObjectCommand(deleteNormalizedParams))
        } catch (e) {
          console.warn(
            `Could not delete document ${deletionRequests[i].s3Key} from bucket ${process.env.S3_BUCKET_NAME_NORMALIZED}`,
            e
          )
        }
        try {
          const deletePDFParams = {
            Bucket: process.env.S3_BUCKET_NAME_PDF,
            Key: pdfKey
          }
          await s3Client.send(new DeleteObjectCommand(deletePDFParams))
        } catch (e) {
          console.warn(
            `Could not delete document ${pdfKey} from bucket ${process.env.S3_BUCKET_NAME_PDF}`,
            e
          )
        }
        try {
          const deletePDFSuccessParams = {
            Bucket: process.env.S3_BUCKET_NAME_PDF2TEXT_SUCCESS,
            Key: pdfKey
          }
          await s3Client.send(new DeleteObjectCommand(deletePDFSuccessParams))
        } catch (e) {
          console.warn(
            `Could not delete document ${pdfKey} from bucket ${process.env.S3_BUCKET_NAME_PDF2TEXT_SUCCESS}`,
            e
          )
        }
        try {
          const deletePDFFailedParams = {
            Bucket: process.env.S3_BUCKET_NAME_PDF2TEXT_FAILED,
            Key: pdfKey
          }
          await s3Client.send(new DeleteObjectCommand(deletePDFFailedParams))
        } catch (e) {
          console.warn(
            `Could not delete document ${pdfKey} from bucket ${process.env.S3_BUCKET_NAME_PDF2TEXT_FAILED}`,
            e
          )
        }
      }
      if (deleteFromDBSDER) {
        try {
          console.log(
            `TCOM decision ${deletionRequests[i].s3Key} (sourceId: ${deletionRequests[i].sourceId}) will be deleted from DBSDER`
          )
          await deleteDecisionById(decision._id)
        } catch (e) {
          console.warn(
            `Could not delete TCOM decision ${deletionRequests[i].s3Key} (${decision._id}) from DBSDER`,
            e
          )
        }
      }
      if (removeFromLabel) {
        console.warn(
          `TCOM decision ${deletionRequests[i].s3Key} (sourceId: ${deletionRequests[i].sourceId}) SHOULD be removed from Label`
        )
        // @TODO Tchap notif ?
      }
      if (unpublishFromJudilibre) {
        console.warn(
          `TCOM decision ${deletionRequests[i].s3Key} (sourceId: ${deletionRequests[i].sourceId}) SHOULD be unpublished from Judilibre`
        )
        // @TODO Tchap notif ?
      }
      console.log(
        `TCOM deletion request ${deletionRequests[i].s3Key}.deletion (sourceId: ${deletionRequests[i].sourceId}) will be deleted`
      )
      const deleteDeletionRequestParams = {
        Bucket: process.env.S3_BUCKET_NAME_DELETION,
        Key: `${deletionRequests[i].s3Key}.deletion`
      }
      await s3Client.send(new DeleteObjectCommand(deleteDeletionRequestParams))
      doneCount++
    } catch (e) {
      console.error(
        `Error while processing TCOM deletion request ${deletionRequests[i].s3Key}.deletion (sourceId: ${deletionRequests[i].sourceId})`,
        e
      )
    }
  }
  console.log(`Processed ${doneCount} TCOM deletion requests`)
}

async function listDeletionRequests(): Promise<Array<any>> {
  const list = []
  const s3Client = new S3Client({
    endpoint: process.env.S3_URL,
    forcePathStyle: true,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    }
  })
  let done = false
  let marker = null
  while (done === false) {
    const reqParams = {
      Bucket: process.env.S3_BUCKET_NAME_DELETION,
      Marker: undefined
    }
    if (marker !== null) {
      reqParams.Marker = marker
    }
    try {
      const listObjects: ListObjectsCommandOutput = await s3Client.send(
        new ListObjectsCommand(reqParams)
      )
      if (listObjects && listObjects.Contents && listObjects.Contents.length) {
        for (let i = 0; i < listObjects.Contents.length; i++) {
          const item = listObjects.Contents[i]
          const deletionItem = await getDeletionRequest(item.Key)
          list.push({
            s3Key: `${item.Key}`.replace(/\.deletion$/, ''),
            sourceId: hashDecisionId(`${item.Key}`.replace(/\.json\.deletion$/, '')),
            deletionDate: new Date(deletionItem.date)
          })
          marker = item.Key
        }
        if (listObjects.IsTruncated === false) {
          done = true
        }
      } else {
        done = true
      }
    } catch (error) {
      console.log({ operationName: 'listDeletionRequests', msg: error.message, data: error })
    }
  }
  return list
}

async function getDeletionRequest(key: string): Promise<any> {
  const s3Client = new S3Client({
    endpoint: process.env.S3_URL,
    forcePathStyle: true,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    }
  })
  const reqParams = {
    Bucket: process.env.S3_BUCKET_NAME_DELETION,
    Key: key
  }
  const deletionFromS3 = await s3Client.send(new GetObjectCommand(reqParams))
  const stringifiedDeletion = await deletionFromS3.Body?.transformToString()
  return JSON.parse(stringifiedDeletion)
}

async function getDecisionBySourceId(sourceId: number) {
  const urlToCall = process.env.DBSDER_API_URL + '/v1/decisions'

  const result = await axios
    .get(urlToCall, {
      params: { sourceName: 'juritcom', sourceId: sourceId },
      headers: {
        'x-api-key': process.env.DBSDER_OTHER_API_KEY
      }
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.BAD_REQUEST
          })
          throw new BadRequestException(
            'DbSderAPI Bad request error : ' + error.response.data.message
          )
        } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.UNAUTHORIZED
          })
          throw new UnauthorizedException('You are not authorized to call this route')
        } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.CONFLICT
          })
          throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
        } else {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.SERVICE_UNAVAILABLE
          })
        }
      }
      throw new ServiceUnavailableException('DbSder API is unavailable')
    })

  if (result.data && Array.isArray(result.data) && result.data.length > 0) {
    try {
      return await getDecisionById(result.data[0]._id)
    } catch (e) {
      console.error(e)
    }
  }
  return null
}

async function getDecisionById(id: string) {
  const urlToCall = process.env.DBSDER_API_URL + `/v1/decisions/${id}`

  const result = await axios
    .get(urlToCall, {
      headers: {
        'x-api-key': process.env.DBSDER_OTHER_API_KEY
      }
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.BAD_REQUEST
          })
          throw new BadRequestException(
            'DbSderAPI Bad request error : ' + error.response.data.message
          )
        } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.UNAUTHORIZED
          })
          throw new UnauthorizedException('You are not authorized to call this route')
        } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.CONFLICT
          })
          throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
        } else {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.SERVICE_UNAVAILABLE
          })
        }
      }
      throw new ServiceUnavailableException('DbSder API is unavailable')
    })

  return result.data
}

async function deleteDecisionById(id: string) {
  const urlToCall = process.env.DBSDER_API_URL + `/v1/decisions/${id}`

  const result = await axios
    .delete(urlToCall, {
      headers: {
        'x-api-key': process.env.DBSDER_OTHER_API_KEY
      }
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.BAD_REQUEST
          })
          throw new BadRequestException(
            'DbSderAPI Bad request error : ' + error.response.data.message
          )
        } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.UNAUTHORIZED
          })
          throw new UnauthorizedException('You are not authorized to call this route')
        } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.CONFLICT
          })
          throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
        } else {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.SERVICE_UNAVAILABLE
          })
        }
      }
      throw new ServiceUnavailableException('DbSder API is unavailable')
    })

  return result.data
}

main()
