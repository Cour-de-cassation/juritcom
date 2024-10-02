// src/auth/auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'

@Injectable()
export class JwtAuthGuard implements CanActivate /*AuthGuard('bearer')*/ {
  async canActivate(
    context: ExecutionContext,
  )  {
    const request = context.switchToHttp().getRequest();
    const value = await this.validateRequest(request);
    console.log(' value ', value)
    return new Promise<boolean>(resolve => resolve(true));
  }

  constructor(private authService: AuthService) {}

  async validateRequest(request: any) {
    const token = request.headers.authorization;
    return await this.authService.validateToken(token.split('Bearer ')[1]);
  }
}
