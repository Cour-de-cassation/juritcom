process.env = {
  DOC_LOGIN: 'login',
  DOC_PASSWORD: 'password',
  S3_URL: 's3-url',
  S3_ACCESS_KEY: 's3-access-key',
  S3_SECRET_KEY: 's3-secret-key',
  S3_REGION: 's3-region',
  S3_BUCKET_NAME_PDF: 'fake-pdf-bucket-name',
  DELETION_COLLECTION_NAME: 'fake-deletion-collection-name',
  FILE_DB_URL: 'mongodb://localhost:27017/test',
  USE_AUTH: 'basic',
  JWT_SECRET: 'jest-secret',
  JWT_ISSUER: 'jest-issuer',
  JWT_ACCEPTED_ISSUERS: 'jest-issuer,jest-issuer-other',
  JWT_ALGORITHM: 'HS256',
  JWT_EXPIRATION_SECONDS: '900',
  JWT_CLIENT_ID: 'jest-client-id',
  JWT_CLIENT_SECRET: 'jest-client-secret'
}
