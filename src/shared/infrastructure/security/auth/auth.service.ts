import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { LogsFormat } from '../../../../shared/infrastructure/utils/logsFormat.utils'

const logger = new Logger()
const formatLogs: LogsFormat = {
  operationName: 'auth.service',
  msg: 'Error while calling auth.service'
}

@Injectable()
export class AuthService {
  constructor(/*private readonly oauthService: OauthService*/) {}

  async getToken() {
    try {
      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.OAUTH_TOKEN_URL,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: {
          client_id: process.env.OAUTH_CLIENT_ID,
          client_secret: process.env.OAUTH_CLIENT_SECRET,
          grant_type: 'client_credentials'
        }
      }
      const tokenResponse = await axios.request(config)
      logger.log({
        ...formatLogs,
        msg: `Get token for ${process.env.OAUTH_CLIENT_ID} from URL ${process.env.OAUTH_TOKEN_URL}`
      })
      return tokenResponse.data.access_token
    } catch (e) {
      logger.error({
        ...formatLogs,
        msg: e.message
      })
    }
  }
}
