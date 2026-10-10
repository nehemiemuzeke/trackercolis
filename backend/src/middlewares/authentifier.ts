import type { NextFunction, Request, Response } from 'express'
import type { UtilisateurAuthentifie } from '../domain/types'
import { NonAuthentifieError } from '../domain/errors'
import { prisma } from '../config/prisma'
import { verifierJetonAcces } from '../utils/jetons'

export interface DemandeAuthentifiee extends Request {
  user: UtilisateurAuthentifie
}

export async function authentifier(requete: Request, _reponse: Response, suivant: NextFunction): Promise<void> {
  try {
    const entete = requete.headers.authorization
    if (!entete || !entete.startsWith('Bearer ')) {
      throw new NonAuthentifieError("Jeton d'authentification manquant")
    }
    const chargeUtile = verifierJetonAcces(entete.slice('Bearer '.length))
    const utilisateur = await prisma.user.findUnique({ where: { id: chargeUtile.sub } })
    if (!utilisateur || !utilisateur.est_actif) {
      throw new NonAuthentifieError('Utilisateur introuvable ou désactivé')
    }
    requete.user = {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role
    }
    suivant()
  } catch (erreur) {
    suivant(erreur)
  }
}
