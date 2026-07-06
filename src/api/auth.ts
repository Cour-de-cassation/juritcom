import { Request, Response, NextFunction } from 'express'
import * as jwtUtils from '../services/jwt'
import { safeCompare } from '../services/crypto'
import { DOC_LOGIN, DOC_PASSWORD, USE_AUTH } from '../config/env'
import { logger } from '../config/logger'

function parseBasicAuth(authHeader: string): { name: string; pass: string } | undefined {
  const credentialsRegex = /^ *(?:[Bb][Aa][Ss][Ii][Cc]) +([A-Za-z0-9._~+/-]+=*) *$/
  const userPassRegex = /^([^:]*):(.*)$/

  if (typeof authHeader !== 'string') return undefined

  const match = credentialsRegex.exec(authHeader)
  if (!match) return undefined

  const userPass = userPassRegex.exec(Buffer.from(match[1], 'base64').toString())
  if (!userPass) return undefined

  return { name: userPass[1], pass: userPass[2] }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const formatLogs = {
    path: 'src/api/auth.ts',
    operations: ['other', 'authMiddleware'] as const
  }

  const useAuth = USE_AUTH

  if (useAuth === 'basic') {
    const parsed = parseBasicAuth(req.headers.authorization ?? '')
    if (parsed && safeCompare(parsed.name, DOC_LOGIN) && safeCompare(parsed.pass, DOC_PASSWORD)) {
      logger.info({ ...formatLogs, message: 'Validate request using Basic: true' })
      next()
      return
    }
    logger.error({ ...formatLogs, message: 'Validate request using Basic: false' })
    res.status(401).json({ error: 'You are not authorized to access this resource.' })
    return
  }

  if (useAuth === 'jwt') {
    const token = jwtUtils.extractBearerToken(req.headers.authorization ?? '')
    if (!token) {
      logger.error({ ...formatLogs, message: 'Missing or invalid Authorization header' })
      res.status(401).json({ error: 'You are not authorized to access this resource.' })
      return
    }

    const decoded = jwtUtils.verifyToken(token)
    if (!decoded) {
      logger.error({ ...formatLogs, message: 'Invalid or expired token' })
      res.status(401).json({ error: 'You are not authorized to access this resource.' })
      return
    }

    logger.info({ ...formatLogs, message: 'Validate request using JWT: true' })
    next()
    return
  }

  res.status(401).json({ error: 'You are not authorized to access this resource.' })
}
