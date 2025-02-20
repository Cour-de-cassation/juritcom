import { DecisionS3Repository } from '../../../shared/infrastructure/repositories/decisionS3.repository'
import { InfrastructureException } from '../../../shared/infrastructure/exceptions/infrastructure.exception'
import { logger, normalizationFormatLogs } from '..'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'
import * as FormData from 'form-data'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { PostponeException } from '../infrastructure/nlp.exception'
import { marked } from 'marked'
import plaintify from 'marked-plaintify'

export interface NLPPDFToTextDTO {
  markdownText?: string
  images?: object
  versions?: object
}

export async function fetchPDFFromS3(
  s3Repository: DecisionS3Repository,
  pdfFilename: string
): Promise<Buffer> {
  try {
    return await s3Repository.getPDFByFilename(pdfFilename)
  } catch (error) {
    const formatLogs: LogsFormat = {
      ...normalizationFormatLogs,
      operationName: 'fetchPDFFromS3',
      msg: error.message
    }
    logger.error({
      ...formatLogs
    })
    throw new InfrastructureException(error.message)
  }
}

export async function fetchNLPDataFromPDF(pdfFile: Buffer, pdfFilename: string): Promise<object> {
  const formData: FormData = new FormData()
  formData.append('pdf_file', pdfFile, pdfFilename)
  try {
    const response: AxiosResponse = await axios.post(
      `${process.env.NLP_PSEUDONYMISATION_API_URL}/pdf-to-text`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    )
    return response.data
  } catch (error) {
    const formatLogs: LogsFormat = {
      ...normalizationFormatLogs,
      operationName: 'fetchNLPDataFromPDF',
      msg: error.message
    }
    logger.error({
      ...formatLogs
    })
    if (error instanceof AxiosError) {
      formatLogs.msg = error.code
      formatLogs.statusCode = error.status
      if (error.status === 429 || error.status === 500) {
        // @TODO add postpone counter per decision
        // if counter <= 2 then postpone
        // else exception
        throw new PostponeException(error.message)
      } else {
        throw new InfrastructureException(error.message)
      }
    } else {
      throw new InfrastructureException(error.message)
    }
  }
}

export function markdownToPlainText(input: string): string {
  marked.use(plaintify())
  let plainText = marked.parse(input, { async: false })
  // Remove any remaining HTML tags:
  plainText = `${plainText}`.replace(/<\/?[^>]+(>|$)/gm, '').trim()
  if (!plainText || isEmptyText(plainText)) {
    const error = new InfrastructureException('Le texte retourné est vide')
    const formatLogs: LogsFormat = {
      ...normalizationFormatLogs,
      operationName: 'markdownToPlainText',
      msg: error.message
    }
    logger.error({
      ...formatLogs
    })
    throw error
  }
  return plainText
}

export function isEmptyText(text: string): boolean {
  text = `${text}`.replace(/[\t\s\r\n]/gm, '').trim()
  return text.length === 0
}
