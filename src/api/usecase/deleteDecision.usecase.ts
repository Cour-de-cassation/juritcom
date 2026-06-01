import { createDeleteInformation } from 'src/shared/infrastructure/repositories/decisionMongo.repository'

export class DeleteDecisionUsecase {
  async deleteDecision(decisionId: string): Promise<{ rawfileId: string }> {
    const { _id } = await createDeleteInformation({
      decisionId,
      events: [{ type: 'created', date: new Date() }]
    })

    return { rawfileId: _id.toString() }
  }
}
