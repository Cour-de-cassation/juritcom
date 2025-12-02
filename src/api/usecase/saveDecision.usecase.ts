import { DecisionRepository } from '../domain/decisions/repositories/decision.repository'
import { MetadonneeDto } from '../../shared/infrastructure/dto/metadonnee.dto'
import { bucketFileDto } from '../../shared/infrastructure/dto/receive.dto'
import { FileService } from '../../shared/infrastructure/files/file.service'

export class SaveDecisionUsecase {
  private readonly fileService: FileService = new FileService()

  constructor(private decisionsRepository: DecisionRepository) {}

  async putDecision(
    fichierDecisionIntegre: Express.Multer.File,
    metadonnees: MetadonneeDto
  ): Promise<bucketFileDto> {
    const uuid = metadonnees.idDecision
    const originalFileName = fichierDecisionIntegre.originalname
    const jsonFileName = `${uuid}${process.env.S3_PDF_FILE_NAME_SEPARATOR}${originalFileName}.json`
    const pdfFileName = `${uuid}${process.env.S3_PDF_FILE_NAME_SEPARATOR}${originalFileName}`

    this.fileService.saveJson(metadonnees, jsonFileName)

    this.fileService.saveFile(fichierDecisionIntegre, pdfFileName)

    return {
      jsonFileName,
      pdfFileName
    }
  }
}
