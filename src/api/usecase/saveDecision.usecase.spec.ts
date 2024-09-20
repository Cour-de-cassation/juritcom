import { mock, MockProxy } from 'jest-mock-extended'
import { MockUtils } from '../../shared/infrastructure/utils/mock.utils'
import { SaveDecisionUsecase } from './saveDecision.usecase'
import { DecisionRepository } from '../domain/decisions/repositories/decision.repository'
import { MetadonneeDto } from '../../shared/infrastructure/dto/metadonnee.dto'

const fakeFilename = 'test'
jest.mock('uuid', () => ({ v4: () => fakeFilename }))

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

    await usecase.putDecision(fichierDecisionIntegre, 'test', metadonnees)

    const requestDto = {
      texteDecisionIntegre: 'test',
      metadonnees
    }
    expect(mockDecisionRepository.saveDataDecisionIntegre).toHaveBeenCalledWith(
      JSON.stringify(requestDto),
      'test.pdf',
      'test.json'
    )
    const param = {
      destination: '',
      filename: 'test.pdf',
      mimetype: 'application/pdf',
      originalname: 'test.pdf',
      path: '',
      size: 4
    }
    expect(mockDecisionRepository.uploadFichierDecisionIntegre).toHaveBeenCalledWith(
      param,
      'test.pdf',
      'test-test.pdf'
    )
  })
})
