import { DecisionS3Repository } from '../../../shared/infrastructure/repositories/decisionS3.repository'
import { InfrastructureException } from '../../../shared/infrastructure/exceptions/infrastructure.exception'
import { logger, normalizationFormatLogs } from '..'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'
import * as FormData from 'form-data'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { Marked } from 'marked'
import { PostponeException } from '../infrastructure/nlp.exception'
import { decode } from 'html-entities'
import { convert } from 'html-to-text'

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
    const t0 = new Date()
    const response: AxiosResponse = await axios.post(
      `${process.env.NLP_PSEUDONYMISATION_API_URL}/pdf-to-text`,
      formData,
      {
        headers: {
          ...formData.getHeaders()
        }
      }
    )
    if (response && response.data && response.data.pdfPageCount) {
      const t1 = new Date()
      const delta = (t1.getTime() - t0.getTime()) / 1000
      const perPage = delta / response.data.pdfPageCount
      const formatLogs: LogsFormat = {
        ...normalizationFormatLogs,
        operationName: 'fetchNLPDataFromPDF',
        msg: `performed pdf-to-text on file ${pdfFilename}`,
        statusCode: response.status
      }
      logger.info({
        ...formatLogs,
        pdfType: response.data.pdfType,
        pdfPageCount: response.data.pdfPageCount,
        duration: delta.toFixed(4),
        durationAsNumber: delta,
        durationPerPage: perPage.toFixed(4),
        durationPerPageAsNumber: perPage,
        statusCodeAsString: `${response.status}`
      })
    }
    return response.data
  } catch (error) {
    const formatLogs: LogsFormat = {
      ...normalizationFormatLogs,
      operationName: 'fetchNLPDataFromPDF',
      msg: error.message
    }
    if (error instanceof AxiosError) {
      formatLogs.msg = error.code
      formatLogs.statusCode = error.status
      logger.error({
        ...formatLogs,
        statusCodeAsString: `${error.status}`
      })
      if (error.status === 429 || error.status === 500) {
        throw new PostponeException(error.message)
      } else {
        throw new InfrastructureException(error.message)
      }
    } else {
      logger.error({
        ...formatLogs
      })
      throw new InfrastructureException(error.message)
    }
  }
}

export function markdownToPlainText(input: string): string {
  let plainText = new Marked({ gfm: true, breaks: true }).parse(input, { async: false })

  // Remove any HTML stuff:
  // 1. HTML elements:
  plainText = decode(plainText)
  // 2. insert a space at the end of every table cell:
  plainText = plainText.replace(/<\/td>/gim, ' </td>')
  // 3.a. add a \n after each <br>:
  plainText = plainText.replace(/<br\/?>/gim, '<br>\n')
  // 3.b. add a \n before and after each paragraph:
  plainText = plainText.replace(/<p>/gim, '\n<p>')
  plainText = plainText.replace(/<\/p>/gim, '</p>\n')
  // 3.c. add a \n before and after each heading:
  plainText = plainText.replace(/<h(\d+)>/gim, '\n<h$1>')
  plainText = plainText.replace(/<\/h(\d+)>/gim, '</h$1>\n')
  // 3.d. add a \n before and after each tr:
  plainText = plainText.replace(/<tr>/gim, '\n<tr>')
  plainText = plainText.replace(/<\/tr>/gim, '</tr>\n')
  // 3.e. add a \n before and after each table:
  plainText = plainText.replace(/<table>/gim, '\n<table>')
  plainText = plainText.replace(/<\/table>/gim, '</table>\n')
  // 3.f. add a \n before and after each hr:
  plainText = plainText.replace(/<hr\/?>/gim, '\n<hr>\n')
  // 3.g. add a \n before and after each ol:
  plainText = plainText.replace(/<ol>/gim, '\n<ol>')
  plainText = plainText.replace(/<\/ol>/gim, '</ol>\n')
  // 3.h. add a \n before and after each ul:
  plainText = plainText.replace(/<ul>/gim, '\n<ul>')
  plainText = plainText.replace(/<\/ul>/gim, '</ul>\n')
  // 3.i. add a \n after each li:
  plainText = plainText.replace(/<\/li>/gim, '</li>\n')
  // 4. remove extra \n
  plainText = plainText.replace(/\n+/gm, '\n')
  // 5. convert:
  plainText = convert(plainText, {
    wordwrap: false,
    preserveNewlines: true,
    selectors: [
      {
        selector: '*',
        options: {
          ignoreHref: true
        }
      },
      {
        selector: 'h1',
        options: {
          uppercase: false
        }
      },
      {
        selector: 'h2',
        options: {
          uppercase: false
        }
      },
      {
        selector: 'h3',
        options: {
          uppercase: false
        }
      },
      {
        selector: 'h4',
        options: {
          uppercase: false
        }
      },
      {
        selector: 'h5',
        options: {
          uppercase: false
        }
      },
      {
        selector: 'h6',
        options: {
          uppercase: false
        }
      }
    ]
  })
  // 6. remove every tag that could remain:
  plainText = plainText.replace(/<\/?[^>]+(>|$)/gm, '')
  // 7. remove extra \n again (after tag collapsing)
  plainText = plainText.replace(/\n\n/gm, '\n')
  plainText = plainText.trim()

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
