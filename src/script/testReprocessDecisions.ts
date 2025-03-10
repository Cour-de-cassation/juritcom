import * as dotenv from 'dotenv'
dotenv.config()

import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common'

import axios from 'axios'

let batchSize: number

async function main(count: string) {
  batchSize = parseInt(count, 10)

  if (isNaN(batchSize)) {
    batchSize = 100
  }

  const decisions = await listDecisions(
    'juritcom',
    'ignored_controleRequis',
    new Date(process.env.COMMISSIONING_DATE).toISOString(),
    new Date('2025-03-04').toISOString()
  )

  console.log(decisions)
}

async function listDecisions(source: string, status: string, startDate: string, endDate: string) {
  const urlToCall = process.env.DBSDER_API_URL + '/v1/decisions'

  const result = await axios
    .get(urlToCall, {
      params: { source: source, status: status, startDate: startDate, endDate: endDate },
      headers: {
        'x-api-key': process.env.DBSDER_API_KEY
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

main(process.argv[2])
