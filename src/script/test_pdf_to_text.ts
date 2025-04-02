/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as FormData from 'form-data'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { Marked, Renderer as x } from 'marked'
import { decode } from 'html-entities'
import { convert } from 'html-to-text'

async function main(id: string) {
  const pdf: Buffer = await getPDFByFilename(`${id}.pdf`)
  const formdata: FormData = new FormData()
  formdata.append('pdf_file', pdf, `${id}.pdf`)
  try {
    const t0 = new Date()
    const response: AxiosResponse = await axios.post(
      'http://nlp-pseudonymisation-api-service.nlp.svc.cluster.local:8081/pdf-to-text',
      formdata,
      {
        headers: {
          ...formdata.getHeaders()
        }
      }
    )
    const t1 = new Date()
    const delta = (t1.getTime() - t0.getTime()) / 1000
    const perPage = (delta / response.data.pdfPageCount).toFixed(2)

    let input = response.data.markdownText
    // Remove any <html> and <body> tags, so plaintify does not encode their content:
    input = input.replace(/<\/?html>/gim, '')
    input = input.replace(/<\/?body>/gim, '')

    // Let's plaintify do... something:
    let plainText = new Marked({ gfm: true, breaks: true })
      .use(markedPlaintify())
      .parse(input, { async: false })

    // Remove any remaining HTML tags:
    // 1. markedPlaintify could have encode some HTML elements anyway:
    plainText = decode(plainText)
    // 2. add a space to every table cell:
    plainText = plainText.replace(/<\/td>/gim, ' </td>')
    // 3. convert:
    plainText = convert(plainText, { wordwrap: false, preserveNewlines: true })
    // 4. remove every tag that could remain:
    plainText = plainText.replace(/<\/?[^>]+(>|$)/gm, '').trim()

    console.log(plainText)
    // console.log(response.status)
    // console.log(response.statusText)
    // console.log(`PDF type: ${response.data.pdfType}`)
    // console.log(`PDF page count: ${response.data.pdfPageCount}`)
    // console.log(`Total duration: ${delta.toFixed(2)} s`)
    console.log(`Duration per page: ${perPage} page/s`)
  } catch (error: any) {
    if (error instanceof AxiosError) {
      console.error(error.code)
      console.error(error.status)
      console.error(error.cause)
    } else {
      console.error(error)
    }
  }
}

async function getPDFByFilename(filename: string): Promise<Buffer> {
  const s3Client = new S3Client({
    endpoint: process.env.S3_URL,
    forcePathStyle: true,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    }
  })

  const reqParams = {
    Bucket: process.env.S3_BUCKET_NAME_PDF,
    Key: filename
  }

  try {
    const fileFromS3 = await s3Client.send(new GetObjectCommand(reqParams))
    return Buffer.from(await fileFromS3.Body?.transformToByteArray())
  } catch (error) {
    console.log({ operationName: 'getPDFByFilename', msg: error.message, data: error })
  }
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

main(process.argv[2])
