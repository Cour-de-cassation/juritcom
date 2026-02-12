import * as jwt from 'jsonwebtoken'
import { Logger } from '@nestjs/common'

const JWT_ISSUER = process.env.JWT_ISSUER
const JWT_ALGORITHM = process.env.JWT_ALGORITHM
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRATION_SECONDS = parseInt(process.env.JWT_EXPIRATION_SECONDS, 10) || 900

const logger = new Logger('shared/infrastructure/security/jwt/jwt.utils')

function generateToken(clientId: string): string | null {
  try {
    const payload = {
      sub: 'system',
      clientId
    }
    const options = {
      algorithm: JWT_ALGORITHM as jwt.Algorithm,
      issuer: JWT_ISSUER,
      expiresIn: JWT_EXPIRATION_SECONDS
    }

    return jwt.sign(payload, JWT_SECRET, options)
  } catch (error) {
    logger.error(`Generate token error: ${error.message}`)

    return null
  }
}

function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    const options = {
      algorithms: [JWT_ALGORITHM as jwt.Algorithm],
      issuer: JWT_ISSUER
    }

    return jwt.verify(token, JWT_SECRET, options) as jwt.JwtPayload
  } catch (error) {
    logger.error(`Verify token error: ${error.message}`)

    return null
  }
}

function extractBearerToken(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.substring(7)
}

export { generateToken, verifyToken, extractBearerToken, JWT_EXPIRATION_SECONDS }
