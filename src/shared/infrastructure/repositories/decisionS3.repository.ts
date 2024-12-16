import {
  _Object,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { Logger } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { BucketError } from '../../domain/errors/bucket.error'
import { DecisionRepository } from '../../../api/domain/decisions/repositories/decision.repository'

export class DecisionS3Repository implements DecisionRepository {
  private s3Client: S3Client
  private logger: PinoLogger | Logger

  constructor(logger: PinoLogger | Logger, providedS3Client?: S3Client) {
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
    this.logger = logger
  }

  async saveDecision(reqParams): Promise<void> {
    try {
      await this.s3Client.send(new PutObjectCommand(reqParams))
    } catch (error) {
      this.logger.error({ operationName: 'saveDecision', msg: error.message, data: error })
      throw new BucketError(error)
    }
  }

  async saveDataDecisionIntegre(
    requestToS3Dto: string,
    originalPdfFileName: string,
    jsonS3Key: string
  ): Promise<void> {
    const reqParams = {
      Body: requestToS3Dto,
      Bucket: process.env.S3_BUCKET_NAME_RAW,
      Key: `${jsonS3Key}`,
      Metadata: {
        date: new Date().toISOString(),
        originalPdfFileName: originalPdfFileName
      }
    }

    await this.saveDecision(reqParams)
  }

  async deleteDecision(reqParams): Promise<void> {
    try {
      await this.s3Client.send(new DeleteObjectCommand(reqParams))
    } catch (error) {
      this.logger.error({ operationName: 'deleteDecision', msg: error.message, data: error })
      throw new BucketError(error)
    }
  }

  async deleteDataDecisionIntegre(jsonS3Key: string): Promise<void> {
    const reqParamsMarkForDeletion = {
      Body: JSON.stringify({
        date: new Date()
      }),
      Bucket: process.env.S3_BUCKET_NAME_DELETION,
      Key: `${jsonS3Key}.deletion`,
      Metadata: {
        date: new Date().toISOString()
      }
    }

    await this.saveDecision(reqParamsMarkForDeletion)

    const reqParamsDelete = {
      Bucket: process.env.S3_BUCKET_NAME_RAW,
      Key: `${jsonS3Key}`
    }

    await this.deleteDecision(reqParamsDelete)
  }

  async uploadFichierDecisionIntegre(
    file: Express.Multer.File,
    originalPdfFileName: string,
    pdfS3Key: string
  ): Promise<void> {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME_PDF,
      Key: `${pdfS3Key}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
      Metadata: {
        date: new Date().toISOString(),
        originalPdfFileName: originalPdfFileName
      }
    } as unknown as any

    try {
      await this.s3Client.send(new PutObjectCommand(params))
    } catch (error) {
      this.logger.error({ operationName: 'putDecision', msg: error.message, data: error })
      throw new BucketError(error)
    }
  }

  async getDecisionList(
    maxNumberOfDecisionsToRetrieve?: number,
    startAfterFileName?: string
  ): Promise<_Object[]> {
    const reqParams: ListObjectsV2CommandInput = {
      Bucket: process.env.S3_BUCKET_NAME_RAW
    }
    if (maxNumberOfDecisionsToRetrieve >= 1 && maxNumberOfDecisionsToRetrieve <= 1000) {
      reqParams.MaxKeys = maxNumberOfDecisionsToRetrieve
    }
    if (startAfterFileName) reqParams.StartAfter = startAfterFileName

    try {
      const decisionListFromS3 = await this.s3Client.send(new ListObjectsV2Command(reqParams))
      return decisionListFromS3.Contents ? decisionListFromS3.Contents : []
    } catch (error) {
      this.logger.error({ operationName: 'getDecisionList', msg: error.message, data: error })
      throw new BucketError(error)
    }
  }
}
