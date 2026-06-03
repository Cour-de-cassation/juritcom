import { MetadonneeDto } from '../../shared/infrastructure/dto/metadonnee.dto'
import { v4 as uuidv4 } from 'uuid'
import { saveDecisionIntegre } from 'src/shared/infrastructure/repositories/decisionS3.repository'
import { createFileInformation } from 'src/shared/infrastructure/repositories/decisionMongo.repository'

export class SaveDecisionUsecase {
  async putDecision(
    fichierDecisionIntegre: Express.Multer.File,
    metadonnees: MetadonneeDto
  ): Promise<{ fileName: string; rawfileId: string }> {
    const fileName = uuidv4() + '.pdf'

    await saveDecisionIntegre(fichierDecisionIntegre, fileName)

    const { _id } = await createFileInformation({
      path: fileName,
      events: [{ type: 'created', date: new Date() }],
      metadatas: metadonnees
    })

    return { fileName, rawfileId: _id.toString() }
  }
}
