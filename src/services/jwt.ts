import * as jwt from 'jsonwebtoken'
import { logger } from '../config/logger'
import { JWT_ISSUER, JWT_ALGORITHM, JWT_SECRET, JWT_EXPIRATION_SECONDS, JWT_ACCEPTED_ISSUERS } from '../config/env'

const JWT_SUBJECT = 'system'
const acceptedIssuers = JWT_ACCEPTED_ISSUERS
  ? JWT_ACCEPTED_ISSUERS.split(',').map((s) => s.trim())
  : [JWT_ISSUER]

export const JWT_EXPIRATION_SECONDS_NUMBER = parseInt(JWT_EXPIRATION_SECONDS, 10) || 900

export function generateToken(clientId: string): string | null {
  try {
    const payload = { sub: JWT_SUBJECT, clientId }
    const options: jwt.SignOptions = {
      algorithm: JWT_ALGORITHM as jwt.Algorithm,
      issuer: JWT_ISSUER,
      expiresIn: JWT_EXPIRATION_SECONDS_NUMBER
    }
    return jwt.sign(payload, JWT_SECRET, options)
  } catch (error) {
    logger.error({
      path: 'src/services/jwt.ts',
      operations: ['other', 'generateToken'],
      message: `Generate token error: ${error.message}`,
      stack: error.stack
    })
    return null
  }
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    const options: jwt.VerifyOptions = {
      algorithms: [JWT_ALGORITHM as jwt.Algorithm],
      issuer: acceptedIssuers as [string, ...string[]]
    }
    return jwt.verify(token, JWT_SECRET, options) as jwt.JwtPayload
  } catch (error) {
    logger.error({
      path: 'src/services/jwt.ts',
      operations: ['other', 'verifyToken'],
      message: `Verify token error: ${error.message}`,
      stack: error.stack
    })
    return null
  }
}

export function extractBearerToken(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

export function extractClientCredentials(
  body: { client_id?: string; client_secret?: string },
  authHeader: string
): { clientId: string | null; clientSecret: string | null } {
  if (body?.client_id) {
    return { clientId: body.client_id, clientSecret: body.client_secret ?? null }
  }

  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString()
    const colonIndex = decoded.indexOf(':')
    if (colonIndex >= 0) {
      return {
        clientId: decoded.substring(0, colonIndex),
        clientSecret: decoded.substring(colonIndex + 1)
      }
    }
  }

  return { clientId: null, clientSecret: null }
}
