import { Test, TestingModule } from '@nestjs/testing'
import { OauthService } from './oauth.service'
import axios from 'axios'
import * as jwt from 'jsonwebtoken'

jest.mock('axios')
jest.mock('jsonwebtoken')

describe('OauthService', () => {
  let oauthService: OauthService
  process.env.OAUTH_PROVIDER_URL = 'http://opn2vmla123:80/realms/juritcom'
  process.env.OAUTH_CLIENT_ID = 'juritcom'
  process.env.OAUTH_ALGORITHM = 'RS256'
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OauthService]
    }).compile()

    oauthService = module.get<OauthService>(OauthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('validateToken', () => {
    it('should return false if token is not provided', async () => {
      const result = await oauthService.validateToken('')
      expect(result).toBe(false)
    })

    it('should return false if the token issuer is invalid', async () => {
      const token = 'fake-token'
      const decodedToken = {
        payload: {
          iss: 'wrong-issuer',
          azp: process.env.OAUTH_CLIENT_ID,
          exp: Date.now() / 1000 + 60
        }
      }

      jest.spyOn(jwt, 'decode').mockReturnValue(decodedToken)
      jest.spyOn(oauthService, 'getPublicKey').mockResolvedValue({ x5c: ['mock-cert'] })

      const result = await oauthService.validateToken(token)
      expect(result).toBe(false)
    })

    it('should return false if the token audience is invalid', async () => {
      const token = 'fake-token'
      const decodedToken = {
        payload: {
          iss: process.env.OAUTH_PROVIDER_URL,
          azp: 'wrong-client-id',
          exp: Date.now() / 1000 + 60
        }
      }

      jest.spyOn(jwt, 'decode').mockReturnValue(decodedToken)
      jest.spyOn(oauthService, 'getPublicKey').mockResolvedValue({ x5c: ['mock-cert'] })

      const result = await oauthService.validateToken(token)
      expect(result).toBe(false)
    })

    it('should return false if the token is expired', async () => {
      const token = 'fake-token'
      const decodedToken = {
        payload: {
          iss: process.env.OAUTH_PROVIDER_URL,
          azp: process.env.OAUTH_CLIENT_ID,
          exp: Date.now() / 1000 - 60
        }
      }

      jest.spyOn(jwt, 'decode').mockReturnValue(decodedToken)
      jest.spyOn(oauthService, 'getPublicKey').mockResolvedValue({ x5c: ['mock-cert'] })

      const result = await oauthService.validateToken(token)
      expect(result).toBe(false)
    })

    it('should return true if the token is valid', async () => {
      const token = 'valid-token'
      const decodedToken = {
        payload: {
          iss: process.env.OAUTH_PROVIDER_URL,
          azp: process.env.OAUTH_CLIENT_ID,
          exp: Math.floor(Date.now() / 1000) + 60
        }
      }

      jest.spyOn(jwt, 'decode').mockReturnValue(decodedToken)
      jest.spyOn(oauthService, 'getPublicKey').mockResolvedValue({ x5c: ['mock-cert'] })
      jest.spyOn(jwt, 'verify').mockImplementation((token, pem, options) => {
        return true
      })

      const result = await oauthService.validateToken(token)
      expect(result).toBe(true)
    })

    it('should return false if jwt.verify throws an error', async () => {
      const token = 'invalid-token'
      const decodedToken = {
        payload: {
          iss: process.env.OAUTH_PROVIDER_URL,
          azp: process.env.OAUTH_CLIENT_ID,
          exp: Date.now() / 1000 + 60
        }
      }

      jest.spyOn(jwt, 'decode').mockReturnValue(decodedToken)
      jest.spyOn(oauthService, 'getPublicKey').mockResolvedValue({ x5c: ['mock-cert'] })
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const result = await oauthService.validateToken(token)
      expect(result).toBe(false)
    })
  })

  describe('getToken', () => {
    it('should fetch an access token', async () => {
      const mockResponse = { data: { access_token: 'mock-access-token' } }
      ;(axios.request as jest.Mock).mockResolvedValue(mockResponse)

      const result = await oauthService.getToken()
      expect(result).toBe('mock-access-token')
      expect(axios.request).toHaveBeenCalled()
    })
  })

  describe('getPublicKey', () => {
    it('should fetch the public signing key', async () => {
      const mockResponse = {
        data: {
          keys: [{ use: 'sig', alg: process.env.OAUTH_ALGORITHM, x5c: ['mock-cert'] }]
        }
      }
      ;(axios.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await oauthService.getPublicKey()
      expect(result).toEqual({ use: 'sig', alg: process.env.OAUTH_ALGORITHM, x5c: ['mock-cert'] })
      expect(axios.get).toHaveBeenCalledWith(`${process.env.OAUTH_PROVIDER_CERT_URL}`)
    })

    it('should return undefined if no signing key is found', async () => {
      const mockResponse = { data: { keys: [] } }
      ;(axios.get as jest.Mock).mockResolvedValue(mockResponse)

      const result = await oauthService.getPublicKey()
      expect(result).toBeUndefined()
    })
  })
})
