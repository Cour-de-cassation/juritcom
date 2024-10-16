import { LabelStatus, Sources, DecisionDTO } from 'dbsder-api-types'
import { hashDecisionId } from '../../../shared/infrastructure/utils/hash.utils'
import { MetadonneeDto } from '../../../shared/infrastructure/dto/metadonnee.dto'

export function mapDecisionNormaliseeToDecisionDto(
  generatedId: string,
  decisionContent: string,
  metadonnees: MetadonneeDto,
  filename: string
): DecisionDTO {
  return {
    appeals: [], // Non trouvé,
    chamberId: metadonnees.idChambre ?? '', // @TODO Optionnel dans le swagger, mandatory dans dbsder-api ?
    chamberName: metadonnees.libelleChambre ?? '', // @TODO Optionnel dans le swagger, mandatory dans dbsder-api ?
    dateCreation: new Date().toISOString(),
    dateDecision: parseDate(metadonnees.dateDecision).toISOString(),
    jurisdictionCode: '', // Non trouvé,
    jurisdictionId: metadonnees.idJuridiction,
    jurisdictionName: metadonnees.libelleJuridiction,
    labelStatus: LabelStatus.TOBETREATED,
    occultation: {
      // @TODO
      additionalTerms: '',
      categoriesToOmit: [],
      motivationOccultation: false
    },
    originalText: decisionContent,
    registerNumber: '', // Non trouvé
    sourceId: hashDecisionId(generatedId),
    sourceName: Sources.TCOM,
    blocOccultation: 0,
    filenameSource: filename
  }
}

function parseDate(dateDecision: string) {
  const year = dateDecision.substring(0, 4),
    month = dateDecision.substring(4, 6),
    date = dateDecision.substring(6, 8)

  return new Date(parseInt(year), parseInt(month) - 1, parseInt(date))
}
