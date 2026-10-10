import type { NextFunction, Request, Response } from 'express'

export function asyncHandler<P extends Request = Request>(
  gestionnaire: (requete: P, reponse: Response, suivant: NextFunction) => Promise<unknown>
) {
  return (requete: Request, reponse: Response, suivant: NextFunction): void => {
    gestionnaire(requete as unknown as P, reponse, suivant).catch(suivant)
  }
}
