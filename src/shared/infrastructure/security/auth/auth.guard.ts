import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
  HttpStatus
} from '@nestjs/common'
import { getOAuth, getModel } from '../../../../api/main'
import { Request, Response } from '@node-oauth/oauth2-server'
import { timingSafeEqual } from 'crypto'
import { LogsFormat } from '../../../../shared/infrastructure/utils/logsFormat.utils'

const logger = new Logger()
const formatLogs: LogsFormat = {
  operationName: 'auth.guard',
  msg: 'Error while calling auth.guard'
}
const CREDENTIALS_REGEXP = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/
const USER_PASS_REGEXP = /^([^:]*):(.*)$/

function parse(string) {
  if (typeof string !== 'string') {
    return undefined
  }
  const match = CREDENTIALS_REGEXP.exec(string)
  if (!match) {
    return undefined
  }
  const userPass = USER_PASS_REGEXP.exec(Buffer.from(match[1], 'base64').toString())
  if (!userPass) {
    return undefined
  }
  return {
    name: userPass[1],
    pass: userPass[2]
  }
}

function safeCompare(userInput, secret) {
  const userInputLength = Buffer.byteLength(userInput)
  const secretLength = Buffer.byteLength(secret)
  const userInputBuffer = Buffer.alloc(userInputLength, 0, 'utf8')
  userInputBuffer.write(userInput)
  const secretBuffer = Buffer.alloc(userInputLength, 0, 'utf8')
  secretBuffer.write(secret)
  return !!(timingSafeEqual(userInputBuffer, secretBuffer) && userInputLength === secretLength)
}

function staticUsersAuthorizer(users, username, password) {
  for (const i in users)
    if (safeCompare(username, i) && safeCompare(password, users[i])) return true
  return false
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()
    let value = false
    if (`${process.env.USE_AUTH}` === 'basic') {
      try {
        const users = {}
        users[process.env.DOC_LOGIN] = process.env.DOC_PASSWORD
        const header = request.headers.authorization
        const authentication = parse(header)
        if (authentication) {
          request.auth = {
            user: authentication.name,
            password: authentication.pass
          }
          value = staticUsersAuthorizer(users, authentication.name, authentication.pass)
          logger.log({
            ...formatLogs,
            msg: `Validate request using Basic: ${value}`
          })
        }
      } catch (_ignore) {
        value = false
      }
    } else if (`${process.env.USE_AUTH}` === 'oauth') {
      value = await this.validateRequest(request, response, context)
      logger.log({
        ...formatLogs,
        msg: `Validate request using OAuth: ${value}`
      })
    }
    if (!value) {
      const error = new UnauthorizedException('You are not authorized to access this resource.')
      logger.error({
        ...formatLogs,
        msg: error.message,
        statusCode: HttpStatus.UNAUTHORIZED
      })
      throw error
    }
    return new Promise<boolean>((resolve) => resolve(value))
  }

  async validateRequest(req: any, res: any, _context: ExecutionContext) {
    let token
    const oAuth = getOAuth()
    const model = getModel()
    const request = new Request(req)
    const response = new Response(res)

    try {
      token = await oAuth.server.authenticate(request, response)
    } catch (error) {
      logger.error({
        ...formatLogs,
        msg: error.message
      })
      return false
    }

    if (!token) {
      return false
    }

    if (token.user && token.client && token.scope) {
      const validateScope = await model.validateScope(token.user, token.client, token.scope)
      logger.log({
        ...formatLogs,
        msg: `Validate OAuth scope [${token.user}, ${token.client?.id}, ${token.scope}]: ${validateScope}`
      })
      return validateScope !== false
    } else {
      return false
    }
  }
}
