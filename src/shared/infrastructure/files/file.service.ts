import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import * as fs from 'fs'

@Injectable()
export class FileService {
  private readonly uploadPath = process.env.AV_PDF_PATH
  private readonly logger = new Logger(FileService.name)

  constructor() {
    if (!fs.existsSync(this.uploadPath)) {
      this.logger.warn({
        operation: ['other', `${FileService.name}`],
        path: 'src/shared/infrastructure/files/file.service.ts',
        message: `AV_PDF_PATH ${this.uploadPath} not found or volume does not exist`
      })
    }
  }

  saveFile(file: Express.Multer.File, uniqueFilename: string): { filename: string; path: string } {
    try {
      const fullPath = `${this.uploadPath}/${uniqueFilename}`

      fs.writeFileSync(fullPath, file.buffer)

      return {
        filename: uniqueFilename,
        path: fullPath
      }
    } catch (_error) {
      const error = new InternalServerErrorException('Error saving file')
      this.logger.error({
        operation: ['other', `${FileService.name}.saveFile`],
        path: 'src/shared/infrastructure/files/file.service.ts',
        message: error.message
      })
      throw error
    }
  }
}
