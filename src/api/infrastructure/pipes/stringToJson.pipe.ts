import { Injectable, PipeTransform } from '@nestjs/common'
import { MissingFieldException } from '../exceptions/missingField.exception'
import { BadFieldFormatException } from '../exceptions/badFieldFormat.exception'
import { PinoLogger } from 'nestjs-pino'
import { TechLog } from '../../../shared/infrastructure/utils/logsFormat.utils'
import { normalizationPinoConfig } from '../../../shared/infrastructure/utils/pinoConfig.utils'
import { HttpStatus } from '@nestjs/common'

const logger = new PinoLogger(normalizationPinoConfig)
const formatLogs: TechLog = {
  operations: ['other', 'StringToJsonPipe.transform'],
  path: 'src/api/infrastructure/pipes/stringToJson.pipe.ts',
  message: 'Error while calling StringToJsonPipe.transform()'
}

@Injectable()
export class StringToJsonPipe implements PipeTransform {
  transform(value: string) {
    if (!value) {
      const error = new MissingFieldException('metadonnee')
      logger.error({
        ...formatLogs,
        message: JSON.stringify({
          msg: error.message,
          statusCode: HttpStatus.BAD_REQUEST
        })
      })
      throw error
    }
    try {
      return JSON.parse(value)
    } catch (_) {
      const error = new BadFieldFormatException('JSON', 'metadonnee')
      logger.error({
        ...formatLogs,
        message: JSON.stringify({
          msg: error.message,
          statusCode: HttpStatus.BAD_REQUEST
        })
      })
      throw error
    }
  }
}
