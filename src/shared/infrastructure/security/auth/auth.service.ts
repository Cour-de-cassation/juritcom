import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
export class AuthService {
  constructor(/*private readonly oauthService: OauthService*/ ) {
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

  async validateToken(token: string) {
    // return this.oauthService.validateToken(token)
    return false
  }
}
