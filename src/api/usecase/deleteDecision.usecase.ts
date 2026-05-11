import { RawFilesRepository } from '../domain/decisions/repositories/decision.repository'

export class DeleteDecisionUsecase {
  constructor(private rawRepository: RawFilesRepository) {}

  async deleteDecision(decisionId: string): Promise<{ rawfileId: string }> {
    const { _id } = await this.rawRepository.createDeleteInformation({
      decisionId,
      events: [{ type: 'created', date: new Date() }]
    })

    return { rawfileId: _id.toString() }
  }
}
