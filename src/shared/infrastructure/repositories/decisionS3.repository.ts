import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Logger } from '@nestjs/common'
import { BucketError } from '../exceptions/bucket.error'

const logger = new Logger()

const s3Client = new S3Client({
  endpoint: process.env.S3_URL,
  forcePathStyle: true,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  }
})

export async function saveDecisionIntegre(
  decisionIntegre: Express.Multer.File,
  fileName: string
): Promise<void> {
  const reqParams = new PutObjectCommand({
    Body: decisionIntegre.buffer,
    Bucket: process.env.S3_BUCKET_NAME_PDF,
    Key: fileName,
    ContentType: decisionIntegre.mimetype
  })

  try {
    await s3Client.send(reqParams)
  } catch (error) {
    logger.error({
      operations: ['collect', 'decision'],
      path: './src/shared/infrastructure/repositories/decisionS3.repository.ts',
      message: JSON.stringify({ msg: error.message, data: error })
    })
    throw new BucketError(error)
  }
}
