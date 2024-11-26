import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { getOAuth, getModel } from '../../../../api/main'
const Request = require('@node-oauth/oauth2-server').Request
const Response = require('@node-oauth/oauth2-server').Response

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const response = context.switchToHttp().getResponse()
    const value = await this.validateRequest(request, response, context)
    if (!value) {
      throw new UnauthorizedException('You are not authorized to access this resource.')
    }
    return new Promise<boolean>((resolve) => resolve(value))
  }

  async validateRequest(req: any, res: any, context: ExecutionContext) {
    let token
    const oAuth = getOAuth()
    const model = getModel()
    const request = new Request(req)
    const response = new Response(res)

    try {
      token = await oAuth.server.authenticate(request, response)
    } catch (e) {
      return false
    }

    if (!token) {
      return false
    }

    if (token.user && token.client && token.scope) {
      const validateScope = await model.validateScope(token.user, token.client, token.scope)
      return validateScope !== false
    } else {
      return false
    }
  }
}
