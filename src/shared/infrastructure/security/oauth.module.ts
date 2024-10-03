import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { OauthService } from './oauth.service'

@Module({
  providers: [OauthService, JwtService],
  exports: [OauthService, JwtService]
})
export class OauthModule {}
