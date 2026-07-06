import { v4 as uuidv4 } from 'uuid'
import { Metadonnee } from './models'
import { saveDecisionFile } from '../../connectors/s3'
import { saveFileMetadata, saveDeleteMetadata, RawTcom } from '../../connectors/mongodb'

export async function saveDecision(
  fichierDecisionIntegre: Express.Multer.File,
  metadonnees: Metadonnee,
  texteDecisionIntegre: string
): Promise<{ fileName: string; rawfileId: string }> {
  const fileName = uuidv4() + '.pdf'

  await saveDecisionFile(fichierDecisionIntegre, fileName)

  const { _id } = await saveFileMetadata<RawTcom>({
    path: fileName,
    events: [{ type: 'created', date: new Date() }],
    metadatas: { texteDecisionIntegre, metadonnees }
  })

  return { fileName, rawfileId: _id.toString() }
}

export async function deleteDecision(decisionId: string): Promise<{ rawfileId: string }> {
  const { _id } = await saveDeleteMetadata({
    decisionId,
    events: [{ type: 'created', date: new Date() }]
  })

  return { rawfileId: _id.toString() }
}
