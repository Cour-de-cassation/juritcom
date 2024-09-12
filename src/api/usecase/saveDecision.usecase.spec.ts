import { Readable } from 'stream'
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

  it('calls the repository with valid parameters', async () => {
    // GIVEN
    const originalName = 'test.wpd'
    const generatedFilename = fakeFilename + '.json'
    const stream = new Readable()
    const decisionIntegre: Express.Multer.File = {
      fieldname: '',
      originalname: originalName,
      encoding: '',
      mimetype: '',
      size: 0,
      stream,
      destination: '',
      filename: originalName,
      path: '',
      buffer: Buffer.from('text')
    }
    const metadonnees = new MockUtils().mandatoryMetadonneesDtoMock

    /* Comment avoir un expected lisible et plus simple ?
     * Nous avons tenté en vain l'utilisation de deepMock (jest-extended) sur decisionIntegre pour
     * fournir un Express.Multer.File et sur metadonnees pour un MetadonneesDto simplfiés.
     */
    const expectedRequestDto = JSON.stringify({
      decisionIntegre: {
        fieldname: '',
        originalname: originalName,
        encoding: '',
        mimetype: '',
        size: 0,
        stream,
        destination: '',
        filename: originalName,
        path: '',
        buffer: { type: 'Buffer', data: [116, 101, 120, 116] }
      },
      metadonnees
    })

    // WHEN
    usecase.execute(decisionIntegre, metadonnees)

    // THEN
    expect(mockDecisionRepository.saveDecisionIntegre).toHaveBeenCalledWith(
      expectedRequestDto,
      generatedFilename
    )
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
    const metadonnees = new MockUtils().putDecisionMetadonneesDtoMock as unknown as MetadonneeDto

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
