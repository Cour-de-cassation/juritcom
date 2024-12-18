import { ArgumentMetadata, Injectable, PipeTransform, Logger, HttpStatus } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { BadPropertiesException } from '../exceptions/missingProperties.exception'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'

const logger = new Logger()
const formatLogs: LogsFormat = {
  operationName: 'ValidateDtoPipe.transform',
  msg: 'Error while calling ValidateDtoPipe.transform()'
}

@Injectable()
export class ValidateDtoPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value
    }
    const object = plainToInstance(metatype, value)
    const errors: ValidationError[] = await validate(object)
    if (errors.length > 0) {
      const messages = errors.map((err) => err.property)
      const error = new BadPropertiesException(messages, value)
      logger.error({
        ...formatLogs,
        msg: error.message,
        statusCode: HttpStatus.BAD_REQUEST
      })
      throw error
    }
    return value
  }

  private toValidate(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object]
    return !types.includes(metatype)
  }
}
