import type { NextFunction, Request, Response } from 'express'
import type { Role } from '@prisma/client'
import { AccesRefuseError, NonAuthentifieError } from '../domain/errors'

export function protegerRoles(...roles: Role[]) {
  return (requete: Request, _reponse: Response, suivant: NextFunction): void => {
    if (!requete.user) {
      suivant(new NonAuthentifieError())
      return
    }
    if (!roles.includes(requete.user.role)) {
      suivant(new AccesRefuseError('Votre rôle ne permet pas cette action'))
      return
    }
    suivant()
  }
}
