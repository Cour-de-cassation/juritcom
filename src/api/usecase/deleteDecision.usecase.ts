import { DecisionRepository } from '../domain/decisions/repositories/decision.repository'

export class DeleteDecisionUsecase {

  constructor(private decisionsRepository: DecisionRepository) {
  }

  async deleteDecision(
    decisionId: string
  ): Promise<string> {
    const jsonFileName = `${decisionId}.json`

    await this.decisionsRepository.deleteDataDecisionIntegre(
      jsonFileName
    )

    // @TODO propagate deletion to DBSDER 

    return jsonFileName
  }
}
