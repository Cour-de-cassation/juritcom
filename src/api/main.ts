import { NestFactory } from '@nestjs/core'
import * as basicAuth from 'express-basic-auth'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { RequestLoggerInterceptor } from './infrastructure/interceptors/request-logger.interceptor'
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface'

function createModel(db) {
  async function getClient(clientId, clientSecret) {
    return db.findClient(clientId, clientSecret)
  }

  async function validateScope(user, client, scope) {
    if (!user || user.id !== 'system') {
      return false
    }

    if (!client || !db.findClientById(client.id)) {
      return false
    }

    if (typeof scope === 'string') {
      return enabledScopes.includes(scope) ? [scope] : false
    } else {
      return scope.every((s) => enabledScopes.includes(s)) ? scope : false
    }
  }

  async function getUserFromClient(_client) {
    const client = db.findClient(_client.id, _client.secret)
    return client && getUserDoc()
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
    }

    if (token.refreshToken) {
      db.saveRefreshToken(token.refreshToken, meta)
    }

    return token
  }

  async function getAccessToken(accessToken) {
    const meta = db.findAccessToken(accessToken)

    if (!meta) {
      return false
    }

    return {
      accessToken,
      accessTokenExpiresAt: meta.accessTokenExpiresAt,
      user: getUserDoc(),
      client: db.findClientById(meta.clientId),
      scope: meta.scope
    }
  }

  async function getRefreshToken(refreshToken) {
    const meta = db.findRefreshToken(refreshToken)

    if (!meta) {
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
    db.deleteRefreshToken(token.refreshToken)

    return true
  }

  async function verifyScope(token, scope) {
    if (typeof scope === 'string') {
      return enabledScopes.includes(scope)
    } else {
      return scope.every((s) => enabledScopes.includes(s))
    }
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
const bodyParser = require('body-parser')
const OAuthServer = require('@node-oauth/express-oauth-server')
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
    logger: ['log', 'error', 'warn'],
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
  app.use('/token', oauth.token())

  const httpAdapter = app.getHttpAdapter()
  // @ts-ignore
  httpAdapter.get('/test-auth', oauth.authenticate(), function (req, res, next) {
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
