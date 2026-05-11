import { ObjectId } from 'mongodb'
import { MetadonneeDto } from 'src/shared/infrastructure/dto/metadonnee.dto'
export interface DecisionRepository {
  saveDecisionIntegre(decisionIntegre: Express.Multer.File, fileName: string): Promise<void>
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

export type TcomDeletion = {
  decisionId: string
  events: [Created, ...(Blocked | Deleted)[]]
}

export interface RawFilesRepository {
  createFileInformation(file: RawTcom): Promise<{ _id: ObjectId } & RawTcom>
  createDeleteInformation(file: TcomDeletion): Promise<{ _id: ObjectId } & TcomDeletion>
}
