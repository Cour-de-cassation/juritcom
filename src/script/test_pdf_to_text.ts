/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as FormData from 'form-data'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { Marked, Renderer as x } from 'marked'

// @TODO http://nlp-pseudonymisation-api-service.nlp.svc.cluster.local:8081/pdf-to-text
// cf. https://stackoverflow.com/a/64169877

async function main(id: string) {
  const pdf: Buffer = await getPDFByFilename(`${id}.pdf`)
  const formdata: FormData = new FormData()
  formdata.append('pdf_file', pdf, `${id}.pdf`)
  try {
    const response: AxiosResponse = await axios.post(
      'http://nlp-pseudonymisation-api-service.nlp.svc.cluster.local:8081/pdf-to-text',
      formdata,
      {
        headers: {
          ...formdata.getHeaders()
        }
      }
    )
    console.log(response.status)
    console.log(response.statusText)
    console.log(response.data)
    console.log(typeof response.data.markdownText)
    const plainText = new Marked({ gfm: true })
      .use(markedPlaintify())
      .parse(response.data.markdownText, { async: false })
    console.log(plainText)
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

main(process.argv[2]);
