import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { RedirectController } from './app.controller'
import { configureLoggerModule } from '../shared/infrastructure/utils/pinoConfig.utils'
import { HealthController } from './infrastructure/controllers/health/health.controller'
import { BucketHealthIndicator } from './infrastructure/controllers/health/bucketHealthIndicator'
import { DecisionController } from './infrastructure/controllers/decision/decision.controller'
import { envValidationConfig } from '../shared/infrastructure/dto/env.validation'

@Module({
  imports: [
    ConfigModule.forRoot(envValidationConfig),
    HttpModule,
    TerminusModule.forRoot({
      logger: false
    }),
    configureLoggerModule()
  ],
  controllers: [RedirectController, HealthController, DecisionController],
  providers: [BucketHealthIndicator]
})
export class AppModule {}
