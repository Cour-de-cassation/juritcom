import { ObjectId } from 'bson'
import { CollectDto } from 'src/shared/infrastructure/dto/collect.dto'
import { MetadonneeDto } from 'src/shared/infrastructure/dto/metadonnee.dto'
export interface DecisionRepository {
  deleteDataDecisionIntegre(jsonS3Key: string): Promise<void>

  uploadFichierDecisionIntegre(
    fichierDecisionIntegre: Express.Multer.File | Buffer,
    originalPdfFileName: string,
    pdfS3Key: string
  ): Promise<void>

  getDecisionByFilename(filename: string): Promise<CollectDto & { _id: string }>
}

type Created = {
  type: 'created'
  date: Date
}
type Normalized = {
  type: 'normalized'
  date: Date
}
type Blocked = {
  type: 'blocked'
  date: Date
  reason: string
}
type Deleted = {
  type: 'deleted'
  date: Date
}
export type Event = Created | Normalized | Blocked | Deleted

export type RawTcom = {
  path: string
  events: [Created, ...Event[]]
  metadatas: MetadonneeDto
}

export interface RawFilesRepository {
  findFileInformation(key: Partial<RawTcom>): Promise<RawTcom & { _id: ObjectId }>
  createFileInformation(file: RawTcom): Promise<unknown>
  updateFileInformation(id: ObjectId, update: Partial<RawTcom>): Promise<{ _id: ObjectId }>
}
