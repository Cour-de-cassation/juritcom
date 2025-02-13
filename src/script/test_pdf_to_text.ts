import FormData from 'form-data'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

async function main() {
  const pdf = await getPDFByFilename('0605_2001F00930_2012-12-05_19.pdf')
  const form = new FormData()
  form.append('pdf_file', pdf)
  const response = await fetch(
    'http://nlp-pseudonymisation-api-service.nlp.svc.cluster.local:8081/pdf-to-text',
    {
      method: 'POST',
      body: form.getBuffer()
    }
  )
  console.log(response)
}

async function getPDFByFilename(filename) {
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
    Bucket: process.env.S3_BUCKET_NAME_PDF,
    Key: filename
  }

  try {
    const fileFromS3 = await s3Client.send(new GetObjectCommand(reqParams))
    return Buffer.from(await fileFromS3.Body.transformToByteArray())
  } catch (error) {
    console.log({ operationName: 'getPDFByFilename', msg: error.message, data: error })
  }
}

main()
