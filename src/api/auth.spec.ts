import { authMiddleware } from './auth'
import * as jwtUtils from '../services/jwt'

const TEST_CLIENT = 'jest-client'

describe('authMiddleware', () => {
  const mockNext = jest.fn()
  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('USE_AUTH=jwt', () => {
    beforeEach(() => {
      process.env.USE_AUTH = 'jwt'
    })

    it('calls next() for a valid token', () => {
      const token = jwtUtils.generateToken(TEST_CLIENT)
      const mockReq: any = {
        headers: { authorization: `Bearer ${token}` }
      }

      authMiddleware(mockReq, mockRes as any, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
      expect(mockRes.status).not.toHaveBeenCalled()
    })

    it('returns 401 for a missing token', () => {
      const mockReq: any = { headers: {} }

      authMiddleware(mockReq, mockRes as any, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('returns 401 for an invalid token', () => {
      const mockReq: any = {
        headers: { authorization: 'Bearer invalid-token' }
      }

      authMiddleware(mockReq, mockRes as any, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })

  describe('USE_AUTH=basic', () => {
    beforeEach(() => {
      process.env.USE_AUTH = 'basic'
    })

    it('calls next() for valid basic credentials', () => {
      const credentials = Buffer.from(
        `${process.env.DOC_LOGIN}:${process.env.DOC_PASSWORD}`
      ).toString('base64')
      const mockReq: any = {
        headers: { authorization: `Basic ${credentials}` }
      }

      authMiddleware(mockReq, mockRes as any, mockNext)

      expect(mockNext).toHaveBeenCalledTimes(1)
    })

    it('returns 401 for invalid basic credentials', () => {
      const credentials = Buffer.from('wrong:credentials').toString('base64')
      const mockReq: any = {
        headers: { authorization: `Basic ${credentials}` }
      }

      authMiddleware(mockReq, mockRes as any, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })

    it('returns 401 for missing authorization header', () => {
      const mockReq: any = { headers: {} }

      authMiddleware(mockReq, mockRes as any, mockNext)

      expect(mockNext).not.toHaveBeenCalled()
      expect(mockRes.status).toHaveBeenCalledWith(401)
    })
  })
})
