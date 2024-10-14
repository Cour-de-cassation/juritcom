import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2CommandInput,
  _Object,
  ListObjectsV2Command
} from '@aws-sdk/client-s3'
import { Logger } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { BucketError } from '../../domain/errors/bucket.error'
import { DecisionRepository } from '../../../api/domain/decisions/repositories/decision.repository'
import { CollectDto } from '../dto/collect.dto'

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
    originalFileName: string,
    jsonFileName?: string
  ): Promise<void> {
    const reqParams = {
      Body: requestToS3Dto,
      Bucket: process.env.S3_BUCKET_NAME_RAW,
      Key: `${process.env.S3_BUCKET_METADATA_PATH}${jsonFileName}`,
      Metadata: {
        originalFileName
      }
    }

    await this.saveDecision(reqParams)
  }

  async uploadFichierDecisionIntegre(
    file: Express.Multer.File,
    originalFileName: string,
    pdfFileName: string
  ): Promise<void> {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME_RAW,
      Key: `${process.env.S3_BUCKET_PDF_PATH}${pdfFileName}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
      Metadata: {
        originalFileName
      }
    } as unknown as any

    try {
      await this.s3Client.send(new PutObjectCommand(params))
    } catch (error) {
      this.logger.error({ operationName: 'putDecision', msg: error.message, data: error })
      throw new BucketError(error)
    }
  }

  async getDecisionByFilename(filename: string): Promise<CollectDto> {
    const reqParams = {
      Bucket: process.env.S3_BUCKET_NAME_RAW,
      Key: filename
    }

    try {
      const decisionFromS3 = await this.s3Client.send(new GetObjectCommand(reqParams))
      const stringifiedDecision = await decisionFromS3.Body?.transformToString()
      return JSON.parse(stringifiedDecision)
    } catch (error) {
      this.logger.error({ operationName: 'getDecisionByFilename', msg: error.message, data: error })
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
