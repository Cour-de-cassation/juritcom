import { JwtAuthGuard } from './auth.guard'
import * as jwtUtils from '../jwt/jwt.utils'

const TEST_CLIENT = 'jest-client'

describe('JwtAuthGuard - validateJwt', () => {
  let guard: JwtAuthGuard

  beforeEach(() => {
    guard = new JwtAuthGuard()
  })

  it('should return true and set request.user for valid token', () => {
    const token = jwtUtils.generateToken(TEST_CLIENT)
    const request: any = { headers: { authorization: `Bearer ${token}` } }
    const isValidJwt = guard.validateJwt(request)

    expect(isValidJwt).toBe(true)
    expect(request.user).toBeDefined()
    expect(request.user.clientId).toBe(TEST_CLIENT)
  })

  it('should return false if no Authorization header', () => {
    const request: any = { headers: {} }
    const isValidJwt = guard.validateJwt(request)

    expect(isValidJwt).toBe(false)
  })

  it('should return false if Authorization is not Bearer', () => {
    const request: any = { headers: { authorization: 'Basic abc123' } }
    const isValidJwt = guard.validateJwt(request)

    expect(isValidJwt).toBe(false)
  })

  it('should return false for invalid token', () => {
    const request: any = { headers: { authorization: 'Bearer invalid.token.here' } }
    const isValidJwt = guard.validateJwt(request)

    expect(isValidJwt).toBe(false)
  })
})
