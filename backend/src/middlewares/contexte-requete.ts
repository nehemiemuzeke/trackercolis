import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { logger } from '../config/logger'

export function contexteRequete(requete: Request, reponse: Response, suivant: NextFunction): void {
  requete.id = randomUUID()
  requete.log = logger.child({ requestId: requete.id })
  reponse.setHeader('X-Request-Id', requete.id)
  suivant()
}

export function journalAcces(requete: Request, reponse: Response, suivant: NextFunction): void {
  const debut = Date.now()
  reponse.on('finish', () => {
    requete.log?.info(
      {
        http: {
          methode: requete.method,
          chemin: requete.originalUrl,
          statut: reponse.statusCode,
          duree_ms: Date.now() - debut
        }
      },
      'requete_http'
    )
  })
  suivant()
}
