import type { Request, Response } from 'express'

export function routeIntrouvable(requete: Request, reponse: Response): void {
  reponse.status(404).json({
    erreur: {
      code: 'ROUTE_INTROUVABLE',
      message: `Aucune route ne correspond à ${requete.method} ${requete.originalUrl}`
    },
    requestId: requete.id
  })
}
