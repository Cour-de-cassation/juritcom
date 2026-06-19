import { MockUtils } from '../../utils/mock'

const mockSaveDecisionFile = jest.fn()
const mockSaveFileMetadata = jest.fn()
const mockSaveDeleteMetadata = jest.fn()

jest.mock('../../connectors/s3', () => ({
  saveDecisionFile: (...args: unknown[]) => mockSaveDecisionFile(...args)
}))

jest.mock('../../connectors/mongodb', () => ({
  saveFileMetadata: (...args: unknown[]) => mockSaveFileMetadata(...args),
  saveDeleteMetadata: (...args: unknown[]) => mockSaveDeleteMetadata(...args)
}))

import { saveDecision, deleteDecision } from './handler'

const mockUtils = new MockUtils()
const fakeFile = { originalname: 'decision.pdf', buffer: Buffer.from('') } as Express.Multer.File
const fakeMetadonnees = mockUtils.mandatoryMetadonneesDtoMock
const fakeTextDecisionIntegre = 'Mon texte de décision\nde justice'

describe('saveDecision handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSaveDecisionFile.mockResolvedValue(undefined)
    mockSaveFileMetadata.mockResolvedValue({ _id: 'fake-id' })
    mockSaveDeleteMetadata.mockResolvedValue({ _id: 'fake-delete-id' })
  })

  describe('saveDecision', () => {
    it('returns a fileName with .pdf extension', async () => {
      const result = await saveDecision(fakeFile, fakeMetadonnees, fakeTextDecisionIntegre)
      expect(result.fileName).toMatch(/\.pdf$/)
    })

    it('returns rawfileId from mongo', async () => {
      const result = await saveDecision(fakeFile, fakeMetadonnees, fakeTextDecisionIntegre)
      expect(result.rawfileId).toBe('fake-id')
    })

    it('calls saveDecisionFile with the file and generated filename', async () => {
      await saveDecision(fakeFile, fakeMetadonnees, fakeTextDecisionIntegre)

      expect(mockSaveDecisionFile).toHaveBeenCalledTimes(1)
      const [calledFile, calledFileName] = mockSaveDecisionFile.mock.calls[0]
      expect(calledFile).toBe(fakeFile)
      expect(calledFileName).toMatch(/\.pdf$/)
    })

    it('calls saveFileMetadata with correct structure', async () => {
      await saveDecision(fakeFile, fakeMetadonnees, fakeTextDecisionIntegre)

      expect(mockSaveFileMetadata).toHaveBeenCalledTimes(1)
      const calledWith = mockSaveFileMetadata.mock.calls[0][0]
      expect(calledWith).toHaveProperty('path')
      expect(calledWith).toHaveProperty('events')
      expect(calledWith).toHaveProperty('metadatas')
      expect(calledWith.metadatas).toEqual({
        metadonnees: fakeMetadonnees,
        textDecisionIntegre: fakeTextDecisionIntegre
      })
    })

    it('includes created event with date', async () => {
      await saveDecision(fakeFile, fakeMetadonnees, fakeTextDecisionIntegre)

      const calledWith = mockSaveFileMetadata.mock.calls[0][0]
      expect(calledWith.events[0]).toEqual({ type: 'created', date: expect.any(Date) })
    })
  })

  describe('deleteDecision', () => {
    it('returns rawfileId from mongo', async () => {
      const result = await deleteDecision('some-decision-id')
      expect(result.rawfileId).toBe('fake-delete-id')
    })

    it('calls saveDeleteMetadata with decisionId and created event', async () => {
      await deleteDecision('some-decision-id')

      expect(mockSaveDeleteMetadata).toHaveBeenCalledTimes(1)
      const calledWith = mockSaveDeleteMetadata.mock.calls[0][0]
      expect(calledWith.decisionId).toBe('some-decision-id')
      expect(calledWith.events[0]).toEqual({ type: 'created', date: expect.any(Date) })
    })
  })
})
