import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import * as fs from 'fs'

@Injectable()
export class FileService {
  private readonly uploadPath = process.env.AV_PDF_PATH
  private readonly logger = new Logger(FileService.name)

  constructor() {
    if (!fs.existsSync(this.uploadPath)) {
      this.logger.warn({
        msg: `AV_PDF_PATH ${this.uploadPath} not found or volume does not exist`,
        operationName: FileService.name
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
    } catch (error) {
      throw new InternalServerErrorException(
        'Error saving file'
      )
    }
  }


}