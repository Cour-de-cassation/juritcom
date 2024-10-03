import { ExecutionContext, HttpStatus, INestApplication } from '@nestjs/common'
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Test, TestingModule } from '@nestjs/testing'
import { AppModule } from '../../../app.module'
import { RequestLoggerInterceptor } from '../../interceptors/request-logger.interceptor'
import { isPdfFile } from './decision.controller'
import * as request from 'supertest'
import { MetadonneeDto } from '../../../../shared/infrastructure/dto/metadonnee.dto'
import { MockUtils } from '../../../../shared/infrastructure/utils/mock.utils'
import { UnexpectedException } from '../../../../shared/infrastructure/exceptions/unexpected.exception'
import { OauthService } from '../../../../shared/infrastructure/security/oauth/oauth.service'
import { JwtAuthGuard } from '../../../../shared/infrastructure/security/auth/auth.guard'

describe('Decision Controller', () => {
  let app: INestApplication
  const mockS3: AwsClientStub<S3Client> = mockClient(S3Client)
  const oauthService = new OauthService();

  let token = ''
  const testFile = Buffer.from('test file')
  const pdfFilename = 'filename.pdf'
  const metadonnee = new MockUtils().metadonneeDtoMock as MetadonneeDto

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .compile()

    // Disable logs for Integration tests
    app = moduleFixture.createNestApplication({ logger: false })
    app.useGlobalInterceptors(new RequestLoggerInterceptor())

    await app.init();

    jest.spyOn(oauthService, 'getToken').mockReturnValue(Promise.resolve('token'));
    token = await oauthService.getToken();
  })

  beforeEach(() => {
    mockS3.reset()
    mockS3.on(PutObjectCommand).resolves({})
  })

  describe('Is PDF file type', () => {
    it('should return false when mimetype is not application/pdf,', () => {
      expect(isPdfFile('application/vnd.wordperfect')).toBeFalsy()
    })
    it('should return true when mimetype is application/pdf,', () => {
      expect(isPdfFile('application/pdf')).toBeTruthy()
    })
  })

  describe('PUT /decision', () => {
    describe('return 201', () => {
      it('Metadonnées correctes et fichier pdf correct/présent', async () => {
        const res = await request(app.getHttpServer())
          .put('/decision')
          .set('Authorization', `Bearer ${token}`)
          .attach('fichierDecisionIntegre', testFile, pdfFilename)
          .field('texteDecisionIntegre', 'texte décision intègre')
          .field('metadonnees', JSON.stringify(metadonnee))

        expect(res.statusCode).toEqual(HttpStatus.CREATED)
        expect(res.body).toBeDefined()
        expect(res.body['body']).toEqual('la décision a bien été prise en compte')
        const returnedJsonFileName = res.body['jsonFileName']
        expect(returnedJsonFileName).toContain('.json')
        const returnedPdfFileName = res.body['pdfFileName']
        expect(returnedPdfFileName).toContain('filename.pdf')
        // le nom du fichier pdf contient le même UUID du fichier json des metadonnées sur S3.
        expect(returnedPdfFileName).toContain(returnedJsonFileName.split('.')[0])
      })
    })
    describe('return 400', () => {
      it('Pas de fichier', async () => {
        const res = await request(app.getHttpServer())
          .put('/decision')
          .set('Authorization', `Bearer ${token}`)
          .send({ metadonnees: metadonnee })

        expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
      })

      it('Mauvais format du fichier', async () => {
        const res = await request(app.getHttpServer())
          .put('/decision')
          .set('Authorization', `Bearer ${token}`)
          .attach('fichierDecisionIntegre', testFile, {
            filename: 'filename.txt',
            contentType: 'application/txt'
          })
          .field('metadonnees', JSON.stringify(metadonnee))

        expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
      })

      it('Pas de metadonnées', async () => {
        const res = await request(app.getHttpServer())
          .put('/decision')
          .set('Authorization', `Bearer ${token}`)
          .attach('fichierDecisionIntegre', testFile, {
            filename: pdfFilename,
            contentType: 'application/pdf'
          })
        expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
      })
    })
    describe('return 503', () => {
      it('S3 undisponible', async () => {
        mockS3.on(PutObjectCommand).rejects(new Error('Erreurs S3'))
        const res = await request(app.getHttpServer())
          .put('/decision')
          .set('Authorization', `Bearer ${token}`)
          .attach('fichierDecisionIntegre', testFile, pdfFilename)
          .field('texteDecisionIntegre', 'texteDecisionIntegre')
          .field('metadonnees', JSON.stringify(metadonnee))

        expect(res.statusCode).toEqual(HttpStatus.SERVICE_UNAVAILABLE)
      })
    })

    describe('return 500', () => {
      it('S3 unexpected error', async () => {
        mockS3.on(PutObjectCommand).rejects(new UnexpectedException('Erreurs S3'))
        const res = await request(app.getHttpServer())
          .put('/decision')
          .set('Authorization', `Bearer ${token}`)
          .attach('fichierDecisionIntegre', testFile, pdfFilename)
          .field('texteDecisionIntegre', 'texteDecisionIntegre')
          .field('metadonnees', JSON.stringify(metadonnee))

        expect(res.statusCode).toEqual(HttpStatus.SERVICE_UNAVAILABLE)
      })
    })

    describe('return 403', () => {
      it('403 when wrong no credentials are sent', async () => {
        (jest.spyOn(mockAuthGuard, 'canActivate')).mockReturnValue(false);
        const res = await request(app.getHttpServer())
          .put('/decision')
          .attach('fichierDecisionIntegre', testFile, pdfFilename)
          .field('texteDecisionIntegre', 'texteDecisionIntegre')
          .field('metadonnees', JSON.stringify(metadonnee))

        expect(res.statusCode).toEqual(403)
      })
    })
  })

  afterAll(async () => {
    await app.close()
  })

})


