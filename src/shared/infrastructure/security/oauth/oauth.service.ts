import { Injectable } from '@nestjs/common'
import axios from 'axios'
import * as jwt from 'jsonwebtoken'

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

      jwt.verify(token, pem, {
        algorithms: [process.env.OAUTH_ALGORITHM as unknown as jwt.Algorithm]
      })
      return true
    } catch (error) {
      return false // Error in validating token
    }
  }

  async getToken() {
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.OAUTH_TOKEN_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        grant_type: 'client_credentials'
      }
    }
    const tokenResponse = await axios.request(config)
    return tokenResponse.data.access_token
  }

  async getPublicKey() {
    const publicKeyResponse = await axios.get(`${process.env.OAUTH_PROVIDER_CERT_URL}`)
    return publicKeyResponse.data.keys.find(
      (key) => key.use === 'sig' && key.alg === process.env.OAUTH_ALGORITHM
    )
  }
}
