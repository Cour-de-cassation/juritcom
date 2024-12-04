import { BatchService } from './batch.service'
import { DecisionRepository } from '../api/domain/decisions/repositories/decision.repository'
import { Logger } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import { SchedulerRegistry } from '@nestjs/schedule/dist/scheduler.registry'

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn()
  },
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn()
}))
jest.mock('path', () => ({
  join: jest.fn()
}))
jest.mock('../shared/infrastructure/repositories/decisionS3.repository')

describe('BatchService', () => {
  let batchService: BatchService
  let decisionRepository: jest.Mocked<DecisionRepository>
  let logger: jest.Mocked<Logger>
  let schedulerRegistry: jest.Mocked<SchedulerRegistry>

  const mockFolderPath = '/mock-folder'
  const mockFileNames = [
    '05526bff-58be-4f35-b0a9-b3bfbdd9e1ea_file_1.pdf',
    'c5e1783b-9fa4-4147-9b16-90b902060866_file2.pdf'
  ]
  const mockFileData = Buffer.from('mock file data')

  beforeEach(() => {
    process.env.AV_PDF_PATH = mockFolderPath
    process.env.S3_PDF_FILE_NAME_SEPARATOR = '_-_-_-_'
    process.env.S3_ARCHIVE_SCHEDULE = '0 */5 * * * *'

    decisionRepository = {
      uploadFichierDecisionIntegre: jest.fn()
    } as unknown as jest.Mocked<DecisionRepository>

    logger = new Logger() as jest.Mocked<Logger>
    logger.log = jest.fn()
    logger.error = jest.fn()

    schedulerRegistry = {
      addCronJob: jest.fn()
    } as unknown as jest.Mocked<SchedulerRegistry>

    batchService = new BatchService(schedulerRegistry)
    ;(batchService as any).decisionsRepository = decisionRepository
    ;(batchService as any).logger = logger
    ;(fs.readdirSync as jest.Mock).mockReturnValue(mockFileNames)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should log an error if reading files fails', async () => {
    ;(fs.readdirSync as jest.Mock).mockImplementation(() => {
      throw new Error('File read error')
    })

    await batchService.archiveFilesToS3()

    expect(logger.error).toHaveBeenCalledWith({
      data: new Error('File read error'),
      msg: 'File read error',
      operationName: 'archiveFilesToS3'
    })
  })

  it('should process files in the folder and upload them', async () => {
    ;(path.join as jest.Mock).mockImplementation((folder, file) => `${folder}/${file}`)
    ;(fs.statSync as jest.Mock).mockReturnValue({ isFile: () => true })
    ;(fs.readFileSync as jest.Mock).mockReturnValue(mockFileData)
    ;(fs.unlinkSync as jest.Mock).mockImplementation(() => {})

    await batchService.archiveFilesToS3()

    mockFileNames.forEach((filename) => {
      expect(decisionRepository.uploadFichierDecisionIntegre).toHaveBeenCalledTimes(
        mockFileNames.length
      )
      expect(fs.unlinkSync).toHaveBeenCalledWith(`${mockFolderPath}/${filename}`)
    })

    expect(logger.log).toHaveBeenCalledWith({
      msg: 'Starting scan',
      operationName: 'archiveFilesToS3'
    })
    expect(logger.log).toHaveBeenCalledWith({
      msg: 'End of scan',
      operationName: 'archiveFilesToS3'
    })
  })

  it('should skip non-file entries in the folder', async () => {
    const mockEntries = ['file1.pdf', 'file2.pdf']

    ;(fs.readdirSync as jest.Mock).mockReturnValue(mockEntries)
    ;(path.join as jest.Mock).mockImplementation((folder, file) => `${folder}/${file}`)
    ;(fs.statSync as jest.Mock).mockImplementation(() => {
      return {
        isFile: () => true
      }
    })
    ;(fs.readFileSync as jest.Mock).mockReturnValue(mockFileData)
    ;(fs.unlinkSync as jest.Mock).mockImplementation(() => {})

    await batchService.archiveFilesToS3()

    expect(fs.unlinkSync).toHaveBeenCalledWith(`${mockFolderPath}/file1.pdf`)
  })

  it('should throw and log an error if upload fails', async () => {
    ;(path.join as jest.Mock).mockImplementation((folder, file) => `${folder}/${file}`)
    ;(fs.statSync as jest.Mock).mockReturnValue({ isFile: () => true })
    ;(fs.readFileSync as jest.Mock).mockReturnValue(mockFileData)
    ;(decisionRepository.uploadFichierDecisionIntegre as jest.Mock).mockImplementation(() => {
      throw new Error('Upload error')
    })

    await batchService.archiveFilesToS3()

    expect(logger.error).toHaveBeenCalledWith({
      data: new Error('Upload error'),
      msg: 'Upload error',
      operationName: 'archiveFilesToS3'
    })
  })
})
