import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import * as fs from 'fs'
import * as path from 'path'
import { DecisionRepository, RawFilesRepository } from '../api/domain/decisions/repositories/decision.repository'
import { DecisionS3Repository } from '../shared/infrastructure/repositories/decisionS3.repository'
import { CronJob } from 'cron'

import { processDeletion } from './deletion/deletion'
import { DecisionMongoRepository } from 'src/shared/infrastructure/repositories/decisionMongo.repository'

@Injectable()
export class BatchService implements OnModuleInit {
  private readonly folderPath = process.env.AV_PDF_PATH
  private readonly separator = process.env.S3_PDF_FILE_NAME_SEPARATOR
  private readonly logger: Logger = new Logger(BatchService.name)
  private readonly decisionsRepository: DecisionRepository = new DecisionS3Repository(this.logger)
  private readonly rawRepository: RawFilesRepository = new DecisionMongoRepository()

  constructor(private schedulerRegistry: SchedulerRegistry) { }

  onModuleInit() {
    this.addCronJob(
      `archive_files_to_s3`,
      process.env.S3_ARCHIVE_SCHEDULE,
      this.archiveFilesToS3.bind(this)
    )
    this.addCronJob(
      `process_deletion_requests`,
      process.env.S3_ARCHIVE_SCHEDULE,
      this.processDeletionRequests.bind(this)
    )
  }

  async archiveFilesToS3() {
    this.logger.log({ operationName: 'archiveFilesToS3', msg: `Starting scan` })

    try {
      const fileNames = fs.readdirSync(this.folderPath).filter((_) => _.endsWith('.pdf'))
      const filesArchived = await Promise.allSettled(fileNames.map(async (filename) => {
        const filePath = path.join(this.folderPath, filename)
        const stats = fs.statSync(filePath)

        if (stats.isFile()) {
          const idMatch = filename.split(this.separator)
          const pdfS3Key = `${idMatch[0]}.pdf`
          const originalPdfFileName = idMatch.length === 2 ? `${idMatch[1]}` : filename

          this.decisionsRepository.uploadFichierDecisionIntegre(
            fs.readFileSync(filePath),
            originalPdfFileName,
            pdfS3Key
          )

          const { metadonnees } = await this.decisionsRepository.getDecisionByFilename(`${idMatch[0]}.json`)
          this.rawRepository.createFileInformation({
            path: pdfS3Key,
            events: [{ type: "created", date: new Date() }],
            metadonnees
          })
        }
        return filename
      }))

      filesArchived.filter(_ => _.status === 'fulfilled').forEach((_) => {
        const filePath = path.join(this.folderPath, _.value)
        fs.unlinkSync(filePath) // file deletion
      })
    } catch (error) {
      this.logger.error({ operationName: 'archiveFilesToS3', msg: error.message, data: error })
    }

    this.logger.log({ operationName: 'archiveFilesToS3', msg: `End of scan` })
  }

  async processDeletionRequests() {
    this.logger.log({ operationName: 'processDeletionRequests', msg: `Starting process` })

    try {
      await processDeletion()
    } catch (error) {
      this.logger.error({
        operationName: 'processDeletionRequests',
        msg: error.message,
        data: error
      })
    }

    this.logger.log({ operationName: 'processDeletionRequests', msg: `End of process` })
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

    this.logger.log(
      `The cron job ${name} has been added with the following cron expression : ${cronExpression}`
    )
  }
}
