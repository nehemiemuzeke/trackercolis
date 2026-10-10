import type pino from 'pino'
import type { UtilisateurAuthentifie } from '../domain/types'

declare module 'express-serve-static-core' {
  interface Request {
    id?: string
    log?: pino.Logger
    user?: UtilisateurAuthentifie
  }
}
