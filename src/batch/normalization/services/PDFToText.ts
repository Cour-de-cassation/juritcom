/* eslint-disable @typescript-eslint/no-unused-expressions */
import { DecisionS3Repository } from '../../../shared/infrastructure/repositories/decisionS3.repository'
import { InfrastructureException } from '../../../shared/infrastructure/exceptions/infrastructure.exception'
import { logger, normalizationFormatLogs } from '..'
import { LogsFormat } from '../../../shared/infrastructure/utils/logsFormat.utils'
import * as FormData from 'form-data'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { Marked, Renderer as x } from 'marked'
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
  // Remove any <html> and <body> tags, so plaintify does not encode their content:
  input = input.replace(/<\/?html>/gim, '')
  input = input.replace(/<\/?body>/gim, '')

  // Let's plaintify do... something:
  let plainText = new Marked({ gfm: true }).use(markedPlaintify()).parse(input, { async: false })

  // Remove any remaining HTML tags:
  // 1. markedPlaintify could have encode some HTML elements anyway:
  plainText = decode(plainText)
  // 2. add a space to every table cell:
  plainText = plainText.replace(/<\/td>/gim, ' </td>')
  // 3. convert:
  plainText = convert(plainText, { wordwrap: false, preserveNewlines: true })
  // 4. remove every tag that could remain:
  plainText = plainText.replace(/<\/?[^>]+(>|$)/gm, '').trim()

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

function markedPlaintify(c = {}) {
  const s = {},
    a = ['constructor', 'hr', 'checkbox', 'br', 'space'],
    h = ['strong', 'em', 'del'],
    d = ['html', 'code']
  let f = []
  return (
    Object.getOwnPropertyNames(x.prototype).forEach((t) => {
      a.includes(t)
        ? (s[t] = () => '')
        : h.includes(t)
          ? (s[t] = function (e) {
              return this.parser.parseInline(e.tokens)
            })
          : d.includes(t)
            ? (s[t] = (e) =>
                o(e.text) +
                `

`)
            : t === 'codespan'
              ? (s[t] = (e) => o(e.text))
              : t === 'list'
                ? (s[t] = function (e) {
                    let n = ''
                    for (let i = 0; i < e.items.length; i++) {
                      const r = e.items[i],
                        l = this.listitem(r)
                      typeof l == 'string' &&
                        (n += l.replace(
                          /\n{2,}/g,
                          `
`
                        ))
                    }
                    return (
                      `
` +
                      n.trim() +
                      `

`
                    )
                  })
                : t === 'listitem'
                  ? (s[t] = function (e) {
                      return (
                        `
` + this.parser.parse(e.tokens).trim()
                      )
                    })
                  : t === 'blockquote'
                    ? (s[t] = function (e) {
                        return (
                          this.parser.parse(e.tokens).trim() +
                          `

`
                        )
                      })
                    : t === 'table'
                      ? (s[t] = function (e) {
                          f = []
                          for (let i = 0; i < e.header.length; i++) this.tablecell(e.header[i])
                          let n = ''
                          for (let i = 0; i < e.rows.length; i++) {
                            const r = e.rows[i]
                            let l = ''
                            for (let u = 0; u < r.length; u++) l += this.tablecell(r[u])
                            n += this.tablerow({ text: l })
                          }
                          return n
                        })
                      : t === 'tablerow'
                        ? (s[t] = (e) => {
                            const n = e.text.split('__CELL_PAD__').filter(Boolean)
                            return (
                              f.map((i, r) => i + ': ' + n[r]).join(`
`) +
                              `

`
                            )
                          })
                        : t === 'tablecell'
                          ? (s[t] = function (e) {
                              const n = this.parser.parseInline(e.tokens)
                              return e.header && f.push(n), n + '__CELL_PAD__'
                            })
                          : t === 'link'
                            ? (s[t] = function (e) {
                                return (
                                  this.parser.parseInline(e.tokens) +
                                  `

`
                                )
                              })
                            : t === 'image'
                              ? (s[t] = (e) =>
                                  e.text +
                                  `

`)
                              : t === 'paragraph'
                                ? (s[t] = function (e) {
                                    let n = this.parser.parseInline(e.tokens)
                                    return (
                                      (n = n.replace(/\n{2,}/g, '')),
                                      n +
                                        `

`
                                    )
                                  })
                                : t === 'heading'
                                  ? (s[t] = function (e) {
                                      return (
                                        this.parser.parseInline(e.tokens) +
                                        `

`
                                      )
                                    })
                                  : (s[t] = function (e) {
                                      return 'tokens' in e && e.tokens
                                        ? this.parser.parseInline(e.tokens)
                                        : e.text
                                    })
    }),
    {
      renderer: {
        ...s,
        ...c
      }
    }
  )
}
function o(c) {
  const s = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return c.replace(/[&<>"']/g, (a) => s[a])
}
