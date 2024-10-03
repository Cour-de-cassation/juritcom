import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'

@Injectable()
export class JwtAuthGuard implements CanActivate  {
  async canActivate(
    context: ExecutionContext,
  )  {
    const request = context.switchToHttp().getRequest();
    const value = await this.validateRequest(request);
    if(!value){
      throw new UnauthorizedException('You are not authorized to access this resource.')
    }
    return new Promise<boolean>(resolve => resolve(value));
  }

  constructor(private authService: AuthService) {}

  async validateRequest(request: any) {
    const autorization = request.headers.authorization;
    const token = autorization?.split('Bearer ')[1];
    if(!token) {
      return false;
    }
    return await this.authService.validateToken(token);
  }
}
