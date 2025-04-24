import * as dotenv from 'dotenv'
dotenv.config()
import { Marked } from 'marked'
import { decode } from 'html-entities'
import { convert } from 'html-to-text'

import {
  S3Client,
  GetObjectCommand,
  ListObjectsCommand,
  ListObjectsCommandOutput
} from '@aws-sdk/client-s3'

async function main() {
  let sum = 0
  let max = 0
  let min = 0
  let count = 0
  let init = true
  const items = await getListOfSuccessfullyConvertedPDF()
  for (let i = 0; i < items.length; i++) {
    try {
      const markdownText = await getMarkdownTextByKey(items[i])
      const htmlText = new Marked({ gfm: true, breaks: true }).parse(markdownText, { async: false })
      // Remove any HTML stuff:
      // 1.a HTML elements:
      let plainText = decode(htmlText)
      // 1.b Remove every <html> tag:
      plainText = plainText.replace(/<html>/gim, '\n')
      plainText = plainText.replace(/<\/html>/gim, '\n')
      // 1.c Remove every <body> tag:
      plainText = plainText.replace(/<body>/gim, '\n')
      plainText = plainText.replace(/<\/body>/gim, '\n')
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
            selector: 'img',
            format: 'skip'
          },
          {
            selector: 'a',
            format: 'skip'
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

      const plainTextLen = plainText.trim().length
      const markdownTextLen = markdownText.trim().length
      const diff = Math.abs(plainTextLen - markdownTextLen)
      if (diff > 1000) {
        console.log('\n*=*=*=*=*=*=*=*=*=*=*\n')
        console.log(items[i])
        console.log('* * * * * * * * * * *')
        console.log(markdownText)
        console.log('* * * * * * * * * * *')
        console.log(plainText)
        console.log('\n*=*=*=*=*=*=*=*=*=*=*\n')
      }
      if (init === true) {
        init = false
        max = diff
        min = diff
      } else {
        max = Math.max(max, diff)
        min = Math.min(min, diff)
      }
      sum += diff
      count++
    } catch (e) {
      console.error(e)
    }
  }
  console.log(
    `Average: ${(sum / count).toFixed(2)} - Max: ${max.toFixed(2)} - Min: ${min.toFixed(2)} (out of ${count} decisions)`
  )
}

async function getListOfSuccessfullyConvertedPDF(): Promise<Array<string>> {
  const list = []
  const s3Client = new S3Client({
    endpoint: process.env.S3_URL,
    forcePathStyle: true,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    }
  })
  let done = false
  let marker = null
  while (done === false) {
    const reqParams = {
      Bucket: process.env.S3_BUCKET_NAME_PDF2TEXT_SUCCESS,
      Marker: undefined
    }
    if (marker !== null) {
      reqParams.Marker = marker
    }
    try {
      const listObjects: ListObjectsCommandOutput = await s3Client.send(
        new ListObjectsCommand(reqParams)
      )
      if (listObjects && listObjects.Contents) {
        listObjects.Contents.forEach((item) => {
          list.push(item.Key)
          marker = item.Key
        })
        if (listObjects.IsTruncated === false) {
          done = true
        }
      } else {
        done = true
      }
    } catch (error) {
      console.log({
        operationName: 'getListOfSuccessfullyConvertedPDF',
        msg: error.message,
        data: error
      })
    }
  }
  return list
}

async function getMarkdownTextByKey(key: string): Promise<string> {
  const s3Client = new S3Client({
    endpoint: process.env.S3_URL,
    forcePathStyle: true,
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_KEY
    }
  })
  const getPDFReqParams = {
    Bucket: process.env.S3_BUCKET_NAME_PDF2TEXT_SUCCESS,
    Key: key
  }
  const contentFromS3 = await s3Client.send(new GetObjectCommand(getPDFReqParams))
  const stringifiedContent = await contentFromS3.Body?.transformToString()
  const obectifiedContent = JSON.parse(stringifiedContent)
  return obectifiedContent.markdownText
}

main()
