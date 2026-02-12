import { NestFactory } from '@nestjs/core'
import * as basicAuth from 'express-basic-auth'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Logger as PinoLogger } from 'nestjs-pino'
import { Logger } from '@nestjs/common'
import { AppModule } from './app.module'
import { RequestLoggerInterceptor } from './infrastructure/interceptors/request-logger.interceptor'
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface'
import * as bodyParser from 'body-parser'
import * as jwtUtils from '../shared/infrastructure/security/jwt/jwt.utils'
import { safeCompare } from '../shared/infrastructure/security/auth/auth.guard'

const JWT_CLIENT_ID = process.env.OAUTH_CLIENT_ID
const JWT_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET

// @legacy: Scope must be present in the response
const ENABLED_SCOPES = ['collect']

async function bootstrap() {
  const appOptions = {
    logger: ['log', 'error', 'warn']
  } as NestApplicationOptions

  const app = await NestFactory.create(AppModule, appOptions)
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: false }))

  // A voir si c'est necessaire de rajouter /v1 aux routes
  app.setGlobalPrefix('v1')

  // Add logger
  app.useLogger(app.get(PinoLogger))
  app.useGlobalInterceptors(new RequestLoggerInterceptor())
  const logger = new Logger('main')

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

  const httpAdapter = app.getHttpAdapter()
  httpAdapter.post('/token', (req, res) => {
    try {
      const { client_id: clientId, client_secret: clientSecret, grant_type: grantType } = req.body

      if (!isValidClient(clientId, clientSecret)) {
        return res.status(401).json({
          error: 'invalid_client',
          error_description: 'Invalid client credentials'
        })
      }

      if (grantType !== 'client_credentials') {
        return res.status(400).json({
          error: 'unsupported_grant_type',
          error_description: 'Only client_credentials grant type is supported'
        })
      }

      const accessToken = jwtUtils.generateToken(clientId)
      if (!accessToken) {
        return res.status(500).json({
          error: 'server_error',
          error_description: 'Failed to generate token'
        })
      }

      return res.status(200).json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: jwtUtils.JWT_EXPIRATION_SECONDS,
        scope: ENABLED_SCOPES
      })
    } catch (error) {
      logger.error(`Token generation error: ${error.message}`)

      return res.status(500).json({
        error: 'server_error',
        error_description: 'Internal server error'
      })
    }
  })

  httpAdapter.get('/test-auth', (req, res) => {
    const token = jwtUtils.extractBearerToken(req.headers.authorization)
    if (!token) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }

    const decoded = jwtUtils.verifyToken(token)
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    return res.status(200).json({ test: true, decoded })
  })

  await app.listen(process.env.PORT)
}

function isValidClient(clientId: string, clientSecret: string): boolean {
  return (
    clientId &&
    clientSecret &&
    safeCompare(clientId, JWT_CLIENT_ID) &&
    safeCompare(clientSecret, JWT_CLIENT_SECRET)
  )
}

bootstrap()
