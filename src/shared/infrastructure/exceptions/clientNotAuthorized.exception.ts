import { HttpException, HttpStatus } from '@nestjs/common'

export class ClientNotAuthorizedException extends HttpException {
  constructor(authorizationHeaderMissing: string) {
    super("Vous n'êtes pas autorisé à appeler cette route", HttpStatus.UNAUTHORIZED)
  }
}
