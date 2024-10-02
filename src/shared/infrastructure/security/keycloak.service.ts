// src/keycloak/keycloak.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import axios from 'axios'
import jwt from 'jsonwebtoken'

@Injectable()
export class KeycloakService {
  private keycloakUrl = process.env.KEYCLOAK_URL || 'http://opn2vmla123:8Ho'
  private realm = process.env.KEYCLOAK_REALM || 'juritcom'
  private clientId = process.env.KEYCLOAK_CLIENT_ID || 'juritcom'
  private clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'm633usfnhB010OqsY04gwe7YHWqEEEdE'

  async verifyToken(token: string) {
    try {
      const publicKey = await this.getPublicKey()
      return jwt.verify(token, publicKey)
    } catch (error) {
      throw new UnauthorizedException('Invalid token')
    }
  }

  private async getPublicKey() {
    const response = await axios.get(
      `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/certs`
    )
    const key = response.data.keys[0] // Assuming you use the first key for simplicity.
    return jwt.decode(key.n) // Decode the public key for verification
  }
}
