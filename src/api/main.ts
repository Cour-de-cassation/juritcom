import { NestFactory } from '@nestjs/core'
import * as basicAuth from 'express-basic-auth'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { Logger as NestLogger } from '@nestjs/common'
import { AppModule } from './app.module'
import { RequestLoggerInterceptor } from './infrastructure/interceptors/request-logger.interceptor'
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface'

const logger = new NestLogger('OAuth')

function createModel(db) {
  async function getClient(clientId, clientSecret) {
    const secretPreview = clientSecret ? `${clientSecret.substring(0, 4)}... (len=${clientSecret.length})` : 'missing'
    logger.log(`getClient - client_id: ${clientId ?? 'missing'}, secret: ${secretPreview}`)
    const client = db.findClient(clientId, clientSecret)
    logger.log(`getClient - result: ${client ? `found (id=${client.id})` : 'not found'}`)
    return client
  }

  async function validateScope(user, client, scope) {
    logger.log(`validateScope - user: ${user?.id}, client: ${client?.id}, scope: ${JSON.stringify(scope)}, type: ${typeof scope}`)

    if (!user || user.id !== 'system') {
      logger.error(`validateScope - rejected: invalid user (${user?.id})`)
      return false
    }

    if (!client || !db.findClientById(client.id)) {
      logger.error(`validateScope - rejected: client not found (${client?.id})`)
      return false
    }

    if (scope === undefined || scope === null) {
      logger.error(`validateScope - rejected: scope is ${scope}`)
      return false
    }

    const result = typeof scope === 'string'
      ? (enabledScopes.includes(scope) ? [scope] : false)
      : (Array.isArray(scope) && scope.every((s) => enabledScopes.includes(s)) ? scope : false)

    logger.log(`validateScope - result: ${JSON.stringify(result)}`)
    return result
  }

  async function getUserFromClient(_client) {
    logger.log(`getUserFromClient - client_id: ${_client?.id}`)
    const client = db.findClient(_client.id, _client.secret)
    const user = client && getUserDoc()
    logger.log(`getUserFromClient - result: ${user ? JSON.stringify(user) : 'not found'}`)
    return user
  }

  async function saveToken(token, client, user) {
    const meta = {
      clientId: client.id,
      userId: user.id,
      scope: token.scope,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt
    }

    token.client = client
    token.user = user

    if (token.accessToken) {
      db.saveAccessToken(token.accessToken, meta)
      logger.log(`saveToken - access token saved - client: ${client.id}, user: ${user.id}, scope: ${JSON.stringify(token.scope)}, preview: ${token.accessToken.substring(0, 20)}..., expiresAt: ${token.accessTokenExpiresAt}`)
    }

    if (token.refreshToken) {
      db.saveRefreshToken(token.refreshToken, meta)
      logger.log(`saveToken - refresh token saved - preview: ${token.refreshToken.substring(0, 20)}...`)
    }

    return token
  }

  async function getAccessToken(accessToken) {
    logger.log(`getAccessToken - lookup preview: ${accessToken?.substring(0, 20)}... (DB size: ${db.accessTokens.size})`)
    const meta = db.findAccessToken(accessToken)

    if (!meta) {
      logger.error(`getAccessToken - token NOT found in DB`)
      return false
    }

    logger.log(`getAccessToken - found - client: ${meta.clientId}, scope: ${JSON.stringify(meta.scope)}, expiresAt: ${meta.accessTokenExpiresAt}`)
    return {
      accessToken,
      accessTokenExpiresAt: meta.accessTokenExpiresAt,
      user: getUserDoc(),
      client: db.findClientById(meta.clientId),
      scope: meta.scope
    }
  }

  async function getRefreshToken(refreshToken) {
    logger.log(`getRefreshToken - lookup preview: ${refreshToken?.substring(0, 20)}...`)
    const meta = db.findRefreshToken(refreshToken)

    if (!meta) {
      logger.error(`getRefreshToken - token not found`)
      return false
    }

    return {
      refreshToken,
      refreshTokenExpiresAt: meta.refreshTokenExpiresAt,
      user: getUserDoc(),
      client: db.findClientById(meta.clientId),
      scope: meta.scope
    }
  }

  async function revokeToken(token) {
    logger.log(`revokeToken - preview: ${token?.refreshToken?.substring(0, 20)}...`)
    db.deleteRefreshToken(token.refreshToken)
    return true
  }

  async function verifyScope(token, scope) {
    logger.log(`verifyScope - scope: ${JSON.stringify(scope)}, type: ${typeof scope}`)

    if (scope === undefined || scope === null) {
      logger.error(`verifyScope - rejected: scope is ${scope}`)
      return false
    }

    const result = typeof scope === 'string'
      ? enabledScopes.includes(scope)
      : (Array.isArray(scope) && scope.every((s) => enabledScopes.includes(s)))

    logger.log(`verifyScope - result: ${result}`)
    return result
  }

  return {
    getClient,
    saveToken,
    getAccessToken,
    getRefreshToken,
    revokeToken,
    validateScope,
    verifyScope,
    getUserFromClient
  }
}

