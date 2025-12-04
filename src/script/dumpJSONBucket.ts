import * as dotenv from 'dotenv'
dotenv.config()

import { hashDecisionId } from '../shared/infrastructure/utils/hash.utils'

import {
  S3Client,
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsCommandOutput
} from '@aws-sdk/client-s3'
import { DbSderApiGateway } from '../batch/normalization/repositories/gateways/dbsderApi.gateway'

const { getDecisionBySourceId } = new DbSderApiGateway()

async function main() {
  // const dump = []
  const collected = await listCollected()
  for (let i = 0; i < collected.length; i++) {
    try {
      console.log(collected[i])
      const decision = await getDecisionBySourceId(collected[i].sourceId)
      console.log(`Decision exists: ${decision ? 'true' : 'false'}`)
    } catch (e) {
      console.error(
        `Error while processing TCOM deletion request ${collected[i].s3Key}.deletion (sourceId: ${collected[i].sourceId})`,
        e
      )
    }
  }
}

async function listCollected(): Promise<Array<any>> {
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
  console.log({
    endpoint: process.env.S3_URL,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  })
  let done = false
  let marker = null
  while (done === false) {
    const reqParams = {
      Bucket: process.env.S3_BUCKET_NAME_NORMALIZED, // S3_BUCKET_NAME_RAW,
      Marker: undefined
    }
    if (marker !== null) {
      reqParams.Marker = marker
    }
    console.log(reqParams)
    try {
      const listObjects: ListObjectsCommandOutput = await s3Client.send(
        new ListObjectsCommand(reqParams)
      )
      console.log(listObjects)
      if (listObjects && listObjects.Contents && listObjects.Contents.length) {
        for (let i = 0; i < listObjects.Contents.length; i++) {
          const item = listObjects.Contents[i]
          const itemObject = await getItem(item.Key)
          list.push({
            s3Key: item.Key,
            sourceId: hashDecisionId(itemObject.metadonnees.idDecision),
            dateDecision: parseDate(itemObject.metadonnees.dateDecision).toISOString(),
            idDecisionTCOM: itemObject.metadonnees.idDecision,
            jurisdictionId: itemObject.metadonnees.idJuridiction,
            registerNumber: itemObject.metadonnees.numeroDossier
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
      console.log({ operationName: 'listCollected', msg: error.message, data: error })
    }
  }
  return list
}

function parseDate(dateDecision: string) {
  const year = dateDecision.substring(0, 4),
    month = dateDecision.substring(4, 6),
    date = dateDecision.substring(6, 8)

  return new Date(parseInt(year), parseInt(month) - 1, parseInt(date))
}

async function getItem(key: string): Promise<any> {
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
    Bucket: process.env.S3_BUCKET_NAME_RAW,
    Key: key
  }
  const itemFromS3 = await s3Client.send(new GetObjectCommand(reqParams))
  const stringifiedItem = await itemFromS3.Body?.transformToString()
  return JSON.parse(stringifiedItem)
}

main()
