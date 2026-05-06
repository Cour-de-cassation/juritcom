import { RawFilesRepository } from '../domain/decisions/repositories/decision.repository'

export class DeleteDecisionUsecase {
  constructor(private rawRepository: RawFilesRepository) {}

  async deleteDecision(decisionId: string): Promise<string> {
    try {
      await this.rawRepository.createDeleteInformation({
        decisionId,
        events: [{ type: 'created', date: new Date() }]
      })
    } catch (err) {
      throw new Error(err)
    }

    return decisionId
  }
}
