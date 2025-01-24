import { DecisionTCOMDTO, LabelStatus } from 'dbsder-api-types'
import { logger } from '../index'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'
import { normalizationFormatLogs } from '../index'
import { authorizedCharacters } from '../infrastructure/authorizedCharactersList'

const dateMiseEnService = getMiseEnServiceDate()
const authorizedCharactersdSet = new Set(authorizedCharacters)

export function computeLabelStatus(decisionDto: DecisionTCOMDTO): LabelStatus {
  const dateCreation = new Date(decisionDto.dateCreation)
  const dateDecision = new Date(decisionDto.dateDecision)

  const formatLogs: LogsFormat = {
    ...normalizationFormatLogs,
    operationName: 'computeLabelStatus',
    msg: 'Starting computeLabelStatus...'
  }

  if (decisionDto.debatPublic === false && decisionDto.public === false) {
    logger.error({
      ...formatLogs,
      msg: `Decision debates are not public. Changing LabelStatus to ${LabelStatus.IGNORED_DEBAT_NON_PUBLIC}.`
    })
    return LabelStatus.IGNORED_DEBAT_NON_PUBLIC
  }

  if (decisionDto.public === false) {
    logger.error({
      ...formatLogs,
      msg: `Decision is not public. Changing LabelStatus to ${LabelStatus.IGNORED_DECISION_NON_PUBLIQUE}.`
    })
    return LabelStatus.IGNORED_DECISION_NON_PUBLIQUE
  }

  if (isDecisionInTheFuture(dateCreation, dateDecision)) {
    logger.error({
      ...formatLogs,
      msg: `Incorrect date, dateDecision must be before dateCreation. Changing LabelStatus to ${LabelStatus.IGNORED_DATE_DECISION_INCOHERENTE}.`
    })
    return LabelStatus.IGNORED_DATE_DECISION_INCOHERENTE
  }

  if (isDecisionOlderThanMiseEnService(dateDecision)) {
    logger.error({
      ...formatLogs,
      msg: `Incorrect date, dateDecision must be after mise en service. Changing LabelStatus to ${LabelStatus.IGNORED_DATE_AVANT_MISE_EN_SERVICE}.`
    })
    return LabelStatus.IGNORED_DATE_AVANT_MISE_EN_SERVICE
  }

  if (!decisionContainsOnlyAuthorizedCharacters(decisionDto.originalText)) {
    logger.error({
      ...formatLogs,
      msg: `Decision can not be treated by Judilibre because its text contains unknown characters. Changing LabelStatus to ${LabelStatus.IGNORED_CARACTERE_INCONNU}.`
    })
    return LabelStatus.IGNORED_CARACTERE_INCONNU
  }

  return decisionDto.labelStatus
}

function isDecisionInTheFuture(dateCreation: Date, dateDecision: Date): boolean {
  return dateDecision > dateCreation
}

function isDecisionOlderThanMiseEnService(dateDecision: Date): boolean {
  return dateDecision < dateMiseEnService
}

function decisionContainsOnlyAuthorizedCharacters(originalText: string): boolean {
  for (let i = 0; i < originalText.length; i++) {
    if (!authorizedCharactersdSet.has(originalText[i])) {
      // Character not found in authorizedSet
      return false
    }
  }
  return true
}

function getMiseEnServiceDate(): Date {
  if (!isNaN(new Date(process.env.COMMISSIONING_DATE).getTime())) {
    return new Date(process.env.COMMISSIONING_DATE)
  } else {
    return new Date('2024-12-31')
  }
}
