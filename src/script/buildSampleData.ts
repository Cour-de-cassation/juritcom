import { removeOrReplaceUnnecessaryCharacters } from '../batch/normalization/services/removeOrReplaceUnnecessaryCharacters'
import { mapDecisionNormaliseeToDecisionDto } from '../batch/normalization/infrastructure/decision.dto'
import { computeLabelStatus } from '../batch/normalization/services/computeLabelStatus'
import { computeOccultation } from '../batch/normalization/services/computeOccultation'

import * as path from 'path'
import * as fs from 'fs'

const basePath = path.join(__dirname, '..', '..', 'documentation', 'test', 'decisions')

async function job() {
  let decisionList = []

  for (let file of fs.readdirSync(basePath)) {
    if (/\d\.json$/.test(file) === true) {
      try {
        decisionList.push(JSON.parse(fs.readFileSync(path.join(basePath, file)).toString()))
      } catch (_ignore) {}
    }
  }

  for (const decision of decisionList) {
    try {
      // Step 1: Generating unique id for decision
      const _id = decision.metadonnees.idDecision

      // Step 2: Transforming decision from WPD to text
      const decisionContent = decision.texteDecisionIntegre

      // Step 3: Removing or replace (by other thing) unnecessary characters from decision
      const cleanedDecision = removeOrReplaceUnnecessaryCharacters(decisionContent) // (là aussi, à réévaluer avec les premiers lots de test)

      // Step 4: Map decision to DBSDER API Type to save it in database
      const decisionNormalized = mapDecisionNormaliseeToDecisionDto(
        _id,
        cleanedDecision,
        decision.metadonnees,
        `${_id}.json`
      )
      decisionNormalized.pseudoText = decisionNormalized.originalText
      decisionNormalized.labelStatus = computeLabelStatus(decisionNormalized)
      decisionNormalized.occultation = {
        additionalTerms: '',
        categoriesToOmit: [],
        motivationOccultation: false
      }
      decisionNormalized.occultation = computeOccultation(decision.metadonnees)
      fs.writeFileSync(
        path.join(basePath, `${_id}_normalized.json`),
        JSON.stringify(decisionNormalized)
      )

      // Step 5: Map decisionNormalized to Judilibre API
      const decisionPublished: any = {}
      decisionPublished.id = decisionNormalized._id
      decisionPublished.version = 1.0
      decisionPublished.source = decisionNormalized.sourceName
      decisionPublished.sourceId = `${decisionNormalized.sourceId}`
      decisionPublished.text = decisionNormalized.pseudoText
      decisionPublished.displayText = decisionNormalized.pseudoText
      decisionPublished.displayText = decisionNormalized.pseudoText
      decisionNormalized.zoning = null
      if (decisionNormalized.chamberName) {
        decisionPublished.chamber = decisionNormalized.chamberName
      } else {
        decisionPublished.chamber = ''
      }
      let dateForIndexing = null
      try {
        let date = new Date(Date.parse(decisionNormalized.dateDecision))
        if (isNaN(date.getTime())) {
          dateForIndexing = null
        } else {
          date.setHours(date.getHours() + 2)
          dateForIndexing = date.getFullYear() + '-'
          dateForIndexing +=
            (date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-'
          dateForIndexing += date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
        }
      } catch (_e) {
        dateForIndexing = null
      }
      decisionPublished.decision_date = dateForIndexing
      let dateTimeForIndexing = null
      try {
        dateTimeForIndexing = new Date(Date.parse(decisionNormalized.dateDecision))
        if (isNaN(dateTimeForIndexing.getTime())) {
          dateTimeForIndexing = null
        }
      } catch (e) {
        dateTimeForIndexing = null
      }
      decisionPublished.decision_datetime = dateTimeForIndexing
      decisionPublished.jurisdiction = 'tcom'
      decisionPublished.location = `${decisionNormalized.jurisdictionId}`.toLowerCase().trim()
      decisionPublished.number = [decisionNormalized.registerNumber]
      decisionPublished.partial = false
      decisionPublished.lowInterest = false
      decisionPublished.particularInterest = decisionNormalized.selection === true
      fs.writeFileSync(
        path.join(basePath, `${_id}_published.json`),
        JSON.stringify(decisionPublished)
      )
    } catch (error) {
      console.error(error)
      continue
    }
  }
  process.exit(0)
}

job()
