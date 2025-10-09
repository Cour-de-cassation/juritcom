import { DecisionRepository, RawFilesRepository } from '../domain/decisions/repositories/decision.repository'

export class DeleteDecisionUsecase {
  constructor(private decisionsRepository: DecisionRepository, private rawRepository: RawFilesRepository) {}

  async deleteDecision(decisionId: string): Promise<string> {
    const jsonFileName = `${decisionId}.json`

    await this.decisionsRepository.deleteDataDecisionIntegre(jsonFileName)

    try {
      const rawFile = await this.rawRepository.findFileInformation({ path: jsonFileName })
      await this.rawRepository.updateFileInformation(rawFile._id, {
         events: [...rawFile.events, { type: "deleted", date: new Date() }] 
      })
    } catch(err) {
      // needs to be think by a collect refacto
    }

    return jsonFileName
  }
}
