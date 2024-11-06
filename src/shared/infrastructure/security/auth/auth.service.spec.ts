import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { OauthService } from '../oauth/oauth.service'

describe('AuthService', () => {
  let authService: AuthService
  let oauthService: OauthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: OauthService,
          useValue: {
            validateToken: jest.fn() // Mock the validateToken function
          }
        }
      ]
    }).compile()

    authService = module.get<AuthService>(AuthService)
    oauthService = module.get<OauthService>(OauthService)
  })

  it('should be defined', () => {
    expect(authService).toBeDefined()
  })

  describe('validateToken', () => {
    it('should call oauthService.validateToken with correct token', async () => {
      const token = 'valid-token'
      const mockResponse = true // Example response

      // Mock the oauthService.validateToken implementation to return a value
      jest.spyOn(oauthService, 'validateToken').mockResolvedValue(mockResponse)

      const result = await authService.validateToken(token)

      expect(oauthService.validateToken).toHaveBeenCalledWith(token)
      expect(result).toBe(mockResponse)
    })

    it('should handle errors from oauthService.validateToken', async () => {
      const token = 'invalid-token'

      // Mock the oauthService.validateToken to throw an error
      jest.spyOn(oauthService, 'validateToken').mockRejectedValue(new Error('Invalid token'))

      await expect(authService.validateToken(token)).rejects.toThrow('Invalid token')
    })
  })
})
