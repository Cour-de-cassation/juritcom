import { DecisionRepository } from '../domain/decisions/repositories/decision.repository'
import { MetadonneeDto } from '../../shared/infrastructure/dto/metadonnee.dto'
import { bucketFileDto } from '../../shared/infrastructure/dto/receive.dto'
import { FileService } from '../../shared/infrastructure/files/file.service'
import { CollectDto } from '../../shared/infrastructure/dto/collect.dto'

export class SaveDecisionUsecase {
  private readonly fileService: FileService = new FileService()

  constructor(private decisionsRepository: DecisionRepository) {}

  async putDecision(
    fichierDecisionIntegre: Express.Multer.File,
    texteDecisionIntegre: string,
    metadonnees: MetadonneeDto
  ): Promise<bucketFileDto> {
    const uuid = metadonnees.idDecision
    const originalFileName = fichierDecisionIntegre.originalname
    const jsonFileName = `${uuid}.json`
    const pdfFileName = `${uuid}${process.env.S3_PDF_FILE_NAME_SEPARATOR}${originalFileName}`

    const now = new Date()
    now.setMilliseconds(0)

    const requestDto: CollectDto = {
      texteDecisionIntegre,
      metadonnees,
      date: now
    }

    await this.decisionsRepository.saveDataDecisionIntegre(
      JSON.stringify(requestDto),
      originalFileName,
      jsonFileName
    )

    this.fileService.saveFile(fichierDecisionIntegre, pdfFileName)

    return {
      jsonFileName,
      pdfFileName
    }
  }
}
