import {
  Document,
  MongoClient,
  OptionalUnlessRequiredId,
  InferIdType,
  Db,
  WithId,
  Filter,
  ObjectId,
} from "mongodb"
import { RawFilesRepository } from '../../../api/domain/decisions/repositories/decision.repository'

export class DecisionMongoRepository implements RawFilesRepository {
  private db: Promise<Db>

  constructor() {
    const client = new MongoClient(process.env.FILE_DB_URL)
    this.db = client.connect().then(_ => _.db())
  }

  async findFileInformation<T extends Document>(
    key: Partial<T>
  ): Promise<WithId<T>> {
    const db = await this.db
    return db
      .collection<T>(process.env.S3_BUCKET_NAME_PDF)
      .findOne({ ...key } as Filter<T>)
  }

  async createFileInformation<T extends Document>(
    file: OptionalUnlessRequiredId<T>,
  ): Promise<{ _id: InferIdType<T> } & typeof file> {
    const db = await this.db
    const { insertedId } = await db
      .collection<T>(process.env.S3_BUCKET_NAME_PDF)
      .insertOne(file)
    return { _id: insertedId, ...file }
  }

  async updateFileInformation<T extends Document>(
    id: ObjectId,
    update: Partial<T>
  ): Promise<{ _id: InferIdType<T> }> {
    const db = await this.db
    const { upsertedId }  = await db
      .collection<T>(process.env.S3_BUCKET_NAME_PDF)
      .updateOne({ _id: id } as Filter<T>, update)

    return { _id: upsertedId }
  }
}
