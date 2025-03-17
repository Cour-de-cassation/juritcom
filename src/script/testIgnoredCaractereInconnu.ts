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
  const decisions = await listDecisions('juritcom' /*, 'ignored_caractereInconnu'*/)
  const fileHistory = []
  const charHistory = []
  for (let i = 0; i < decisions.length; i++) {
    try {
      const decision = await getDecisionById(decisions[i]._id)
      const cleanedDecision = replaceUnknownCharacters(decision.originalText)
      for (let j = 0; j < cleanedDecision.length; j++) {
        if (
          !authorizedCharactersdSet.has(cleanedDecision[j]) &&
          charHistory.indexOf(cleanedDecision[j].charCodeAt(0)) === -1
        ) {
          if (fileHistory.indexOf(decision.filenameSource) === -1) {
            console.log(`----- ${decision.filenameSource} -----`)
            fileHistory.push(decision.filenameSource)
          } else {
            console.log('-----')
          }
          console.log(cleanedDecision.slice(j - 20, j + 20))
          console.log(cleanedDecision[j])
          console.log(cleanedDecision[j].charCodeAt(0))
          charHistory.push(cleanedDecision[j].charCodeAt(0))
        }
      }
    } catch (e) {
      console.log(`Skip ${decisions[i]._id}`, e)
    }
  }
}

async function listDecisions(source: string /*, status: string*/) {
  const urlToCall = process.env.DBSDER_API_URL + '/v1/decisions'

  const result = await axios
    .get(urlToCall, {
      params: { sourceName: source /*, status: status*/ },
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
