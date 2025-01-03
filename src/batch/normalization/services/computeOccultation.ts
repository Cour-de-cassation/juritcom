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
  const categoriesToOmitRaw = []
  const additionalTermsRaw = []
  const formatLogs: LogsFormat = {
    ...normalizationFormatLogs,
    operationName: 'computeOccultation',
    msg: 'Starting computeOccultation...'
  }

  const motivationOccultation =
    occultationsComplementaires.motifsDebatsChambreConseil === true ||
    occultationsComplementaires.motifsSecretAffaires === true

  logger.info({
    ...formatLogs,
    msg: `motivationOccultation computed ${motivationOccultation}`
  })

  if (occultationsComplementaires.personneMorale !== true) {
    categoriesToOmitRaw.push(Categories.PERSONNEMORALE)
    categoriesToOmitRaw.push(Categories.NUMEROSIRETSIREN)
  }

  if (occultationsComplementaires.personnePhysicoMoraleGeoMorale !== true) {
    categoriesToOmitRaw.push(Categories.PERSONNEMORALE)
    categoriesToOmitRaw.push(Categories.LOCALITE)
    categoriesToOmitRaw.push(Categories.NUMEROSIRETSIREN)
  }

  if (occultationsComplementaires.adresse !== true) {
    categoriesToOmitRaw.push(Categories.ADRESSE)
    categoriesToOmitRaw.push(Categories.LOCALITE)
    categoriesToOmitRaw.push(Categories.ETABLISSEMENT)
  }

  if (occultationsComplementaires.dateCivile !== true) {
    categoriesToOmitRaw.push(Categories.DATENAISSANCE)
    categoriesToOmitRaw.push(Categories.DATEDECES)
    categoriesToOmitRaw.push(Categories.DATEMARIAGE)
  }

  if (occultationsComplementaires.plaqueImmatriculation !== true) {
    categoriesToOmitRaw.push(Categories.PLAQUEIMMATRICULATION)
  }

  if (occultationsComplementaires.cadastre !== true) {
    categoriesToOmitRaw.push(Categories.CADASTRE)
  }

  if (occultationsComplementaires.chaineNumeroIdentifiante !== true) {
    categoriesToOmitRaw.push(Categories.INSEE)
    categoriesToOmitRaw.push(Categories.NUMEROIDENTIFIANT)
    categoriesToOmitRaw.push(Categories.COMPTEBANCAIRE)
    categoriesToOmitRaw.push(Categories.PLAQUEIMMATRICULATION)
  }

  if (occultationsComplementaires.coordonneeElectronique !== true) {
    categoriesToOmitRaw.push(Categories.SITEWEBSENSIBLE)
    categoriesToOmitRaw.push(Categories.TELEPHONEFAX)
  }

  if (occultationsComplementaires.professionnelMagistratGreffier === true) {
    additionalTermsRaw.push('#magistratGreffe')
  }

  const categoriesToOmit = categoriesToOmitRaw.filter(
    (value, index, array) => array.indexOf(value) === index
  )

  logger.info({
    ...formatLogs,
    msg: `categoriesToOmit computed ${categoriesToOmit}`
  })

  if (occultationsComplementaires.conserverElement) {
    for (let item of `${occultationsComplementaires.conserverElement}`.split('|')) {
      item = item.trim()
      if (item !== '') {
        additionalTermsRaw.push(`+${item}`)
      }
    }
  }

  if (occultationsComplementaires.supprimerElement) {
    for (let item of `${occultationsComplementaires.supprimerElement}`.split('|')) {
      item = item.trim()
      if (item !== '') {
        additionalTermsRaw.push(item)
      }
    }
  }

  const additionalTerms = additionalTermsRaw
    .filter((value, index, array) => array.indexOf(value) === index)
    .join('|')

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
