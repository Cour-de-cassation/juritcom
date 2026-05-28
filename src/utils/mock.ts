import {
  JusticeFunctionTcom,
  JusticeRoleTcom,
  QualitePartieExhaustive,
  TypePartieExhaustive,
  Metadonnee,
  Composition,
  Partie
} from '../services/decisions/models'

export class MockUtils {
  uniqueDecisionId = `0605_2001F00930_2012-12-05_19`

  mandatoryPartieDtoMock: Partie = {
    nom: 'some valid name',
    type: TypePartieExhaustive.AA,
    qualite: QualitePartieExhaustive.G,
    role: JusticeRoleTcom.AVOCAT
  }

  compositionDtoMock: Composition = {
    fonction: JusticeFunctionTcom.GRF,
    nom: 'Dupond',
    prenom: 'Henry',
    civilite: 'Monsieur'
  }

  mandatoryMetadonneesDtoMock: Metadonnee = {
    idDecision: this.uniqueDecisionId,
    idGroupement: '01',
    idJuridiction: '0605',
    libelleJuridiction: 'Tribunal de commerce de Paris',
    dateDecision: '20241224',
    numeroDossier: '2001F00930',
    decisionPublique: true,
    debatChambreDuConseil: false,
    interetParticulier: false
  }

  metadonneeDtoMock: Metadonnee = {
    ...this.mandatoryMetadonneesDtoMock,
    parties: [this.mandatoryPartieDtoMock],
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
