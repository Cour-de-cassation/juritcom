export class BadFileFormat extends Error {
  type = 'badFileFormat' as const
  constructor(message?: string) {
    super(message ?? 'Le fichier doit être au format PDF (.pdf)')
  }
}

export class BadFileSize extends Error {
  type = 'badFileSize' as const
  maxSize: string
  constructor(maxSize: string) {
    super(`La taille du fichier dépasse la taille maximale autorisée de ${maxSize}`)
    this.maxSize = maxSize
  }
}

export class ValidationError extends Error {
  type = 'validationError' as const
  details: unknown
  constructor(message: string, details?: unknown) {
    super(message)
    this.details = details
  }
}

export class InfrastructureError extends Error {
  type = 'infrastructureError' as const
  constructor() {
    super("Une erreur inattendue liée à une dépendance de l'API a été rencontrée.")
  }
}

export class UnexpectedError extends Error {
  type = 'unexpectedError' as const
  constructor() {
    super('Une erreur inattendue a été rencontrée.')
  }
}

type CustomError =
  | BadFileFormat
  | BadFileSize
  | ValidationError
  | InfrastructureError
  | UnexpectedError

export function isCustomError(x: unknown): x is CustomError {
  const isValidX = !!x && x instanceof Error && 'type' in x
  if (!isValidX) return false

  switch ((x as CustomError).type) {
    case 'badFileFormat':
    case 'badFileSize':
    case 'validationError':
    case 'infrastructureError':
    case 'unexpectedError':
      return true
    default:
      return false
  }
}
