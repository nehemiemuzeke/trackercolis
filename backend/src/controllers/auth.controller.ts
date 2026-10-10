import type { Request, Response } from 'express'
import { schemaConnexion, schemaInscription, schemaRafraichissement, schemaTokenFcm } from '../dto/auth.dto'
import type { DemandeAuthentifiee } from '../middlewares/authentifier'
import { authService } from '../services/auth.service'
import { asyncHandler } from '../utils/async-handler'
import { valider } from '../utils/validation'

export const inscrire = asyncHandler(async (requete: Request, reponse: Response) => {
  const donnees = valider(schemaInscription, requete.body)
  const resultat = await authService.inscrire(donnees)
  reponse.status(201).json(resultat)
})

export const connecter = asyncHandler(async (requete: Request, reponse: Response) => {
  const donnees = valider(schemaConnexion, requete.body)
  const resultat = await authService.connecter(donnees)
  reponse.status(200).json(resultat)
})

export const rafraichir = asyncHandler(async (requete: Request, reponse: Response) => {
  const donnees = valider(schemaRafraichissement, requete.body)
  const resultat = await authService.rafraichir(donnees.jeton_rafraichissement)
  reponse.status(200).json(resultat)
})

export const obtenirProfil = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const donnees = await authService.obtenirProfil(requete.user.id)
  reponse.status(200).json({ donnees })
})

export const mettreAJourTokenFcm = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const donnees = valider(schemaTokenFcm, requete.body)
  await authService.mettreAJourTokenFcm(requete.user.id, donnees.fcm_token)
  reponse.status(204).send()
})
