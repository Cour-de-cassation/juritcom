import { Injectable } from '@nestjs/common'
import axios from 'axios'
import * as jwt from 'jsonwebtoken'
import * as process from 'node:process'

@Injectable()
export class OauthService {
  async validateToken(token: string): Promise<boolean> {
    try {
      if (!token) {
        return false
      }
      const decodedToken = jwt.decode(token, { complete: true })

      const signingKey = await this.getPublicKey()

      if (!signingKey) {
        return false // Signing key not found
      }

      const pemStart = '-----BEGIN CERTIFICATE-----\n'
      const pemEnd = '\n-----END CERTIFICATE-----'
      const pem = pemStart + signingKey.x5c[0] + pemEnd

      if (decodedToken.payload['iss'] !== `${process.env.OAUTH_PROVIDER_URL}`) {
        return false // Invalid issuer
      }

      if (decodedToken.payload['azp'] !== process.env.OAUTH_CLIENT_ID) {
        return false // Invalid audience
      }

      const currentTime = Math.floor(Date.now() / 1000)
      if (decodedToken.payload['exp'] < currentTime) {
        return false // Token expired
      }

      jwt.verify(token, pem, { algorithms: ['RS256'] })
      return true
    } catch (error) {
      return false // Error in validating token
    }
  }

  async getPublicKey() {
    const publicKeyResponse = await axios.get(
      `${process.env.OAUTH_PROVIDER_URL}/protocol/openid-connect/certs`
    )
    return publicKeyResponse.data.keys.find((key) => key.use === 'sig' && key.alg === 'RS256')
  }
}
