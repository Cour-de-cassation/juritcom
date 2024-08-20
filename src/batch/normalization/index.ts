import { CronJob } from 'cron'
import { PinoLogger } from 'nestjs-pino'
import { normalizationJob } from './normalization'
import { LogsFormat } from '../../shared/infrastructure/utils/logsFormat.utils'
import { normalizationPinoConfig } from '../../shared/infrastructure/utils/pinoConfig.utils'

const CRON_EVERY_HOUR = '0 * * * *'

export const logger = new   PinoLogger(normalizationPinoConfig)

export const normalizationFormatLogs: LogsFormat = {
  operationName: 'normalizationJob',
  msg: 'Starting normalization job...'
}

async function startJob() {
  let isJobCompleted = true
  let formatLogs: LogsFormat = {
    operationName: 'startJob',
     msg: 'Starting normalization...'
  }
  new CronJob({
    cronTime: process.env.NORMALIZATION_BATCH_SCHEDULE || CRON_EVERY_HOUR,
    async onTick() {
      if (isJobCompleted) {
        isJobCompleted = false
        logger.info(formatLogs)
        try {
          await normalizationJob()
        } catch (error) {
          formatLogs = {
            ...formatLogs,
            msg: error.message,
            data: error
          }
          logger.error(formatLogs)
          logger.info({ ...formatLogs, msg: 'Leaving due to an error...' })
        } finally {
          isJobCompleted = true
        }
      } else {
        logger.info('Normalization job already running...')
      }
    },
    timeZone: 'Europe/Paris',
    runOnInit: true,
    start: true
  })
}

startJob()
