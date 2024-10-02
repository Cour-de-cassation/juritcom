// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy'
import { JwtAuthGuard } from './auth.guard'
import { KeycloakModule } from './keycloak.module'
import { AuthService } from './auth.service'

@Module({
  imports: [KeycloakModule],
  providers: [AuthService, JwtStrategy,JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
