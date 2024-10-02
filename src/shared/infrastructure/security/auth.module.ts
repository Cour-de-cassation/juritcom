import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './auth.guard'
import { KeycloakModule } from './keycloak.module'
import { AuthService } from './auth.service'

@Module({
  imports: [KeycloakModule],
  providers: [AuthService,JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
