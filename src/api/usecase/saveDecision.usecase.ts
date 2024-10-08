import { DecisionRepository } from '../domain/decisions/repositories/decision.repository'
import { v4 as uuidv4 } from 'uuid'
import { MetadonneeDto } from '../../shared/infrastructure/dto/metadonnee.dto'
import { bucketFileDto } from '../../shared/infrastructure/dto/receive.dto'
import { CollectDto } from 'src/shared/infrastructure/dto/collect.dto'

export class SaveDecisionUsecase {
  constructor(private decisionsRepository: DecisionRepository) {}

  async putDecision(
    fichierDecisionIntegre: Express.Multer.File,
    texteDecisionIntegre: string,
    metadonnees: MetadonneeDto
  ): Promise<bucketFileDto> {
    const uuid = uuidv4()
    const originalFileName = fichierDecisionIntegre.originalname
    const jsonFileName = `${uuid}.json`
    const pdfFileName = `${uuid}-${originalFileName}`

    const requestDto: CollectDto = {
      texteDecisionIntegre,
      metadonnees
    }

    await this.decisionsRepository.saveDataDecisionIntegre(
      JSON.stringify(requestDto),
      originalFileName,
      jsonFileName
    )
    await this.decisionsRepository.uploadFichierDecisionIntegre(
      fichierDecisionIntegre,
      originalFileName,
      pdfFileName
    )

    return {
      jsonFileName,
      pdfFileName
    }
  }
}
