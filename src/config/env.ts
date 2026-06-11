import { z } from 'zod'

const EnvSchema = z.object({
  PORT: z.string().default('3000'),
  ENV: z.string().optional(),
  DOC_LOGIN: z.string().min(1),
  DOC_PASSWORD: z.string().min(1),
  USE_AUTH: z.enum(['basic', 'jwt']),
  S3_URL: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_REGION: z.string().min(1),
  S3_BUCKET_NAME_PDF: z.string().min(1),
  DELETION_COLLECTION_NAME: z.string().min(1),
  FILE_DB_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_ISSUER: z.string().min(1),
  JWT_ALGORITHM: z.string().min(1),
  JWT_EXPIRATION_SECONDS: z.string().default('900'),
  JWT_ACCEPTED_ISSUERS: z.string().optional(),
  JWT_CLIENT_ID: z.string().min(1),
  JWT_CLIENT_SECRET: z.string().min(1)
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  const missing = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
  throw new Error(`Missing or invalid environment variables: ${missing}`)
}

export const {
  PORT,
  ENV,
  DOC_LOGIN,
  DOC_PASSWORD,
  USE_AUTH,
  S3_URL,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_REGION,
  S3_BUCKET_NAME_PDF,
  DELETION_COLLECTION_NAME,
  FILE_DB_URL,
  JWT_SECRET,
  JWT_ISSUER,
  JWT_ALGORITHM,
  JWT_EXPIRATION_SECONDS,
  JWT_ACCEPTED_ISSUERS,
  JWT_CLIENT_ID,
  JWT_CLIENT_SECRET
} = parsed.data
