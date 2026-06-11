import { Router } from 'express'
import { checkBucketHealth } from '../connectors/s3'
import { checkDbHealth } from '../connectors/mongodb'

const router = Router()

router.get('/v1/health', async (_req, res) => {
  const [bucketOk, dbOk] = await Promise.all([checkBucketHealth(), checkDbHealth()])

  const allOk = bucketOk && dbOk

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'error',
    details: {
      bucket: { status: bucketOk ? 'up' : 'down' },
      database: { status: dbOk ? 'up' : 'down' }
    }
  })
})

export default router
