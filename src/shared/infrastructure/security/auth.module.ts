import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard'
import { OauthModule } from './oauth.module'
import { AuthService } from './auth.service'

@Module({
  imports: [OauthModule],
  providers: [AuthService,JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
