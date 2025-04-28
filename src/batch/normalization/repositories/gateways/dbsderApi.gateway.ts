import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common'
import axios from 'axios'
import { logger, normalizationFormatLogs } from '../../index'
import { UnIdentifiedDecisionTcom } from 'dbsder-api-types'
import { LogsFormat } from '../../../../shared/infrastructure/utils/logsFormat.utils'

export class DbSderApiGateway {
  async saveDecision(decisionToSave: UnIdentifiedDecisionTcom) {
    const urlToCall = process.env.DBSDER_API_URL + '/v1/decisions'

    const result = await axios
      .put(
        urlToCall,
        { decision: decisionToSave },
        {
          headers: {
            'x-api-key': process.env.DBSDER_API_KEY
          }
        }
      )
      .catch((error) => {
        const formatLogs: LogsFormat = {
          ...normalizationFormatLogs,
          operationName: 'saveDecision',
          msg: 'Error while calling DbSder API'
        }
        if (error.response) {
          if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.BAD_REQUEST
            })
            throw new BadRequestException(
              'DbSderAPI Bad request error : ' + error.response.data.message
            )
          } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.UNAUTHORIZED
            })

            throw new UnauthorizedException('You are not authorized to call this route')
          } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.CONFLICT
            })
            throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
          } else {
            logger.error({
              ...formatLogs,
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

  async updateStatus(id: string, status: string) {
    const urlToCall = process.env.DBSDER_API_URL + `/v1/${id}/statut`

    const result = await axios
      .put(
        urlToCall,
        { statut: status },
        {
          headers: {
            'x-api-key': process.env.DBSDER_OTHER_API_KEY
          }
        }
      )
      .catch((error) => {
        const formatLogs: LogsFormat = {
          ...normalizationFormatLogs,
          operationName: 'updateStatus',
          msg: 'Error while calling DbSder API'
        }
        if (error.response) {
          if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.BAD_REQUEST
            })
            throw new BadRequestException(
              'DbSderAPI Bad request error : ' + error.response.data.message
            )
          } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.UNAUTHORIZED
            })

            throw new UnauthorizedException('You are not authorized to call this route')
          } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.CONFLICT
            })
            throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
          } else {
            logger.error({
              ...formatLogs,
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

  async listDecisions(source: string, status: string, startDate: string, endDate: string) {
    const urlToCall = process.env.DBSDER_API_URL + '/v1/decisions'

    const result = await axios
      .get(urlToCall, {
        params: { sourceName: source, status: status, startDate: startDate, endDate: endDate },
        headers: {
          'x-api-key': process.env.DBSDER_OTHER_API_KEY
        }
      })
      .catch((error) => {
        const formatLogs: LogsFormat = {
          ...normalizationFormatLogs,
          operationName: 'listDecisions',
          msg: 'Error while calling DbSder API'
        }
        if (error.response) {
          if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.BAD_REQUEST
            })
            throw new BadRequestException(
              'DbSderAPI Bad request error : ' + error.response.data.message
            )
          } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.UNAUTHORIZED
            })

            throw new UnauthorizedException('You are not authorized to call this route')
          } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.CONFLICT
            })
            throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
          } else {
            logger.error({
              ...formatLogs,
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

  async getDecisionById(id: string) {
    const urlToCall = process.env.DBSDER_API_URL + `/v1/decisions/${id}`

    const result = await axios
      .get(urlToCall, {
        headers: {
          'x-api-key': process.env.DBSDER_OTHER_API_KEY
        }
      })
      .catch((error) => {
        const formatLogs: LogsFormat = {
          ...normalizationFormatLogs,
          operationName: 'getDecisionById',
          msg: 'Error while calling DbSder API'
        }
        if (error.response) {
          if (error.response.data.statusCode === HttpStatus.BAD_REQUEST) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.BAD_REQUEST
            })
            throw new BadRequestException(
              'DbSderAPI Bad request error : ' + error.response.data.message
            )
          } else if (error.response.data.statusCode === HttpStatus.UNAUTHORIZED) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.UNAUTHORIZED
            })

            throw new UnauthorizedException('You are not authorized to call this route')
          } else if (error.response.data.statusCode === HttpStatus.CONFLICT) {
            logger.error({
              ...formatLogs,
              msg: error.response.data.message,
              data: error.response.data,
              statusCode: HttpStatus.CONFLICT
            })
            throw new ConflictException('DbSderAPI error: ' + error.response.data.message)
          } else {
            logger.error({
              ...formatLogs,
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
}
