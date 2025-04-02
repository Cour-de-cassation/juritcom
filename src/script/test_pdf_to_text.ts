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
    // 2. add a space to every table cell:
    plainText = plainText.replace(/<\/td>/gim, ' </td>')
    // 3.a. replace <br> with \n:
    plainText = plainText.replace(/<br\/?>/gim, '\n')
    // 3.b. add a \n after each paragraph:
    plainText = plainText.replace(/<\/p>/gim, '</p>\n')
    // 3.c. add a \n after each title:
    plainText = plainText.replace(/<\/h(\d+)>/gim, '</h$1>\n')
    // 4. convert:
    plainText = convert(plainText, { wordwrap: false, preserveNewlines: true })
    // 5. remove every tag that could remain:
    plainText = plainText.replace(/<\/?[^>]+(>|$)/gm, '')
    // 6. remove extra \n
    plainText = plainText.replace(/\n{2,}/gm, '\n').trim()

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
