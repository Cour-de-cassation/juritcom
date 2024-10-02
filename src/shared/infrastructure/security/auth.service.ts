// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { KeycloakService } from './keycloak.service'

@Injectable()
export class AuthService {
  constructor(private readonly keycloakService: KeycloakService) {}


  async validateToken(token: string) {
    return this.keycloakService.verifyToken(token);
  }
}
