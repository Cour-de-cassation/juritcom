import request from 'supertest'
import express from 'express'
import helmet from 'helmet'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { mockClient, AwsClientStub } from 'aws-sdk-client-mock'
import { MockUtils } from '../utils/mock'
import decisionsRouter from './decisions'
import { errorHandler } from './error'
import { loggerHttp } from './logger'
import { setS3Client } from '../connectors/s3'

jest.mock('../connectors/mongodb', () => ({
  saveFileMetadata: jest.fn().mockResolvedValue({ _id: 'fake-id' }),
  saveDeleteMetadata: jest.fn().mockResolvedValue({ _id: 'fake-delete-id' })
}))

describe('Decisions API', () => {
  let app: express.Express
  const mockS3: AwsClientStub<S3Client> = mockClient(S3Client)
  const mockUtils = new MockUtils()
  const metadata = mockUtils.mandatoryMetadonneesDtoMock
  const myBufferedFile = Buffer.from('some fake pdf data')
  const pdfFilename = 'decision.pdf'

  beforeAll(() => {
    process.env.USE_AUTH = 'basic'
    app = express()
    app.use(helmet())
    app.use(loggerHttp)
    app.use(express.json())
    app.use(express.urlencoded({ extended: false }))
    app.use(decisionsRouter)
    app.use(errorHandler)

    setS3Client(mockS3 as unknown as S3Client)
  })

  beforeEach(() => {
    mockS3.reset()
    mockS3.on(PutObjectCommand).resolves({})
  })

  function validAuthHeader(): string {
    const credentials = Buffer.from(
      `${process.env.DOC_LOGIN}:${process.env.DOC_PASSWORD}`
    ).toString('base64')
    return `Basic ${credentials}`
  }

  describe('PUT /v1/decision', () => {
    describe('returns 201', () => {
      it('with generated correlation ID when there are metadata and a PDF file', async () => {
        const res = await request(app)
          .put('/v1/decision')
          .set('Authorization', validAuthHeader())
          .attach('fichierDecisionIntegre', myBufferedFile, { filename: pdfFilename, contentType: 'application/pdf' })
          .field('metadonnees', JSON.stringify(metadata))
          .field('texteDecisionIntegre', 'some text')

        expect(res.statusCode).toBe(201)
        expect(res.body).toHaveProperty('id')
        expect(res.body).toHaveProperty('pdfFileName')
        expect(res.body).toHaveProperty('body')
      })

      it('with provided correlation ID', async () => {
        const providedCorrelationId = 'some-id'

        const res = await request(app)
          .put('/v1/decision')
          .set('Authorization', validAuthHeader())
          .set('x-correlation-id', providedCorrelationId)
          .attach('fichierDecisionIntegre', myBufferedFile, { filename: pdfFilename, contentType: 'application/pdf' })
          .field('metadonnees', JSON.stringify(metadata))
          .field('texteDecisionIntegre', 'some text')

        expect(res.statusCode).toBe(201)
        expect(res.headers['x-correlation-id']).toEqual(providedCorrelationId)
      })
    })

    describe('returns 400 Bad Request', () => {
      it('when there is no file attached', async () => {
        const res = await request(app)
          .put('/v1/decision')
          .set('Authorization', validAuthHeader())
          .field('metadonnees', JSON.stringify(metadata))

        expect(res.statusCode).toBe(400)
      })

      it('when file is not a PDF', async () => {
        const res = await request(app)
          .put('/v1/decision')
          .set('Authorization', validAuthHeader())
          .attach('fichierDecisionIntegre', myBufferedFile, { filename: 'doc.xml', contentType: 'application/xml' })
          .field('metadonnees', JSON.stringify(metadata))

        expect(res.statusCode).toBe(400)
      })

      it('when there are no metadata', async () => {
        const res = await request(app)
          .put('/v1/decision')
          .set('Authorization', validAuthHeader())
          .attach('fichierDecisionIntegre', myBufferedFile, { filename: pdfFilename, contentType: 'application/pdf' })

        expect(res.statusCode).toBe(400)
      })

      it('when metadata is invalid JSON', async () => {
        const res = await request(app)
          .put('/v1/decision')
          .set('Authorization', validAuthHeader())
          .attach('fichierDecisionIntegre', myBufferedFile, { filename: pdfFilename, contentType: 'application/pdf' })
          .field('metadonnees', 'not-json')

        expect(res.statusCode).toBe(400)
      })

      it('when metadata fails validation', async () => {
        const invalidMetadata = { idDecision: 'test' }

        const res = await request(app)
          .put('/v1/decision')
          .set('Authorization', validAuthHeader())
          .attach('fichierDecisionIntegre', myBufferedFile, { filename: pdfFilename, contentType: 'application/pdf' })
          .field('metadonnees', JSON.stringify(invalidMetadata))

        expect(res.statusCode).toBe(400)
      })

      it('when file exceeds 30Mo size', async () => {
        const res = await request(app)
          .put('/v1/decision')
          .set('Authorization', validAuthHeader())
          .attach('fichierDecisionIntegre', Buffer.alloc(31457280), { filename: pdfFilename, contentType: 'application/pdf' })
          .field('metadonnees', JSON.stringify(metadata))

        expect(res.statusCode).toBe(400)
      })
    })

    describe('returns 401 Unauthorized', () => {
      it('when no authorization header is provided', async () => {
        const res = await request(app)
          .put('/v1/decision')
          .attach('fichierDecisionIntegre', myBufferedFile, { filename: pdfFilename, contentType: 'application/pdf' })
          .field('metadonnees', JSON.stringify(metadata))

        expect(res.statusCode).toBe(401)
      })
    })

    describe('returns 503', () => {
      it('when S3 is unavailable', async () => {
        mockS3.on(PutObjectCommand).rejects(new Error('Some S3 error'))

        const res = await request(app)
          .put('/v1/decision')
          .set('Authorization', validAuthHeader())
          .attach('fichierDecisionIntegre', myBufferedFile, { filename: pdfFilename, contentType: 'application/pdf' })
          .field('metadonnees', JSON.stringify(metadata))
          .field('texteDecisionIntegre', 'some text')

        expect(res.statusCode).toBe(503)
      })
    })
  })

  describe('DELETE /v1/decision/:decisionId', () => {
    describe('returns 204', () => {
      it('when decisionId is provided', async () => {
        const res = await request(app)
          .delete('/v1/decision/some-decision-id')
          .set('Authorization', validAuthHeader())

        expect(res.statusCode).toBe(204)
      })
    })

    describe('returns 401 Unauthorized', () => {
      it('when no authorization header is provided', async () => {
        const res = await request(app)
          .delete('/v1/decision/some-decision-id')

        expect(res.statusCode).toBe(401)
      })
    })
  })
})
