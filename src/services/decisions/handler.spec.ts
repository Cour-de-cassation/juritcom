import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { MockUtils } from '../../utils/mock'
import { saveDecision, deleteDecision } from './handler'
import { saveDecisionFile } from '../../connectors/s3'
import { saveDeleteMetadata, saveFileMetadata } from '../../connectors/mongodb'
import { ObjectId } from 'mongodb'

jest.mock('../../connectors/s3', () => ({
  saveDecisionFile: jest.fn<typeof saveDecisionFile>()
}))

jest.mock('../../connectors/mongodb', () => ({
  saveFileMetadata: jest.fn<typeof saveFileMetadata>(),
  saveDeleteMetadata: jest.fn<typeof saveDeleteMetadata>()
}))

const mockSaveDecisionFile = jest.mocked(saveDecisionFile)
const mockSaveFileMetadata = jest.mocked(saveFileMetadata)
const mockSaveDeleteMetadata = jest.mocked(saveDeleteMetadata)

const mockUtils = new MockUtils()
const fakeFile = { originalname: 'decision.pdf', buffer: Buffer.from('') } as Express.Multer.File
const fakeMetadonnees = mockUtils.mandatoryMetadonneesDtoMock
const fakeTextDecisionIntegre = 'Mon texte de décision\nde justice'

describe('saveDecision handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSaveDecisionFile.mockResolvedValue(undefined)
    mockSaveFileMetadata.mockResolvedValue({ _id: new ObjectId('111111111111111111111111') })
    mockSaveDeleteMetadata.mockResolvedValue({ _id: new ObjectId('222222222222222222222222') })
  })

  describe('saveDecision', () => {
    it('returns a fileName with .pdf extension', async () => {
      const result = await saveDecision(fakeFile, fakeMetadonnees, fakeTextDecisionIntegre)
      expect(result.fileName).toMatch(/\.pdf$/)
    })

    it('returns rawfileId from mongo', async () => {
      const result = await saveDecision(fakeFile, fakeMetadonnees, fakeTextDecisionIntegre)
      expect(result.rawfileId).toBe('111111111111111111111111')
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
        texteDecisionIntegre: fakeTextDecisionIntegre
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
      expect(result.rawfileId).toBe('222222222222222222222222')
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
