import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2CommandInput,
  _Object,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { Logger } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { BucketError } from '../exceptions/bucket.error'
import { DecisionRepository } from '../../../api/domain/decisions/repositories/decision.repository'

export class DecisionS3Repository implements DecisionRepository {
  private s3Client: S3Client
  private readonly logger = new Logger()

  constructor(providedS3Client?: S3Client) {
    if (providedS3Client) {
      this.s3Client = providedS3Client
    } else {
      this.s3Client = new S3Client({
        endpoint: process.env.S3_URL,
        forcePathStyle: true,
        region: process.env.S3_REGION,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY,
          secretAccessKey: process.env.S3_SECRET_KEY
        }
      })
    }
  }

  async saveDecisionIntegre(decisionIntegre: Express.Multer.File, fileName: string) {
    const reqParams: PutObjectCommand = new PutObjectCommand({
      Body: decisionIntegre.buffer,
      Bucket: process.env.S3_BUCKET_NAME_RAW,
      Key: fileName,
      ContentType: decisionIntegre.mimetype
    })

    await this.saveDecision(reqParams)
  }

  async saveDecision(reqParams: PutObjectCommand): Promise<void> {
    try {
      await this.s3Client.send(reqParams)
    } catch (error) {
      this.logger.error({
        operations: ['collect', 'decision'],
        path: './src/shared/infrastructure/repositories/decisionS3.repository.ts',
        message: JSON.stringify({ msg: error.message, data: error })
      })
      throw new BucketError(error)
    }
  }
}
