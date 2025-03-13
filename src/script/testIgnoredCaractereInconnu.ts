import * as dotenv from 'dotenv'
dotenv.config()

import { authorizedCharacters } from '../batch/normalization/infrastructure/authorizedCharactersList'

const authorizedCharactersdSet = new Set(authorizedCharacters)

import { characterReplacementMap } from '../batch/normalization/infrastructure/characterReplacementMap'

import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common'

import axios from 'axios'

async function main() {
  const decisions = await listDecisions('juritcom', 'ignored_caractereInconnu')
  for (let i = 0; i < decisions.length; i++) {
    try {
      const decision = await getDecisionById(decisions[i]._id)
      const cleanedDecision = replaceUnknownCharacters(decision.originalText)
      for (let i = 0; i < cleanedDecision.length; i++) {
        if (!authorizedCharactersdSet.has(cleanedDecision[i])) {
          console.log('-----')
          console.log(cleanedDecision.slice(i - 10, i + 10))
          console.log(cleanedDecision[i])
          console.log(cleanedDecision[i].charCodeAt(0))
        }
      }
    } catch (_ignore) {
      console.log(`Skip ${decisions[i]._id}`)
    }
  }
}

async function listDecisions(source: string, status: string) {
  const urlToCall = process.env.DBSDER_API_URL + '/v1/decisions'

  const result = await axios
    .get(urlToCall, {
      params: { sourceName: source, status: status },
      headers: {
        'x-api-key': process.env.DBSDER_OTHER_API_KEY
      }
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.BAD_REQUEST
          })
          throw new BadRequestException(
            'DbSderAPI Bad request error : ' + error.response.data.message
          )
        } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.UNAUTHORIZED
          })
          throw new UnauthorizedException('You are not authorized to call this route')
        } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.CONFLICT
          })
          throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
        } else {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.SERVICE_UNAVAILABLE
          })
        }
      }
      throw new ServiceUnavailableException('DbSder API is unavailable')
    })

  return result.data
}

async function getDecisionById(id: string) {
  const urlToCall = process.env.DBSDER_API_URL + `/v1/decisions/${id}`

  const result = await axios
    .get(urlToCall, {
      headers: {
        'x-api-key': process.env.DBSDER_OTHER_API_KEY
      }
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.BAD_REQUEST
          })
          throw new BadRequestException(
            'DbSderAPI Bad request error : ' + error.response.data.message
          )
        } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.UNAUTHORIZED
          })
          throw new UnauthorizedException('You are not authorized to call this route')
        } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.CONFLICT
          })
          throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
        } else {
          console.error({
            msg: error.response.data.message,
            data: error.response.data,
            statusCode: HttpStatus.SERVICE_UNAVAILABLE
          })
        }
      }
      throw new ServiceUnavailableException('DbSder API is unavailable')
    })

  return result.data
}

function replaceUnknownCharacters(text: string) {
  let replacedText = ''
  for (const character of text) {
    if (characterReplacementMap[character] == undefined) {
      replacedText += character
    } else {
      replacedText += characterReplacementMap[character]
    }
  }
  return replacedText
}

main()
