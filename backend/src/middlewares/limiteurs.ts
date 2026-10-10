import rateLimit from 'express-rate-limit'
import { env } from '../config/env'
import { LimiteAtteinteError } from '../domain/errors'

function construireLimiteur(options: { windowMs: number; limit: number; cle: 'ip' | 'utilisateur' }) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (requete) =>
      options.cle === 'utilisateur'
        ? requete.user?.id ?? requete.ip ?? 'adresse-inconnue'
        : requete.ip ?? 'adresse-inconnue',
    handler: (_requete, _reponse, suivant) => {
      suivant(new LimiteAtteinteError())
    }
  })
}

export const limiteurGlobal = construireLimiteur({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  cle: 'ip'
})

export const limiteurAuth = construireLimiteur({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  cle: 'ip'
})

export const limiteurUtilisateur = construireLimiteur({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.USER_RATE_LIMIT_MAX,
  cle: 'utilisateur'
})
