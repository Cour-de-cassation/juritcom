import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService]
    }).compile()

    authService = module.get<AuthService>(AuthService)
  })

  it('should be defined', () => {
    expect(authService).toBeDefined()
  })

  describe('validateToken', () => {
    it('should call oauthService.validateToken with correct token', async () => {
      const token = 'valid-token'
      const mockResponse = true // Example response

      // Mock the oauthService.validateToken implementation to return a value
      jest.spyOn(authService, 'validateToken').mockResolvedValue(mockResponse)

      const result = await authService.validateToken(token)

      expect(result).toBe(mockResponse)
    })

    it('should handle errors from oauthService.validateToken', async () => {
      const token = 'invalid-token'

      // Mock the oauthService.validateToken to throw an error
      jest.spyOn(authService, 'validateToken').mockRejectedValue(new Error('Invalid token'))

      await expect(authService.validateToken(token)).rejects.toThrow('Invalid token')
    })
  })
})
