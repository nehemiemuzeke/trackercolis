import type { NextFunction, Request, Response } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { env } from '../config/env'
import { logger } from '../config/logger'
import { AppError, ConflitError, IntrouvableError } from '../domain/errors'

interface ErreurAvecStatut {
  status?: number
  statusCode?: number
  message?: string
}

function erreurEnStatut(erreur: unknown): number {
  const candidate = erreur as ErreurAvecStatut
  if (typeof candidate.status === 'number') {
    return candidate.status
  }
  if (typeof candidate.statusCode === 'number') {
    return candidate.statusCode
  }
  return 500
}

export function gestionnaireErreurs(erreur: unknown, requete: Request, reponse: Response, _suivant: NextFunction): void {
  const journal = requete.log ?? logger

  if (erreur instanceof ZodError) {
    journal.warn({ anomalies: erreur.issues }, 'validation_rejetee')
    reponse.status(422).json({
      erreur: {
        code: 'VALIDATION_INVALIDE',
        message: 'Données invalides',
        details: erreur.issues.map((anomalie) => ({
          champ: anomalie.path.join('.') || 'corps',
          message: anomalie.message
        }))
      },
      requestId: requete.id
    })
    return
  }

  if (erreur instanceof Prisma.PrismaClientKnownRequestError) {
    if (erreur.code === 'P2002') {
      reponse.status(409).json({
        erreur: { code: 'CONFLIT', message: 'Une ressource identique existe déjà' },
        requestId: requete.id
      })
      return
    }
    if (erreur.code === 'P2025') {
      const introuvable = new IntrouvableError()
      reponse.status(introuvable.statusCode).json({
        erreur: { code: introuvable.code, message: introuvable.message },
        requestId: requete.id
      })
      return
    }
    journal.error({ err: erreur, code_prisma: erreur.code }, 'erreur_prisma')
    reponse.status(500).json({
      erreur: { code: 'ERREUR_INTERNE', message: 'Erreur interne du serveur' },
      requestId: requete.id
    })
    return
  }

  if (erreur instanceof SyntaxError && erreurEnStatut(erreur) === 400) {
    reponse.status(400).json({
      erreur: { code: 'REQUETE_INVALIDE', message: 'Corps de requête JSON invalide' },
      requestId: requete.id
    })
    return
  }

  if (erreur instanceof AppError) {
    journal[erreur.statusCode >= 500 ? 'error' : 'warn']({ err: erreur, code: erreur.code }, 'erreur_application')
    reponse.status(erreur.statusCode).json({
      erreur: { code: erreur.code, message: erreur.message, details: erreur.details },
      requestId: requete.id
    })
    return
  }

  journal.error({ err: erreur }, 'erreur_non_geree')
  reponse.status(500).json({
    erreur: {
      code: 'ERREUR_INTERNE',
      message: env.NODE_ENV === 'production' ? 'Erreur interne du serveur' : String((erreur as Error)?.message ?? erreur)
    },
    requestId: requete.id
  })
}
