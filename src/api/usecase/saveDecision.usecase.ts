import { MetadonneeDto } from '../../shared/infrastructure/dto/metadonnee.dto'
import { v4 as uuidv4 } from 'uuid'
import { DecisionS3Repository } from 'src/shared/infrastructure/repositories/decisionS3.repository'
import { DecisionMongoRepository } from 'src/shared/infrastructure/repositories/decisionMongo.repository'

export class SaveDecisionUsecase {
  private readonly decisionS3Repository: DecisionS3Repository = new DecisionS3Repository()
  private readonly decisionMongoRepository: DecisionMongoRepository = new DecisionMongoRepository()

  constructor() {}

  async putDecision(
    fichierDecisionIntegre: Express.Multer.File,
    metadonnees: MetadonneeDto
  ): Promise<string> {
    const pdfFileExtension = '.pdf'
    const fileName = uuidv4() + pdfFileExtension

    await this.decisionS3Repository.saveDecisionIntegre(fichierDecisionIntegre, fileName)

    await this.decisionMongoRepository.createFileInformation({
      path: fileName,
      events: [{ type: 'created', date: new Date() }],
      metadatas: metadonnees
    })

    return fileName
  }
}
