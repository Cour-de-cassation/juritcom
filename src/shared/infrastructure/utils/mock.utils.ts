import { QualitePartie, TypePartie } from 'dbsder-api-types'
import { AdresseDto, CompositionDto, MetadonneeDto, PartieDto } from '../dto/metadonnee.dto'

export class MockUtils {
  // Shared context
  uniqueDecisionId = `TJ75011A01-1234520240120`

  mandatoryPartieDtoMock = {
    nom: 'some valid name',
    type: TypePartie.AA,
    qualite: QualitePartie.G,
    role: 'Avocat'
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
    composition: [],
    idDecision: 'TJ00001',
    idGroupement: 'ABDC',
    libelleJuridiction: 'Tribunal judiciaire de Paris',
    idJuridiction: 'TJ7501',
    numeroDossier: '08/20240',
    dateDecision: '20240120',
    decisionPublique: true,
    interetParticulier: false,
    debatChambreDuConseil: false
  }

  compositionDtoMock: CompositionDto = {
    fonction: 'GRF',
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
    composition: [this.compositionDtoMock]
  }
}
