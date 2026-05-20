import { Module } from '@nestjs/common'
import { JwtAuthGuard } from './auth.guard'

@Module({
  providers: [JwtAuthGuard]
})
export class AuthModule {}
