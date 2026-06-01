import { MongoClient, Db } from 'mongodb'
import {
  RawFilesRepository,
  RawTcom,
  TcomDeletion
} from '../../../api/domain/decisions/repositories/decision.repository'
import { ObjectId } from 'mongodb'

const client = new MongoClient(process.env.FILE_DB_URL)
const db: Promise<Db> = client.connect().then((_) => _.db())

export const createFileInformation: RawFilesRepository['createFileInformation'] = async (
  file: RawTcom
): Promise<{ _id: ObjectId } & RawTcom> => {
  const database = await db
  const { insertedId } = await database
    .collection<RawTcom>(process.env.S3_BUCKET_NAME_PDF)
    .insertOne(file)
  return { _id: insertedId, ...file }
}

export const createDeleteInformation: RawFilesRepository['createDeleteInformation'] = async (
  file: TcomDeletion
): Promise<{ _id: ObjectId } & TcomDeletion> => {
  const database = await db
  const { insertedId } = await database
    .collection<TcomDeletion>(process.env.DELETION_COLLECTION_NAME)
    .insertOne(file)
  return { _id: insertedId, ...file }
}
