import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import { loggerHttp, logger } from './config/logger'
import { PORT } from './config/env'
import decisionsRouter from './api/decisions'
import healthRouter from './api/health'
import tokenRouter from './api/token'
import { errorHandler } from './api/error'

const app = express()

app
  .use(helmet())
  .use(loggerHttp)
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use(decisionsRouter)
  .use(healthRouter)
  .use(tokenRouter)
  .use(errorHandler)

app.listen(Number(PORT), () => {
  logger.info({
    path: 'src/server.ts',
    operations: ['other', 'startServer'],
    message: `JuriTCOM running on port ${PORT}`
  })
})

export { app }
