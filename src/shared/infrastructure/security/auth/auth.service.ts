import { Injectable } from '@nestjs/common';
import { OauthService } from '../oauth/oauth.service'

@Injectable()
export class AuthService {
  constructor(private readonly oauthService: OauthService) {}


  async validateToken(token: string) {
    return this.oauthService.validateToken(token);
  }
}
