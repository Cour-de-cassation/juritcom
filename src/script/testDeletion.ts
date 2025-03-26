import * as dotenv from 'dotenv'
dotenv.config()

import { hashDecisionId } from '../shared/infrastructure/utils/hash.utils'

import {
  S3Client,
  GetObjectCommand,
  // DeleteObjectCommand,
  // PutObjectCommand,
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
  const deletionRequests = await listDeletionRequests()
  for (let i = 0; i < deletionRequests.length; i++) {
    try {
      const decision = await getDecisionBySourceId(deletionRequests[i].sourceId)
      console.log(deletionRequests[i])
      console.log(decision)
      console.log('-----')
      doneCount++
    } catch (e) {
      console.error(
        `Error while processing deletion request for decision ${deletionRequests[i].s3Key} (sourceId: ${deletionRequests[i].sourceId})`,
        e
      )
    }
  }
  console.log(`Processed ${doneCount} deletion requests`)
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

/*
async function reprocessNormalizedDecisionByFilename(filename: string): Promise<boolean> {
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
    Bucket: process.env.S3_BUCKET_NAME_NORMALIZED,
    Key: filename
  }
  try {
    const decisionFromS3 = await s3Client.send(new GetObjectCommand(reqParams))
    const stringifiedDecision = await decisionFromS3.Body?.transformToString()
    const objectDecision = JSON.parse(stringifiedDecision)
    // 1. Check .metadonnees.idDecision + '.json' === filename:
    if (
      objectDecision &&
      objectDecision.metadonnees &&
      `${objectDecision.metadonnees.idDecision}.json` === filename
    ) {
      // 2. remove texteDecisionIntegre
      objectDecision.texteDecisionIntegre = null
      // 3. copy to raw:
      const reqCopyParams = {
        Body: JSON.stringify(objectDecision),
        Bucket: process.env.S3_BUCKET_NAME_RAW,
        Key: filename
      }
      await s3Client.send(new PutObjectCommand(reqCopyParams))
      // 4. Delete from normalized:
      await s3Client.send(new DeleteObjectCommand(reqParams))
      return true
    } else {
      throw new Error('Decision incomplete or ID mismatch')
    }
  } catch (error) {
    console.log({
      operationName: 'reprocessNormalizedDecisionByFilename',
      msg: error.message,
      data: error
    })
    return false
  }
}
*/

main()
