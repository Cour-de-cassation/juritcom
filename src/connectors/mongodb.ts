import { Document, MongoClient, OptionalUnlessRequiredId, InferIdType, Db } from 'mongodb'
import { FILE_DB_URL, S3_BUCKET_NAME_PDF, DELETION_COLLECTION_NAME } from '../config/env'
import { logger } from '../config/logger'
import { Metadonnee } from 'src/services/decisions/models'

let dbPromise: Promise<Db> | null = null

function getDb(): Promise<Db> {
  if (!dbPromise) {
    const client = new MongoClient(FILE_DB_URL)
    dbPromise = client.connect().then((c) => c.db())
  }
  return dbPromise
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
  metadatas: { texteDecisionIntegre: string; metadonnees: Metadonnee }
}

export type TcomDeletion = {
  decisionId: string
  events: [Created, ...(Blocked | Deleted)[]]
}

export async function saveFileMetadata<T extends Document>(
  file: OptionalUnlessRequiredId<T>
): Promise<{ _id: InferIdType<T> } & typeof file> {
  const db = await getDb()
  const { insertedId } = await db.collection<T>(S3_BUCKET_NAME_PDF).insertOne(file)
  return { _id: insertedId, ...file }
}

export async function saveDeleteMetadata<T extends Document>(
  file: OptionalUnlessRequiredId<T>
): Promise<{ _id: InferIdType<T> } & typeof file> {
  const db = await getDb()
  const { insertedId } = await db.collection<T>(DELETION_COLLECTION_NAME).insertOne(file)
  return { _id: insertedId, ...file }
}

export async function checkDbHealth(): Promise<boolean> {
  try {
    const db = await getDb()
    await db.command({ ping: 1 })
    return true
  } catch (error) {
    logger.error({
      operations: ['other', 'healthCheck'],
      path: 'src/connectors/mongodb.ts',
      message: JSON.stringify({ msg: error.message, data: error }),
      stack: error.stack
    })
    return false
  }
}
