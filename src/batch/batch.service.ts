import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import * as fs from 'fs'
import * as path from 'path'
import { DecisionRepository } from '../api/domain/decisions/repositories/decision.repository'
import { DecisionS3Repository } from '../shared/infrastructure/repositories/decisionS3.repository'
import { CronJob } from 'cron'


@Injectable()
export class BatchService implements OnModuleInit {
  private readonly folderPath = process.env.AV_PDF_PATH
  private readonly separator = process.env.S3_PDF_FILE_NAME_SEPARATOR
  private readonly logger: Logger = new Logger(BatchService.name)
  private readonly decisionsRepository: DecisionRepository = new DecisionS3Repository(this.logger)

  constructor(private schedulerRegistry: SchedulerRegistry) {
  }

  onModuleInit() {
    this.addCronJob(`archive_files_to_s3`, process.env.S3_ARCHIVE_SCHEDULE, this.archiveFilesToS3.bind(this))
  }

  async archiveFilesToS3() {
    this.logger.log({ operationName: 'archiveFilesToS3', msg: `Starting scan` })

    try {
      const fileNames = fs.readdirSync(this.folderPath)
      fileNames.forEach(filename => {
        const filePath = path.join(this.folderPath, filename)
        const stats = fs.statSync(filePath)

        if (stats.isFile()) {
          const pattern = new RegExp(`^[^${this.separator}]+`)
          const match = filename.match(pattern)
          const pdfS3Key = match ? `${match[0]}.pdf` : filename
          this.decisionsRepository.uploadFichierDecisionIntegre(
            fs.readFileSync(filePath),
            filename,
            pdfS3Key
          )
        }
      })

      fileNames.forEach((filename) => {
        const filePath = path.join(this.folderPath, filename)
        fs.unlinkSync(filePath) // file deletion
      })

    } catch (error) {
      this.logger.error({ operationName: 'archiveFilesToS3', msg: error.message, data: error })
    }

    this.logger.log({ operationName: 'archiveFilesToS3', msg: `End of scan` })
  }

  /**
   *  Adds a dynamic cron job.
   *
   * @param name - the cron job name.
   * @param cronExpression - a cron expression.
   * @param callback - the function that will handle the actual actions of the cron job.
   */
  addCronJob(name: string, cronExpression: string, callback: () => Promise<void>) {
    const job = new CronJob(`${cronExpression}`, () => {
      callback()
    })

    this.schedulerRegistry.addCronJob(name, job)
    job.start()

    this.logger.log(`The cron job ${name} has been added with the following cron expression : ${cronExpression}`)
  }

}
