import { HttpException, HttpStatus } from '@nestjs/common'

export class BadFileFormatException extends HttpException {
  constructor(fileProperty?: string, format?: string) {
    const flProperty = fileProperty || 'decisionIntegre'
    const fileFormat = format || 'Wordperfect'
    super(
      `Vous devez fournir un fichier '${flProperty}' au format ${fileFormat}.`,
      HttpStatus.BAD_REQUEST
    )
  }
}

export class BadFileSizeException extends HttpException {
  constructor(readableBytes) {
    super(
      `Vous devez fournir un fichier 'decisionIntegre' de moins de ${readableBytes}.`,
      HttpStatus.BAD_REQUEST
    )
  }
}
