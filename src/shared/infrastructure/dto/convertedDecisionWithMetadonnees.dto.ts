import { DecisionDTO } from 'dbsder-api-types'

export class ConvertedDecisionWithMetadonneesDto {
  decisionNormalisee: string
  metadonnees: DecisionDTO
}
