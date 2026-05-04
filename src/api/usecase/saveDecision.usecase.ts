import { DecisionRepository } from '../domain/decisions/repositories/decision.repository'
import { MetadonneeDto } from '../../shared/infrastructure/dto/metadonnee.dto'
import { bucketFileDto } from '../../shared/infrastructure/dto/receive.dto'
import { FileService } from '../../shared/infrastructure/files/file.service'
import { v4 as uuidv4 } from 'uuid'

export class SaveDecisionUsecase {
  private readonly fileService: FileService = new FileService()

  constructor() {}

  async putDecision(
    fichierDecisionIntegre: Express.Multer.File,
    metadonnees: MetadonneeDto
  ): Promise<string> {
    const pdfFileExtension = '.pdf'
    const uuid = uuidv4() + pdfFileExtension

    this.fileService.saveFile(fichierDecisionIntegre, uuid)

    this.fileService.saveJson(metadonnees, uuid)

    return uuid
  }
}
