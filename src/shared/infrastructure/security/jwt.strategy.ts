import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { OauthService } from './oauth.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly oauthService: OauthService) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: 'my' })
  }

  async validate(token: string) {
    const decodedToken = await this.oauthService.validateToken(token)
    if (!decodedToken) {
      throw new UnauthorizedException()
    }
    return decodedToken // This can include user info or roles, if necessary
  }
}
