import { v4 as uuidv4 } from 'uuid'
import { removeOrReplaceUnnecessaryCharacters } from './services/removeOrReplaceUnnecessaryCharacters'
import { ConvertedDecisionWithMetadonneesDto } from '../../shared/infrastructure/dto/convertedDecisionWithMetadonnees.dto'
import { logger } from './index'
import { fetchDecisionListFromS3 } from './services/fetchDecisionListFromS3'
import { DecisionS3Repository } from '../../shared/infrastructure/repositories/decisionS3.repository'
import { mapDecisionNormaliseeToDecisionDto } from './infrastructure/decision.dto'
import { computeLabelStatus } from './services/computeLabelStatus'
import { computeOccultation } from './services/computeOccultation'
import { DbSderApiGateway } from './repositories/gateways/dbsderApi.gateway'
import { normalizationFormatLogs } from './index'
import {
  fetchPDFFromS3,
  fetchNLPDataFromPDF,
  markdownToPlainText,
  NLPPDFToTextDTO,
  isEmptyText
} from './services/PDFToText'
import { PostponeException } from './infrastructure/nlp.exception'

const dbSderApiGateway = new DbSderApiGateway()
const bucketNameIntegre = process.env.S3_BUCKET_NAME_RAW

export async function normalizationJob(): Promise<ConvertedDecisionWithMetadonneesDto[]> {
  const listConvertedDecision: ConvertedDecisionWithMetadonneesDto[] = []
  const s3Repository = new DecisionS3Repository(logger)

  let decisionList = (await fetchDecisionListFromS3(s3Repository)).filter((name) =>
    name.endsWith('.json')
  )

  while (decisionList.length > 0) {
    for (const decisionFilename of decisionList) {
      try {
        const jobId = uuidv4()
        normalizationFormatLogs.correlationId = jobId

        // Step 1: Fetch decision from S3
        const decision = await s3Repository.getDecisionByFilename(decisionFilename)

        if (process.env.PLAINTEXT_SOURCE === 'nlp') {
          // Step 2a, use pdf-to-text NLP API:

          // Fetch PDF from -pdf bucket
          const pdfFilename: string = decisionFilename.replace(/\.json$/, '.pdf')
          const pdfFile = await fetchPDFFromS3(s3Repository, pdfFilename)

          try {
            // Transforming decision from PDF to text

            // 1. Get data from NLP API:
            const NLPData: NLPPDFToTextDTO = await fetchNLPDataFromPDF(pdfFile, pdfFilename)

            // 2. Get plain text from markdown:
            decision.texteDecisionIntegre = markdownToPlainText(NLPData.markdownText)

            // 3. Store NLP data in -pdf-success bucket:
            await s3Repository.archiveSuccessPDF(NLPData, pdfFilename)
          } catch (error) {
            if (error instanceof PostponeException === false) {
              // *Move* failed PDF to pdf-failed bucket:
              await s3Repository.archiveFailedPDF(pdfFile, pdfFilename)
              await s3Repository.deleteDecision({
                Bucket: process.env.S3_BUCKET_NAME_PDF,
                Key: pdfFilename
              })
            }
            throw error
          }

          logger.info({
            ...normalizationFormatLogs,
            msg: 'Plain text extracted by NLP API from collected PDF file'
          })
        } else {
          // Step 2b, use texteDecisionIntegre property:

          if (isEmptyText(decision.texteDecisionIntegre)) {
            throw new Error('Collected texteDecisionIntegre property is empty')
          }

          logger.info({
            ...normalizationFormatLogs,
            msg: 'Plain text from collected texteDecisionIntegre property'
          })
        }

        // Step 3: Cloning decision to save it in normalized bucket
        const decisionFromS3Clone = JSON.parse(JSON.stringify(decision))

        logger.info({
          ...normalizationFormatLogs,
          msg: 'Starting normalization of ' + decisionFilename
        })

        // Step 4: Generating unique id for decision
        const _id = decision.metadonnees.idDecision
        normalizationFormatLogs.data = { decisionId: _id }

        logger.info({ ...normalizationFormatLogs, msg: 'Generated unique id for decision' })

        // Step 5: Removing or replace (by other thing) unnecessary characters from decision
        const cleanedDecision = removeOrReplaceUnnecessaryCharacters(decision.texteDecisionIntegre)

        logger.info({
          ...normalizationFormatLogs,
          msg: 'Removed unnecessary characters'
        })

        // Step 6: Map decision to DBSDER API Type to save it in database
        const decisionToSave = mapDecisionNormaliseeToDecisionDto(
          _id,
          cleanedDecision,
          decision.metadonnees,
          decisionFilename
        )
        decisionToSave.labelStatus = await computeLabelStatus(decisionToSave)
        decisionToSave.occultation = {
          additionalTerms: '',
          categoriesToOmit: [],
          motivationOccultation: false
        }
        decisionToSave.occultation = computeOccultation(decision.metadonnees)

        // Step 7: Save decision in database
        await dbSderApiGateway.saveDecision(decisionToSave)
        logger.info({ ...normalizationFormatLogs, msg: 'Decision saved in database' })

        // Step 8: Save decision in normalized bucket
        await s3Repository.saveDecisionNormalisee(
          JSON.stringify(decisionFromS3Clone),
          decisionFilename
        )

        logger.info({
          ...normalizationFormatLogs,
          msg: 'Decision saved in normalized bucket. Deleting decision in raw bucket'
        })

        logger.info({
          ...normalizationFormatLogs,
          msg: 'Decision saved in normalized bucket. Deleting decision in raw bucket'
        })

        // Step 9: Delete decision in raw bucket
        const reqParamsDelete = {
          Bucket: bucketNameIntegre,
          Key: decisionFilename
        }
        await s3Repository.deleteDecision(reqParamsDelete)

        logger.info({
          ...normalizationFormatLogs,
          msg: 'Successful normalization of ' + decisionFilename
        })
        listConvertedDecision.push({
          metadonnees: decisionToSave,
          decisionNormalisee: cleanedDecision
        })
      } catch (error) {
        logger.error({
          ...normalizationFormatLogs,
          msg: error.message,
          data: error
        })
        logger.error({
          ...normalizationFormatLogs,
          msg: 'Failed to normalize the decision ' + decisionFilename + '.'
        })
        // To avoid too many request errors (as in Label):
        if (error instanceof PostponeException) {
          await new Promise((_) => setTimeout(_, 15 * 1000))
        } else {
          await new Promise((_) => setTimeout(_, 5 * 1000))
        }
        continue
      }
    }
    const lastTreatedDecisionFileName = decisionList[decisionList.length - 1]
    decisionList = await fetchDecisionListFromS3(s3Repository, lastTreatedDecisionFileName)
  }

  if (listConvertedDecision.length == 0) {
    logger.info({ ...normalizationFormatLogs, msg: 'No decision to normalize.' })
    return []
  }

  return listConvertedDecision
}
