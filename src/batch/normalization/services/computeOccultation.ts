import { DecisionOccultation, Categories } from 'dbsder-api-types'
import { logger, normalizationFormatLogs } from '../index'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'
import {
  OccultationComplementaireDto,
  MetadonneeDto
} from '../../../shared/infrastructure/dto/metadonnee.dto'

function isNonEmptyString(str: string | undefined): str is string {
  return typeof str === 'string' && str.trim() !== ''
}

function occultationsDataAreEmpty(
  occultationsComplementaires: OccultationComplementaireDto
): boolean {
  if (occultationsComplementaires.personneMorale === true) {
    return false
  }
  if (occultationsComplementaires.personnePhysicoMoraleGeoMorale === true) {
    return false
  }
  if (occultationsComplementaires.adresse === true) {
    return false
  }
  if (occultationsComplementaires.dateCivile === true) {
    return false
  }
  if (occultationsComplementaires.plaqueImmatriculation === true) {
    return false
  }
  if (occultationsComplementaires.cadastre === true) {
    return false
  }
  if (occultationsComplementaires.chaineNumeroIdentifiante === true) {
    return false
  }
  if (occultationsComplementaires.coordonneeElectronique === true) {
    return false
  }
  if (occultationsComplementaires.professionnelMagistratGreffier === true) {
    return false
  }
  if (occultationsComplementaires.motifsDebatsChambreConseil === true) {
    return false
  }
  if (occultationsComplementaires.motifsSecretAffaires === true) {
    return false
  }
  if (
    occultationsComplementaires.conserverElement &&
    isNonEmptyString(occultationsComplementaires.conserverElement)
  ) {
    return false
  }
  if (
    occultationsComplementaires.supprimerElement &&
    isNonEmptyString(occultationsComplementaires.supprimerElement)
  ) {
    return false
  }
  return true
}

export function computeOccultation(metadonnees: MetadonneeDto): DecisionOccultation {
  const occultationsComplementaires: OccultationComplementaireDto =
    metadonnees.occultationsComplementaires

  const formatLogs: LogsFormat = {
    ...normalizationFormatLogs,
    operationName: 'computeOccultation',
    msg: 'Starting computeOccultation...'
  }

  if (occultationsDataAreEmpty(occultationsComplementaires)) {
    logger.warn({
      ...formatLogs,
      msg: `Empty occultations form received, applying the default "bloc 3" signature`,
      idJuridiction: metadonnees.idJuridiction,
      libelleJuridiction: metadonnees.libelleJuridiction
    })

    return {
      additionalTerms: '',
      categoriesToOmit: [
        Categories.PERSONNEMORALE,
        Categories.NUMEROSIRETSIREN,
        Categories.PROFESSIONNELMAGISTRATGREFFIER
      ],
      motivationOccultation: false
    }
  } else {
    const categoriesToOmitRaw = []
    const additionalTermsRaw = []
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

    if (occultationsComplementaires.professionnelMagistratGreffier !== true) {
      categoriesToOmitRaw.push(Categories.PROFESSIONNELMAGISTRATGREFFIER)
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
}
