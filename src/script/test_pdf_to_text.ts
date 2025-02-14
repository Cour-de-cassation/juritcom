import * as FormData from 'form-data'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

// @TODO http://nlp-pseudonymisation-api-service.nlp.svc.cluster.local:8081/pdf-to-text
// cf. https://stackoverflow.com/a/64169877

async function main() {
  const pdf: Buffer = await getPDFByFilename('0605_2001F00930_2012-12-05_19.pdf')
  const formdata: FormData = new FormData()
  formdata.append('pdf_file', pdf, '0605_2001F00930_2012-12-05_19.pdf')
  try {
    const response: AxiosResponse = await axios.post(
      'http://nlp-pseudonymisation-api-service.nlp.svc.cluster.local:8081/pdf-to-text',
      formdata,
      {
        headers: {
          ...formdata.getHeaders()
        }
      }
    )
    console.log(response.status)
    console.log(response.statusText)
    console.log(response.data)
  } catch (error: any) {
    if (error instanceof AxiosError) {
      console.error(error.code)
      console.error(error.status)
      console.error(error.cause)
    } else {
      console.error(error)
    }
  }
}

async function getPDFByFilename(filename: string): Promise<Buffer> {
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
    return Buffer.from(await fileFromS3.Body?.transformToByteArray())
  } catch (error) {
    console.log({ operationName: 'getPDFByFilename', msg: error.message, data: error })
  }
}

main()
