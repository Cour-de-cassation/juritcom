import * as FormData from 'form-data'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { Marked } from 'marked'
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

    const input = response.data.markdownText
    const htmlText = new Marked({ gfm: true, breaks: true }).parse(input, { async: false })

    // Remove any HTML stuff:
    // 1. HTML elements:
    let plainText = decode(htmlText)
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
      uppercase: false,
      ignoreHref: true,
      uppercaseHeaderCells: false
    })
    // 6. remove every tag that could remain:
    plainText = plainText.replace(/<\/?[^>]+(>|$)/gm, '')
    // 7. remove extra \n again (after tag collapsing)
    plainText = plainText.replace(/\n\n/gm, '\n')
    plainText = plainText.trim()

    console.log(JSON.stringify(plainText))
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

main(process.argv[2])
