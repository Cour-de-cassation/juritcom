import { Injectable, PipeTransform } from '@nestjs/common'
import { MissingFieldException } from '../exceptions/missingField.exception'
import { BadFieldFormatException } from '../exceptions/badFieldFormat.exception'
import { PinoLogger } from 'nestjs-pino'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'
import { normalizationPinoConfig } from '../../../shared/infrastructure/utils/pinoConfig.utils'
import { HttpStatus } from '@nestjs/common'

const logger = new PinoLogger(normalizationPinoConfig)
const formatLogs: LogsFormat = {
  operationName: 'StringToJsonPipe.transform',
  msg: 'Error while calling StringToJsonPipe.transform()'
}

@Injectable()
export class StringToJsonPipe implements PipeTransform {
  transform(value: string) {
    if (!value) {
      const error = new MissingFieldException('metadonnee')
      logger.error({
        ...formatLogs,
        msg: error.message,
        statusCode: HttpStatus.BAD_REQUEST
      })
      throw error
    }
    try {
      return JSON.parse(value)
    } catch (_) {
      const error = new BadFieldFormatException('JSON', 'metadonnee')
      logger.error({
        ...formatLogs,
        msg: error.message,
        statusCode: HttpStatus.BAD_REQUEST
      })
      throw error
    }
  }
}
