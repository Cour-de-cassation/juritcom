import { Router } from 'express'
import { timingSafeEqual } from 'crypto'
import * as jwtUtils from '../services/jwt'
import { JWT_CLIENT_ID, JWT_CLIENT_SECRET } from '../config/env'

const ENABLED_SCOPES = ['collect']

function safeCompare(a: string, b: string): boolean {
  const aLen = Buffer.byteLength(a)
  const bLen = Buffer.byteLength(b)
  const aBuf = Buffer.alloc(aLen, 0, 'utf8')
  aBuf.write(a)
  const bBuf = Buffer.alloc(aLen, 0, 'utf8')
  bBuf.write(b)
  return !!(timingSafeEqual(aBuf, bBuf) && aLen === bLen)
}

function isValidClient(clientId: string, clientSecret: string): boolean {
  return safeCompare(clientId, JWT_CLIENT_ID) && safeCompare(clientSecret, JWT_CLIENT_SECRET)
}

const router = Router()

router.post('/token', (req, res) => {
  try {
    const { clientId, clientSecret } = jwtUtils.extractClientCredentials(
      req.body,
      req.headers.authorization ?? ''
    )

    if (!clientId || !clientSecret || !isValidClient(clientId, clientSecret)) {
      res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      })
      return
    }

    const grantType = req.body?.grant_type
    if (grantType !== 'client_credentials') {
      res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only client_credentials grant type is supported'
      })
      return
    }

    const accessToken = jwtUtils.generateToken(clientId)
    if (!accessToken) {
      res.status(500).json({
        error: 'server_error',
        error_description: 'Failed to generate token'
      })
      return
    }

    res.status(200).json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: jwtUtils.JWT_EXPIRATION_SECONDS_NUMBER,
      scope: ENABLED_SCOPES
    })
  } catch (error) {
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    })
  }
})

router.get('/test-auth', (req, res) => {
  const token = jwtUtils.extractBearerToken(req.headers.authorization ?? '')
  if (!token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' })
    return
  }

  const decoded = jwtUtils.verifyToken(token)
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  res.status(200).json({ test: true, decoded })
})

export default router
