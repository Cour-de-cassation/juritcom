import { CronJob } from 'cron'
import { normalizationJob } from './normalization'
import { LogsFormat } from '../../shared/infrastructure/utils/logsFormat.utils'
import { logger } from './logger'

const CRON_EVERY_HOUR = '0 * * * *'

async function startJob() {
  let isJobCompleted = true
  let formatLogs: LogsFormat = {
    operationName: 'startJob',
    msg: 'Starting normalization...'
  }
  CronJob.from({
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
    runOnInit: true, // This attribute is set to launch the normalization batch once at the start of the cronjob
    start: true // This attribute starts the cron job after its instantiation (equivalent to cron.start())
  })
}

startJob()
