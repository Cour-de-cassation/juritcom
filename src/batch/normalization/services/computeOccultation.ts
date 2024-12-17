import { DecisionOccultation, Categories } from 'dbsder-api-types'
import { logger, normalizationFormatLogs } from '../index'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'
import {
  OccultationComplementaireDto,
  MetadonneeDto
} from '../../../shared/infrastructure/dto/metadonnee.dto'

export function computeOccultation(metadonnees: MetadonneeDto): DecisionOccultation {
  const occultationsComplementaires: OccultationComplementaireDto =
    metadonnees.occultationsComplementaires
  const additionalTerms = ''
  const categoriesToOmit = []
  const formatLogs: LogsFormat = {
    ...normalizationFormatLogs,
    operationName: 'computeOccultation',
    msg: 'Starting computeOccultation...'
  }

  const motivationOccultation =
    occultationsComplementaires.motifsDebatsChambreConseil === true ||
    occultationsComplementaires.motifsSecretAffaires === true ||
    metadonnees.debatChambreDuConseil === true

  logger.info({
    ...formatLogs,
    msg: `motivationOccultation computed ${motivationOccultation}`
  })

  if (occultationsComplementaires.personneMorale !== true) {
    categoriesToOmit.push(Categories.PERSONNEMORALE)
  }

  if (occultationsComplementaires.personnePhysicoMoraleGeoMorale !== true) {
    categoriesToOmit.push(Categories.PERSONNEPHYSIQUE)
    categoriesToOmit.push(Categories.ETABLISSEMENT)
  }

  if (occultationsComplementaires.adresse !== true) {
    categoriesToOmit.push(Categories.ADRESSE)
  }

  if (occultationsComplementaires.dateCivile !== true) {
    categoriesToOmit.push(Categories.DATENAISSANCE)
    categoriesToOmit.push(Categories.DATEDECES)
    categoriesToOmit.push(Categories.DATEMARIAGE)
  }

  if (occultationsComplementaires.plaqueImmatriculation !== true) {
    categoriesToOmit.push(Categories.PLAQUEIMMATRICULATION)
  }

  if (occultationsComplementaires.cadastre !== true) {
    categoriesToOmit.push(Categories.ADRESSE)
    categoriesToOmit.push(Categories.CADASTRE)
    categoriesToOmit.push(Categories.LOCALITE)
  }

  if (occultationsComplementaires.chaineNumeroIdentifiante !== true) {
    categoriesToOmit.push(Categories.INSEE)
    categoriesToOmit.push(Categories.NUMEROIDENTIFIANT)
    categoriesToOmit.push(Categories.COMPTEBANCAIRE)
    categoriesToOmit.push(Categories.NUMEROSIRETSIREN)
    categoriesToOmit.push(Categories.TELEPHONEFAX)
  }

  if (occultationsComplementaires.coordonneeElectronique !== true) {
    categoriesToOmit.push(Categories.SITEWEBSENSIBLE)
  }

  if (occultationsComplementaires.professionnelMagistratGreffier !== true) {
    categoriesToOmit.push(Categories.PROFESSIONNELAVOCAT)
    categoriesToOmit.push(Categories.PROFESSIONNELMAGISTRATGREFFIER)
  }

  logger.info({
    ...formatLogs,
    msg: `categoriesToOmit computed ${categoriesToOmit}`
  })

  /* @TODO using
  occultationsComplementaires.conserverElement and occultationsComplementaires.supprimerElement :

  const additionalTerms =
    recommandationOccultation === Occultation.SUBSTITUANT ||
    recommandationOccultation === Occultation.COMPLEMENT
      ? occultationSupplementaire
      : ''
    */

  logger.info({
    ...formatLogs,
    msg: `additionalTerms computed ${additionalTerms}`
  })

  return {
    additionalTerms,
    categoriesToOmit,
    motivationOccultation
  }
}
