import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

async function main(id: string) {
  const pdf: Buffer = await getPDFByFilename(`${id}.pdf`)
  console.log(pdf.byteLength)
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

main(process.argv[2])
