import { LabelStatus, Sources, DecisionTJDTO, DecisionAssociee } from 'dbsder-api-types'
import { hashDecisionId } from '../../../shared/infrastructure/utils/hash.utils'
import {
  MetadonneeDto
} from '../../../shared/infrastructure/dto/metadonnee.dto'

export function mapDecisionNormaliseeToDecisionDto(
  generatedId: string,
  decisionContent: string,
  metadonnees: MetadonneeDto,
  filename: string
): DecisionTJDTO {
  return {
    endCaseCode: "", // metadonnees.codeDecision,
    NPCode: "", // metadonnees.codeNature,
    codeService: "", // metadonnees.codeService,
    debatPublic: false, //metadonnees.debatPublic,
    decisionAssociee: formatDecisionAssociee(metadonnees.decisionAssociee),
    libelleEndCaseCode: "", // metadonnees.libelleCodeDecision,
    libelleNAC: "", // metadonnees.libelleNAC,
    libelleNatureParticuliere: "", // metadonnees.libelleNature,
    libelleService: "", // metadonnees.libelleService,
    matiereDeterminee: false, // metadonnees.matiereDeterminee,
    numeroRoleGeneral: "", // metadonnees.numeroRoleGeneral,
    pourvoiCourDeCassation: false, // metadonnees.pourvoiCourDeCassation,
    pourvoiLocal: false, // metadonnees.pourvoiLocal,
    president: null,// metadonnees.president,
    recommandationOccultation: null, // metadonnees.recommandationOccultation,
    selection: false, // metadonnees.selection,
    sommaire: "", // metadonnees.sommaire,
    NACCode: "", // metadonnees.codeNAC,
    appeals: [], // metadonnees.numeroMesureInstruction ?? [],
    blocOccultation: 0,
    chamberId: '',
    chamberName: '',
    dateCreation: new Date().toISOString(),
    dateDecision: parseDate(metadonnees.dateDecision).toISOString(),
    idDecisionTJ: generatedId,
    jurisdictionCode: "", // metadonnees.codeJuridiction,
    jurisdictionId: "", // metadonnees.idJuridiction,
    jurisdictionName: "", // metadonnees.nomJuridiction,
    labelStatus: LabelStatus.TOBETREATED,
    occultation: {
      additionalTerms: '', // metadonnees.occultationComplementaire ?? '',
      categoriesToOmit: [],
      motivationOccultation: undefined
    },
    originalText: decisionContent,
    public: metadonnees.decisionPublique,
    registerNumber: "", // metadonnees.numeroRegistre,
    sourceId: hashDecisionId(generatedId),
    sourceName: Sources.TCOM,
    filenameSource: filename,
    parties: metadonnees.parties,
    indicateurQPC: false, // metadonnees.indicateurQPC,
    idDecisionWinci: metadonnees.idDecision
  }
}

function parseDate(dateDecision: string) {
  const year = dateDecision.substring(0, 4),
    month = dateDecision.substring(4, 6),
    date = dateDecision.substring(6, 8)

  return new Date(parseInt(year), parseInt(month) - 1, parseInt(date))
}

function formatDecisionAssociee(providedDecisionAssociee: DecisionAssocieeDto): DecisionAssociee {
  if (!providedDecisionAssociee) return undefined
  const { idDecision, ...decisionAssociee } = providedDecisionAssociee
  return { ...decisionAssociee, idDecisionWinci: idDecision }
}
