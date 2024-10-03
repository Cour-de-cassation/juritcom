import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { RequestLoggerInterceptor } from './infrastructure/interceptors/request-logger.interceptor'
import * as fs from 'fs'
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface'

async function bootstrap() {
  const httpsOptions =
    process.env.NODE_ENV === 'local'
      ? {
          key: fs.readFileSync(process.env.PATH_SERVER_KEY),
          cert: fs.readFileSync(process.env.PATH_SERVER_CERT),
          ca: [
            fs.readFileSync(process.env.PATH_CA_CERT),
            fs.readFileSync(process.env.PATH_WINCI_CA_CERT)
          ], // Optionnel, si vous utilisez une CA personnalisée
          requestCert: true
        }
      : null

  const appOptions = {
    logger: ['log', 'error', 'warn'],
    ...(httpsOptions && { httpsOptions }) // Ajoute httpsOptions seulement si non null
  } as NestApplicationOptions

  const app = await NestFactory.create(AppModule, appOptions)

  // A voir si c'est necessaire de rajouter /v1 aux routes
  app.setGlobalPrefix('v1')

  // Add logger
  app.useLogger(app.get(Logger))

  app.useGlobalInterceptors(new RequestLoggerInterceptor())


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

  await app.listen(process.env.PORT)
}

bootstrap()
