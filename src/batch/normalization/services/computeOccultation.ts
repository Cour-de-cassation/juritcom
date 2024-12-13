import { DecisionOccultation, Occultation } from 'dbsder-api-types'
import { logger, normalizationFormatLogs } from '../index'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'
import { OccultationComplementaireDto } from '../../../shared/infrastructure/dto/metadonnee.dto'

export function computeOccultation(
  occultationsComplementaires: OccultationComplementaireDto
): DecisionOccultation {
  const formatLogs: LogsFormat = {
    ...normalizationFormatLogs,
    operationName: 'computeOccultation',
    msg: 'Starting computeOccultation...'
  }

  const additionalTerms = ''
  const motivationOccultation = false
  /*
  const additionalTerms =
    recommandationOccultation === Occultation.SUBSTITUANT ||
    recommandationOccultation === Occultation.COMPLEMENT
      ? occultationSupplementaire
      : ''

  logger.info({
    ...formatLogs,
    msg: `additionalTerms computed`
  })

  const motivationOccultation =
    recommandationOccultation === Occultation.AUCUNE ||
    recommandationOccultation === Occultation.SUBSTITUANT
      ? false
      : !debatPublic

  logger.info({
    ...formatLogs,
    msg: `motivationOccultation computed ${motivationOccultation}`
  })
    */

  return {
    additionalTerms,
    categoriesToOmit: [],
    motivationOccultation
  }
}
