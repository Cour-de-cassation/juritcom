import { Injectable } from '@nestjs/common'
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

@Injectable()
export class BucketHealthIndicator {
  private readonly key = 'bucket'
  private readonly s3Client: S3Client

  constructor(private readonly healthIndicatorService: HealthIndicatorService) {
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

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      await this.s3Client.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET_NAME_RAW }))
      return this.healthIndicatorService.check(this.key).up()
    } catch (_) {
      return this.healthIndicatorService.check(this.key).down()
    }
  }
}
