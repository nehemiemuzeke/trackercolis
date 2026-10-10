export class AppError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly details?: Array<{ champ: string; message: string }>

  constructor(statusCode: number, code: string, message: string, details?: Array<{ champ: string; message: string }>) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class RequeteInvalideError extends AppError {
  constructor(message = 'Requête invalide', details?: Array<{ champ: string; message: string }>) {
    super(400, 'REQUETE_INVALIDE', message, details)
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Données invalides', details?: Array<{ champ: string; message: string }>) {
    super(422, 'VALIDATION_INVALIDE', message, details)
  }
}

export class NonAuthentifieError extends AppError {
  constructor(message = 'Authentification requise') {
    super(401, 'NON_AUTHENTIFIE', message)
  }
}

export class AccesRefuseError extends AppError {
  constructor(message = 'Accès refusé') {
    super(403, 'ACCES_REFUSE', message)
  }
}

export class IntrouvableError extends AppError {
  constructor(ressource = 'Ressource introuvable') {
    super(404, 'RESSOURCE_INTROUVABLE', ressource)
  }
}

export class ConflitError extends AppError {
  constructor(message = 'Conflit sur la ressource') {
    super(409, 'CONFLIT', message)
  }
}

export class LimiteAtteinteError extends AppError {
  constructor(message = 'Trop de requêtes, veuillez réessayer plus tard') {
    super(429, 'LIMITE_ATTEINTE', message)
  }
}
