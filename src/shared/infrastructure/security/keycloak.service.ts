// src/keycloak/keycloak.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import axios from 'axios'
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { Algorithm } from 'jsonwebtoken'

@Injectable()
export class KeycloakService {
  private keycloakUrl = process.env.KEYCLOAK_URL || 'http://opn2vmla123:80/realms/juritcom'
  private realm = process.env.KEYCLOAK_REALM || 'juritcom'
  private clientId = process.env.KEYCLOAK_CLIENT_ID || 'juritcom'
  private clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'm633usfnhB010OqsY04gwe7YHWqEEEdE'

  constructor( private jwtService: JwtService) {
  }


  async validateToken(token: string): Promise<boolean> {

    try {
      if (!token) {
        console.error('Token not provided');
        return false;
      }
      const decodedToken = jwt.decode(token, {complete: true});

      const publicKeyResponse = await axios.get(
        `${this.keycloakUrl}/protocol/openid-connect/certs`);
      const signingKey = publicKeyResponse.data.keys.find(
        key => key.use === 'sig' && key.alg === 'RS256');

      if (!signingKey) {
        return false;  // Signing key not found
      }

      const pemStart = '-----BEGIN CERTIFICATE-----\n';
      const pemEnd = '\n-----END CERTIFICATE-----';
      const pem = pemStart + signingKey.x5c[0] + pemEnd;

      if (decodedToken.payload['iss'] !== `${this.keycloakUrl}`) {
        return false;  // Invalid issuer
      }

      if (decodedToken.payload['azp'] !== this.clientId) {
        return false;  // Invalid audience
      }

      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.payload['exp'] < currentTime) {
        return false;  // Token expired
      }

      jwt.verify(token, pem, {algorithms: ['RS256']});
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;  // Error in validating token
    }
  }

}
