import { DecisionRepository } from '../domain/decisions/repositories/decision.repository'
import { v4 as uuidv4 } from 'uuid'
import { MetadonneeDto } from '../../shared/infrastructure/dto/metadonnee.dto'
import { bucketFileDto } from '../../shared/infrastructure/dto/receive.dto'
import { FileService } from '../../shared/infrastructure/files/file.service'
import { CollectDto } from 'src/shared/infrastructure/dto/collect.dto'

export class SaveDecisionUsecase {
  private readonly fileService: FileService = new FileService()

  constructor(private decisionsRepository: DecisionRepository) {
  }

  async putDecision(
    fichierDecisionIntegre: Express.Multer.File,
    texteDecisionIntegre: string,
    metadonnees: MetadonneeDto
  ): Promise<bucketFileDto> {
    const uuid = metadonnees.idDecision // uuidv4()
    const originalFileName = fichierDecisionIntegre.originalname
    const jsonFileName = `${uuid}.json`
    const pdfFileName = `${uuid}${process.env.S3_PDF_FILE_NAME_SEPARATOR}${originalFileName}`

    const requestDto: CollectDto = {
      texteDecisionIntegre,
      metadonnees
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
