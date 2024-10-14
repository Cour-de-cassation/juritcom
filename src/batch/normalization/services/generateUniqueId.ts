import { logger } from '../index'
import { MetadonneeDto } from '../../../shared/infrastructure/dto/metadonnee.dto'
import { normalizationFormatLogs } from '../index'
import { LogsFormat } from 'src/shared/infrastructure/utils/logsFormat.utils'

const requiredKeys = ['idJuridiction', 'idGroupement', 'numeroDossier', 'dateDecision']

export function generateUniqueId(metadonnees: MetadonneeDto): string {
  if (hasMandatoryMetadonnees(metadonnees)) {
    const uniqueId =
      metadonnees.idJuridiction +
      metadonnees.idGroupement +
      metadonnees.numeroDossier +
      metadonnees.dateDecision

    return uniqueId.replaceAll('/', '-')
  } else {
    const formatLogs: LogsFormat = {
      ...normalizationFormatLogs,
      operationName: 'generateUniqueId',
      msg:
        'Could not generate unique ID based on metadata: ' +
        JSON.stringify({
          idJuridiction: metadonnees.idJuridiction,
          numeroRegistre: metadonnees.idGroupement,
          numeroRoleGeneral: metadonnees.numeroDossier,
          dateDecision: metadonnees.dateDecision
        })
    }
    logger.error(formatLogs)

    throw new Error('Could not generate unique ID based on metadata.')
  }
}

function hasMandatoryMetadonnees(metadonnees): boolean {
  for (const key of requiredKeys) {
    if (!(key in metadonnees) || metadonnees[key] === '') {
      return false
    }
  }
  return true
}
