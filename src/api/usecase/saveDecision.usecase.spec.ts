import { mock, MockProxy } from 'jest-mock-extended'
import { MockUtils } from '../../shared/infrastructure/utils/mock.utils'
import { SaveDecisionUsecase } from './saveDecision.usecase'
import { DecisionRepository } from '../domain/decisions/repositories/decision.repository'
import { MetadonneeDto } from '../../shared/infrastructure/dto/metadonnee.dto'
import * as fs from 'fs'

const fakeFilename = 'test'
jest.mock('uuid', () => ({ v4: () => fakeFilename }))
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}))

describe('SaveDecision Usecase', () => {
  const mockDecisionRepository: MockProxy<DecisionRepository> = mock<DecisionRepository>()
  const usecase = new SaveDecisionUsecase(mockDecisionRepository)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should call putDecision integre', async () => {
    const fichierDecisionIntegre = {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 4,
      destination: '',
      filename: 'test.pdf',
      path: ''
    } as unknown as Express.Multer.File
    const metadonnees = new MockUtils().metadonneeDtoMock as unknown as MetadonneeDto
    ;(fs.writeFileSync as jest.Mock).mockImplementation(() => {})
    const now = new Date()
    now.setMilliseconds(0)
    metadonnees.date = now.toISOString()
    await usecase.putDecision(fichierDecisionIntegre, 'test', metadonnees)
    const now = new Date()
    now.setMilliseconds(0)
    const requestDto = {
      texteDecisionIntegre: 'test',
      metadonnees,
      date: now.toISOString()
    }
    expect(mockDecisionRepository.saveDataDecisionIntegre).toHaveBeenCalledWith(
      JSON.stringify(requestDto),
      'test.pdf',
      '0605_2001F00930_2012-12-05_19.json'
    )
  })
})
