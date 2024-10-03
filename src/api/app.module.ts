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
import {
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
  AuthGuard,
  TokenValidation,
  PolicyEnforcementMode
} from 'nest-keycloak-connect'
import { APP_GUARD } from '@nestjs/core'
import { OauthModule } from '../shared/infrastructure/security/oauth.module'
import { AuthModule } from '../shared/infrastructure/security/auth.module'
import { PassportModule } from '@nestjs/passport'

@Module({
  imports: [
    ConfigModule.forRoot(envValidationConfig),
    HttpModule,
    TerminusModule.forRoot({
      logger: false
    }),
    configureLoggerModule(),
    PassportModule.register({ defaultStrategy: 'jwt', session: true }),
    OauthModule,
    AuthModule,
    // KeycloakConnectModule.register({
    //   authServerUrl: 'http://opn2vmla123:80/auth',
    //   realm: 'juritcom',
    //   clientId: 'juritcom',
    //   secret: 'm633usfnhB010OqsY04gwe7YHWqEEEdE',
    //   logLevels: ['verbose'],
    //   bearerOnly: true
    //   //policyEnforcement: PolicyEnforcementMode.ENFORCING,
    //   //tokenValidation: TokenValidation.ONLINE
    //   // Secret key of the client taken from keycloak server
    // })
  ],
  controllers: [RedirectController, HealthController, DecisionController],
  providers: [
    BucketHealthIndicator,
    // // This adds a global level authentication guard,
    // // you can also have it scoped
    // // if you like.
    // //
    // // Will return a 401 unauthorized when it is unable to
    // // verify the JWT token or Bearer header is missing.
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard
    // },
    // // This adds a global level resource guard, which is permissive.
    // // Only controllers annotated with @Resource and
    // // methods with @Scopes
    // // are handled by this guard.
    // {
    //   provide: APP_GUARD,
    //   useClass: ResourceGuard
    // },
    // // New in 1.1.0
    // // This adds a global level role guard, which is permissive.
    // // Used by `@Roles` decorator with the
    // // optional `@AllowAnyRole` decorator for allowing any
    // // specified role passed.
    // {
    //   provide: APP_GUARD,
    //   useClass: RoleGuard
    // }
  ]
})
export class AppModule {}
