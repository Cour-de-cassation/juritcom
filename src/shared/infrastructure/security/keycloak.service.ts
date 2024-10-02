// src/keycloak/keycloak.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import axios from 'axios'
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { Algorithm } from 'jsonwebtoken'

@Injectable()
export class KeycloakService {
  private keycloakUrl = /*process.env.KEYCLOAK_URL ||*/ 'http://opn2vmla123:80'
  private realm = /*process.env.KEYCLOAK_REALM ||*/ 'juritcom'
  private clientId = /*process.env.KEYCLOAK_CLIENT_ID ||*/ 'juritcom'
  private clientSecret = /*process.env.KEYCLOAK_CLIENT_SECRET ||*/ 'm633usfnhB010OqsY04gwe7YHWqEEEdE'

  constructor( private jwtService: JwtService) {
  }

  async verifyToken(token: string) {
    try {
      const publicKey = await this.getPublicKey();
      console.log('publicKey ... ', publicKey);
      const algorithms = 'RS256' as unknown as any;
      return await this.jwtService.verify(token, {publicKey, algorithms})
    } catch (error) {
      throw new UnauthorizedException('Invalid token : '+error.message)
    }
  }

  private async getPublicKey() {
    const response = await axios.get(
      `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/certs`
    )
    const key = response.data.keys[0] // Assuming you use the first key for simplicity.
    return key.n // Decode the public key for verification
  }
}
