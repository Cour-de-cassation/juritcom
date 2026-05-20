import * as jwt from 'jsonwebtoken'
import * as jwtUtils from './jwt.utils'

const SYSTEM_SUBJECT = 'system'
const TEST_ALGORITHM: jwt.Algorithm = 'HS256'
const TEST_CLIENT = 'jest-client'
const TEST_ISSUER = 'jest-issuer'
const TEST_ISSUER_OTHER = 'jest-issuer-other'
const TEST_ISSUER_UNKNOWN = 'unknown-issuer'
const TEST_SECRET = 'jest-secret'
const TEST_EXPIRATION_SECONDS = 900

describe('jwtUtils', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT with correct payload', () => {
      const token = jwtUtils.generateToken(TEST_CLIENT)
      const decoded = jwt.decode(token) as jwt.JwtPayload

      expect(decoded).toMatchObject({
        sub: SYSTEM_SUBJECT,
        clientId: TEST_CLIENT,
        iss: TEST_ISSUER
      })
      expect(decoded.exp - decoded.iat).toBe(TEST_EXPIRATION_SECONDS)
    })

    it('should return null if jwt.sign throws', () => {
      jest.spyOn(jwt, 'sign').mockImplementation(() => {
        throw new Error('signing error')
      })

      const token = jwtUtils.generateToken(TEST_CLIENT)
      expect(token).toBeNull()

      jest.restoreAllMocks()
    })
  })

  describe('verifyToken', () => {
    function signAndVerify(options?: { secret?: string; issuer?: string; expiresIn?: number }) {
      const secret = options?.secret ?? TEST_SECRET
      const issuer = options?.issuer ?? TEST_ISSUER
      const expiresIn = options?.expiresIn ?? TEST_EXPIRATION_SECONDS

      const token = jwt.sign({ sub: SYSTEM_SUBJECT, clientId: TEST_CLIENT }, secret, {
        algorithm: TEST_ALGORITHM,
        issuer,
        expiresIn
      })

      return jwtUtils.verifyToken(token)
    }

    it('should return not null payload for a valid token', () => {
      const decoded = signAndVerify()

      expect(decoded.sub).toBe(SYSTEM_SUBJECT)
      expect(decoded.clientId).toBe(TEST_CLIENT)
      expect(decoded.iss).toBe(TEST_ISSUER)
    })

    it('should accept a token from any accepted issuer', () => {
      const decoded = signAndVerify({ issuer: TEST_ISSUER_OTHER })

      expect(decoded.clientId).toBe(TEST_CLIENT)
      expect(decoded.iss).toBe(TEST_ISSUER_OTHER)
    })

    it('should return null with an unknown issuer', () => {
      const decoded = signAndVerify({ issuer: TEST_ISSUER_UNKNOWN })

      expect(decoded).toBeNull()
    })

    it('should return null for an expired token', () => {
      const decoded = signAndVerify({ expiresIn: 0 })

      expect(decoded).toBeNull()
    })

    it('should return null for a token signed with a wrong secret', () => {
      const decoded = signAndVerify({ secret: 'wrong-secret' })

      expect(decoded).toBeNull()
    })

    it('should return null for a malformed token', () => {
      expect(jwtUtils.verifyToken('not.a.jwt')).toBeNull()
      expect(jwtUtils.verifyToken('')).toBeNull()
    })
  })

  describe('extractBearerToken', () => {
    it('should extract token from valid Bearer header', () => {
      expect(jwtUtils.extractBearerToken('Bearer abc123')).toBe('abc123')
    })

    it('should return null for missing header', () => {
      expect(jwtUtils.extractBearerToken(null)).toBeNull()
      expect(jwtUtils.extractBearerToken(undefined)).toBeNull()
      expect(jwtUtils.extractBearerToken('')).toBeNull()
    })

    it('should return null for non-Bearer scheme', () => {
      expect(jwtUtils.extractBearerToken('Basic abc123')).toBeNull()
      expect(jwtUtils.extractBearerToken('Token abc123')).toBeNull()
    })

    it('should be case-sensitive on "Bearer "', () => {
      expect(jwtUtils.extractBearerToken('bearer abc123')).toBeNull()
      expect(jwtUtils.extractBearerToken('BEARER abc123')).toBeNull()
    })
  })

  describe('env validation', () => {
    const originalEnv = process.env

    afterEach(() => {
      process.env = originalEnv
      jest.resetModules()
    })

    it.each(['JWT_SECRET', 'JWT_ISSUER', 'JWT_ALGORITHM'])(
      'should throw if %s is missing',
      async (varName) => {
        process.env = { ...originalEnv }
        delete process.env[varName]
        jest.resetModules()

        await expect(import('./jwt.utils')).rejects.toThrow(
          `Missing required environment variable: ${varName}`
        )
      }
    )
  })
})
