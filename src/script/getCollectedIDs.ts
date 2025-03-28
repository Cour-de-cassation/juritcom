import { S3Client, ListObjectsCommand, ListObjectsCommandOutput } from '@aws-sdk/client-s3'

async function main() {
  const collectedIds: Array<any> = await getCollectedIDs()
  if (collectedIds.length > 0) {
    console.log('id,date,size')
    for (let i = 0; i < collectedIds.length; i++) {
      console.log(`${collectedIds[i].id},${collectedIds[i].date},${collectedIds[i].size}`)
    }
  }
}

async function getCollectedIDs(): Promise<Array<object>> {
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
      Bucket: process.env.S3_BUCKET_NAME_NORMALIZED,
      Marker: undefined
    }

    if (marker !== null) {
      reqParams.Marker = marker
    }

    try {
      const listObjects: ListObjectsCommandOutput = await s3Client.send(
        new ListObjectsCommand(reqParams)
      )
      if (listObjects && listObjects.Contents) {
        listObjects.Contents.forEach((item) => {
          list.push({
            id: `${item.Key}`.replace('.json', ''),
            date: `${item.LastModified.toISOString()}`.split('T')[0],
            size: item.Size
          })
          marker = item.Key
        })

        if (listObjects.IsTruncated === false) {
          done = true
        }
      } else {
        done = true
      }
    } catch (error) {
      console.log({ operationName: 'getCollectedIDs', msg: error.message, data: error })
    }
  }

  return list
}

main()
