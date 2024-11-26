import { Module } from '@nestjs/common'
import { JwtAuthGuard } from './auth.guard'
import { AuthService } from './auth.service'

@Module({
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService]
})
export class AuthModule {
}
