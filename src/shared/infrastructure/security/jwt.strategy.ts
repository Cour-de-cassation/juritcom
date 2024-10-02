// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { KeycloakService } from './keycloak.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly keycloakService: KeycloakService) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: 'my' })
  }

  async validate(token: string) {
    // Here, you might want to verify the token with Keycloak

    console.log(token)
    const decodedToken = await this.keycloakService.validateToken(token)
    if (!decodedToken) {
      throw new UnauthorizedException()
    }
    return decodedToken // This can include user info or roles, if necessary
  }
}