class DB {
  clients: any[]
  accessTokens: Map<any, any>
  refreshTokens: Map<any, any>

  constructor() {
    this.clients = []
    this.accessTokens = new Map()
    this.refreshTokens = new Map()
  }

  saveClient(client) {
    this.clients.push(client)

    return client
  }

  findClient(clientId, clientSecret) {
    return this.clients.find((client) => {
      if (clientSecret) {
        return client.id === clientId && client.secret === clientSecret
      } else {
        return client.id === clientId
      }
    })
  }

  findClientById(id) {
    return this.clients.find((client) => client.id === id)
  }

  saveAccessToken(accessToken, meta) {
    this.accessTokens.set(accessToken, meta)
  }

  findAccessToken(accessToken) {
    return this.accessTokens.get(accessToken)
  }

  deleteAccessToken(accessToken) {
    this.accessTokens.delete(accessToken)
  }

  saveRefreshToken(refreshToken, meta) {
    this.refreshTokens.set(refreshToken, meta)
  }

  findRefreshToken(refreshToken) {
    return this.refreshTokens.get(refreshToken)
  }

  deleteRefreshToken(refreshToken) {
    this.refreshTokens.delete(refreshToken)
  }
}

const enabledScopes = ['collect']
const getUserDoc = () => ({ id: 'system' })
import * as bodyParser from 'body-parser'
import * as OAuthServer from '@node-oauth/express-oauth-server'
const db = new DB()
const model = createModel(db)
const oauth = new OAuthServer({
  model: model
})

db.saveClient({
  id: process.env.OAUTH_CLIENT_ID,
  secret: process.env.OAUTH_CLIENT_SECRET,
  grants: ['client_credentials']
})

async function bootstrap() {
  const appOptions = {
    logger: ['log', 'info', 'error', 'warn']
  } as NestApplicationOptions

  const app = await NestFactory.create(AppModule, appOptions)
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))

  // A voir si c'est necessaire de rajouter /v1 aux routes
  app.setGlobalPrefix('v1')

  // Add logger
  app.useLogger(app.get(Logger))

  app.useGlobalInterceptors(new RequestLoggerInterceptor())

  // Add login/password to access to API Documentation
  const basicAuthOptions: basicAuth.IUsersOptions = {
    challenge: true,
    users: {}
  }
  basicAuthOptions.users[process.env.DOC_LOGIN] = process.env.DOC_PASSWORD
  app.use(['/doc', '/doc-json'], basicAuth(basicAuthOptions))

  // Add API Documentation with Swagger
  const config = new DocumentBuilder()
    .setTitle('API Collecte TCOM')
    .setDescription(
      'API permettant de collecter les décision intègres et leurs métadonnées en provenance des tribunaux de commerce'
    )
    .setVersion('1.0.8')
    .addTag('Collect')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('doc', app, document)

  // ------------------------
  // private area begins here
  // ------------------------
  app.use('/token', (req, res, next) => {
    const protocol = req.headers['x-forwarded-proto'] ?? req.protocol
    const host = req.headers['x-forwarded-host'] ?? req.headers.host
    const fullUrl = `${protocol}://${host}${req.originalUrl}`
    logger.log(`POST ${fullUrl} - grant_type: ${req.body?.grant_type ?? 'missing'}, scope: ${req.body?.scope ?? 'not provided'}`)
    const originalJson = res.json.bind(res)
    res.json = function (body) {
      if (res.statusCode >= 400) {
        logger.error(`POST ${fullUrl} - error ${res.statusCode}: error=${body?.error}, description=${body?.error_description}`)
      } else {
        logger.log(`POST ${fullUrl} - success - preview: ${body?.access_token?.substring(0, 20)}..., scope: ${JSON.stringify(body?.scope)}, expires_in: ${body?.expires_in}`)
      }
      return originalJson(body)
    }
    next()
  })
  app.use('/token', oauth.token())

  const httpAdapter = app.getHttpAdapter()
  // @ts-expect-error necessary for testing purpose, will be removed later
  httpAdapter.get('/test-auth', oauth.authenticate(), function (req, res, _next) {
    res.send({ test: true })
  })

  await app.listen(process.env.PORT)
}

bootstrap()

export function getOAuth(): any {
  return oauth
}

export function getModel(): any {
  return model
}
