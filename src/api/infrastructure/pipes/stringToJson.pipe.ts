import { Injectable, PipeTransform } from '@nestjs/common'
import { MissingFieldException } from '../exceptions/missingField.exception'
import { BadFieldFormatException } from '../exceptions/badFieldFormat.exception'

@Injectable()
export class StringToJsonPipe implements PipeTransform {
  transform(value: string) {
    if (!value) {
      throw new MissingFieldException('metadonnee')
    }
    try {
      return JSON.parse(value)
    } catch (_) {
      throw new BadFieldFormatException('JSON', 'metadonnee')
    }
  }
}
