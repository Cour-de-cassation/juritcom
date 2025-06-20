import * as dotenv from 'dotenv'
dotenv.config()

import { hashDecisionId } from '../shared/infrastructure/utils/hash.utils'

import {
  S3Client,
  GetObjectCommand,
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

async function main(datetime: string) {
  if (!datetime) {
    throw new Error(
      'Usage: listDeletionToProceed.js <datetime>\nThis script displays the commands that must be manually executed in order to proceed to the deletion requests (on Label and Judilibre) received since the given datetime:\nlistDeletionToProceed.js 2025-05-07T10:00:00'
    )
  }

  const unpublishFromJudilibreIds = []
  const removeFromLabelIds = []
  const deletionRequests = await listDeletionRequests()
  for (let i = 0; i < deletionRequests.length; i++) {
    try {
      const decision = await getDecisionBySourceId(deletionRequests[i].sourceId)
      if (decision !== null) {
        const deletionAfterLastImport =
          deletionRequests[i].deletionDate.getTime() > new Date(decision.lastImportDate).getTime()
        const deletionAfterLastOperation =
          deletionRequests[i].deletionDate.getTime() > new Date(datetime).getTime()
        if (deletionAfterLastImport === true && deletionAfterLastOperation === true) {
          let unpublishFromJudilibre = false
          let removeFromLabel = false
          if (decision.labelStatus === 'toBeTreated' || decision.labelStatus === 'done') {
            if (decision.publishDate !== null) {
              unpublishFromJudilibre = true
            }
          } else if (decision.labelStatus === 'loaded') {
            removeFromLabel = true
            if (decision.publishDate !== null) {
              unpublishFromJudilibre = true
            }
          } else if (decision.labelStatus === 'exported') {
            unpublishFromJudilibre = true
          }
          if (unpublishFromJudilibre === true) {
            unpublishFromJudilibreIds.push(`${decision._id}`)
          }
          if (removeFromLabel === true) {
            removeFromLabelIds.push(
              `kubectl exec -it -n label \`kubectl -n label get pods | grep label-backend-deployment-\` -- sh -c "sh ./scripts/runProdScript.sh ./dist/scripts/deleteDocument.js --source=${decision.sourceName} --documentNumber=${decision.sourceId}"`
            )
          }
        }
      }
    } catch (e) {
      console.error(
        `Error while processing TCOM deletion request ${deletionRequests[i].s3Key}.deletion (sourceId: ${deletionRequests[i].sourceId})`,
        e
      )
    }
  }
  console.log(`To unpublish from Judilibre (${unpublishFromJudilibreIds.length}):`)
  console.log(
    `kubectl exec -it -n judilibre-sder \`kubectl -n judilibre-sder get pods | grep judilibre-sder-deployment-\` -- sh -c "node ./src/scripts/deleteFromJudilibre.js ${unpublishFromJudilibreIds.join(',')}"`
  )
  console.log(`To remove from Label (${removeFromLabelIds.length}):`)
  console.log(removeFromLabelIds.join(';'))
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
      Bucket: process.env.S3_BUCKET_NAME_DELETION_PROCESSED,
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
    Bucket: process.env.S3_BUCKET_NAME_DELETION_PROCESSED,
    Key: key
  }
  const deletionFromS3 = await s3Client.send(new GetObjectCommand(reqParams))
  const stringifiedDeletion = await deletionFromS3.Body?.transformToString()
  return JSON.parse(stringifiedDeletion)
}

async function getDecisionBySourceId(sourceId: number) {
  const urlToCall = process.env.DBSDER_API_URL + '/decisions'

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

  if (result && Array.isArray(result.data) && result.data.length > 0) {
    try {
      return await getDecisionById(result.data[0]._id)
    } catch (e) {
      console.error(e)
    }
  }
  return null
}

async function getDecisionById(id: string) {
  const urlToCall = process.env.DBSDER_API_URL + `/decisions/${id}`

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

main(process.argv[2])
