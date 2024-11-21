import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { RequestLoggerInterceptor } from './infrastructure/interceptors/request-logger.interceptor'
import { NestApplicationOptions } from '@nestjs/common/interfaces/nest-application-options.interface'

async function bootstrap() {
  const appOptions = {
    logger: ['log', 'error', 'warn']
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
