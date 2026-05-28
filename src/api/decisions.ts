import { Router } from 'express'
import multer from 'multer'
import { parseMetadonnees } from '../services/decisions/models'
import { saveDecision, deleteDecision } from '../services/decisions/handler'
import {
  InfrastructureError,
  UnexpectedError,
  BadFileFormat,
  BadFileSize,
  ValidationError
} from '../services/error'
import { authMiddleware } from './auth'

const FILE_MAX_SIZE = {
  size: 31457280,
  readSize: '30Mo'
} as const

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_MAX_SIZE.size,
    fieldSize: 10 * 1024 * 1024
  }
})

export interface DecisionResponse {
  id: string | void
  pdfFileName: string | void
  body: string
}

export interface DeleteDecisionResponse {
  decisionId: string | void
  id: string | void
}

function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

const router = Router()

router.put(
  '/v1/decision',
  authMiddleware,
  upload.single('fichierDecisionIntegre'),
  async (req, res, next) => {
    try {
      const fichierDecisionIntegre = req.file

      if (!fichierDecisionIntegre || !isPdfFile(fichierDecisionIntegre.mimetype)) {
        throw new BadFileFormat('Le fichier doit être au format PDF (.pdf)')
      }

      if (fichierDecisionIntegre.size >= FILE_MAX_SIZE.size) {
        throw new BadFileSize(FILE_MAX_SIZE.readSize)
      }

      const metadonneesRaw = req.body?.metadonnees
      if (!metadonneesRaw) {
        throw new BadFileFormat('Les métadonnées sont requises')
      }

      let metadonneesJson: unknown
      try {
        metadonneesJson =
          typeof metadonneesRaw === 'string' ? JSON.parse(metadonneesRaw) : metadonneesRaw
      } catch {
        throw new ValidationError('Les métadonnées doivent être un JSON valide')
      }

      const metadonnees = parseMetadonnees(metadonneesJson)

      const routePath = req.method + ' ' + req.path
      const formatLogs = {
        path: 'src/api/decisions.ts',
        operations: ['collect', 'putDecision'] as const,
        message: JSON.stringify({
          httpMethod: req.method,
          path: req.path,
          msg: `Starting ${routePath}...`,
          correlationId: req.headers['x-correlation-id']
        })
      }
      req.log?.info(formatLogs)

      const { fileName, rawfileId } = await saveDecision(fichierDecisionIntegre, metadonnees).catch(
        (error) => {
          if (error instanceof InfrastructureError) {
            req.log?.error({
              ...formatLogs,
              message: JSON.stringify({ msg: error.message, statusCode: 503 }),
              stack: error.stack
            })
            throw error
          }
          req.log?.error({
            ...formatLogs,
            message: JSON.stringify({ msg: error.message, statusCode: 500 }),
            stack: error.stack
          })
          throw new UnexpectedError(error.message)
        }
      )

      const metadonneesForLog = { ...metadonnees } as Record<string, unknown>
      delete metadonneesForLog['parties']
      delete metadonneesForLog['composition']

      req.log?.info({
        ...formatLogs,
        message: JSON.stringify({
          msg: routePath + ' returns 201',
          data: { decision: metadonneesForLog },
          statusCode: 201
        })
      })

      res.status(201).json({
        id: rawfileId,
        pdfFileName: fileName,
        body: `la décision a bien été prise en compte`
      } satisfies DecisionResponse)
    } catch (err) {
      next(err)
    }
  }
)

router.delete('/v1/decision/:decisionId', authMiddleware, async (req, res, next) => {
  try {
    const { decisionId } = req.params
    const routePath = req.method + ' ' + req.path
    const formatLogs = {
      path: 'src/api/decisions.ts',
      operations: ['other', 'deleteDecision'] as const,
      message: JSON.stringify({
        httpMethod: req.method,
        path: req.path,
        msg: `Starting ${routePath}...`,
        correlationId: req.headers['x-correlation-id']
      })
    }
    req.log?.info(formatLogs)

    const { rawfileId } = await deleteDecision(decisionId).catch((error) => {
      if (error instanceof InfrastructureError) {
        req.log?.error({
          ...formatLogs,
          message: JSON.stringify({ msg: error.message, statusCode: 503 }),
          stack: error.stack
        })
        throw error
      }
      req.log?.error({
        ...formatLogs,
        message: JSON.stringify({ msg: error.message, statusCode: 500 }),
        stack: error.stack
      })
      throw new UnexpectedError(error.message)
    })

    req.log?.info({
      ...formatLogs,
      message: JSON.stringify({
        msg: routePath + ' returns 204',
        data: { decisionId, rawfileId },
        statusCode: 204
      })
    })

    res.status(204).json({
      decisionId,
      id: rawfileId
    } satisfies DeleteDecisionResponse)
  } catch (err) {
    next(err)
  }
})

export default router
