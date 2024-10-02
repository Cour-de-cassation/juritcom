// src/keycloak/keycloak.module.ts
import { Module } from '@nestjs/common'
import { KeycloakService } from './keycloak.service'
import { JwtService } from '@nestjs/jwt'

@Module({
  providers: [KeycloakService, JwtService],
  exports: [KeycloakService, JwtService]
})
export class KeycloakModule {}
