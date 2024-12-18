import { DecisionTCOMDTO, LabelStatus, QualitePartie, Sources, TypePartie } from 'dbsder-api-types'
import {
  AdresseDto,
  CompositionDto,
  JusticeFunction,
  JusticeRole,
  MetadonneeDto,
  PartieDto
} from '../dto/metadonnee.dto'

export class MockUtils {
  // Shared context
  uniqueDecisionId = `0605_2001F00930_2012-12-05_19`
  dateNow = new Date()

  decisionContentToNormalize =
    '\tLe contenu de ma décision avec    des espaces     et des backslash multiples \r\n \t'
  decisionContentNormalized =
    ' Le contenu de ma décision avec des espaces et des backslash multiples \n '

  mandatoryPartieDtoMock = {
    nom: 'some valid name',
    type: TypePartie.AA,
    qualite: QualitePartie.G,
    role: JusticeRole.AVOCAT
  }

  adresseDtoMock: AdresseDto = {
    numero: '20bis',
    type: 'rue',
    voie: 'du Bourg',
    codePostal: '39100',
    complement: "Complement d'adresse",
    bureau: 'Bureau distributeur'
  }

  partieDtoMock: PartieDto = {
    ...this.mandatoryPartieDtoMock,
    nomUsage: 'some valid name',
    prenom: 'some valid name',
    alias: 'some valid name',
    prenomAutre: 'some valid name',
    civilite: 'some valid name',
    adresse: this.adresseDtoMock
  }

  mandatoryMetadonneesDtoMock: MetadonneeDto = {
    idDecision: this.uniqueDecisionId,
    idGroupement: '01',
    idJuridiction: '0605',
    libelleJuridiction: 'Tribunal de commerce de Paris',
    dateDecision: '20241224',
    numeroDossier: '2001F00930',
    decisionPublique: false,
    debatChambreDuConseil: false,
    interetParticulier: false
  }

  compositionDtoMock: CompositionDto = {
    fonction: JusticeFunction.GRF,
    nom: 'Dupond',
    prenom: 'Henry',
    civilite: 'Monsieur'
  }

  metadonneeDtoMock = {
    ...this.mandatoryMetadonneesDtoMock,
    parties: [this.partieDtoMock],
    occultationsComplementaires: {
      dateCivile: false,
      motifsSecretAffaires: false,
      cadastre: false,
      adresse: true,
      professionnelMagistratGreffier: false,
      plaqueImmatriculation: true,
      coordonneeElectronique: true,
      motifsDebatsChambreConseil: true,
      personneMorale: true,
      conserverElement: '#dateCivile|automobile',
      chaineNumeroIdentifiante: false,
      personnePhysicoMoraleGeoMorale: false,
      supprimerElement: '#magistratGreffe|120.000€'
    },
    composition: [this.compositionDtoMock],
    date: null
  }

  // End of normalization context
  decisionMock: DecisionTCOMDTO = {
    appeals: [],
    chamberId: '',
    chamberName: '',
    dateCreation: new Date(parseInt('2024'), parseInt('12') - 1, parseInt('25')).toISOString(),
    dateDecision: new Date(parseInt('2024'), parseInt('12') - 1, parseInt('24')).toISOString(),
    jurisdictionCode: '01_0605',
    jurisdictionId: this.mandatoryMetadonneesDtoMock.idJuridiction,
    jurisdictionName: this.mandatoryMetadonneesDtoMock.libelleJuridiction,
    labelStatus: LabelStatus.TOBETREATED,
    occultation: {
      additionalTerms: '',
      categoriesToOmit: [],
      motivationOccultation: false
    },
    originalText: this.decisionContentNormalized,
    registerNumber: '2001F00930',
    sourceId: 2187651241,
    sourceName: Sources.TCOM,
    blocOccultation: 0,
    public: false,
    idGroupement: '01',
    debatPublic: true,
    idDecisionTCOM: '0605_2001F00930_2012-12-05_19',
    selection: false
  }
}
