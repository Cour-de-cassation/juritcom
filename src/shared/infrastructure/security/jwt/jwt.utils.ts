import * as jwt from 'jsonwebtoken'
import { Logger } from '@nestjs/common'

const logger = new Logger('shared/infrastructure/security/jwt/jwt.utils')

// Private const
const JWT_SUBJECT = 'system'
const JWT_ISSUER = process.env.JWT_ISSUER
const JWT_ACCEPTED_ISSUERS = process.env.JWT_ACCEPTED_ISSUERS
  ? process.env.JWT_ACCEPTED_ISSUERS.split(',').map((s) => s.trim())
  : [JWT_ISSUER]
const JWT_ALGORITHM = process.env.JWT_ALGORITHM
const JWT_SECRET = process.env.JWT_SECRET

// Public const
export const JWT_EXPIRATION_SECONDS = parseInt(process.env.JWT_EXPIRATION_SECONDS, 10) || 900

// Fail fast if any required variable is missing
function validateEnv() {
  const requiredVars = { JWT_ISSUER, JWT_ALGORITHM, JWT_SECRET }
  for (const [name, value] of Object.entries(requiredVars)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`)
    }
  }
}
validateEnv()

export function generateToken(clientId: string): string | null {
  try {
    const payload = {
      sub: JWT_SUBJECT,
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

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    const options = {
      algorithms: [JWT_ALGORITHM as jwt.Algorithm],
      issuer: JWT_ACCEPTED_ISSUERS as [string, ...string[]]
    }

    return jwt.verify(token, JWT_SECRET, options) as jwt.JwtPayload
  } catch (error) {
    logger.error(`Verify token error: ${error.message}`)

    return null
  }
}

export function extractBearerToken(authHeader: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  return authHeader.substring(7)
}

