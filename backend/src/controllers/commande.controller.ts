import type { Request, Response } from 'express'
import {
  schemaCreationCommande,
  schemaListeCommandes,
  schemaModificationCommande
} from '../dto/commande.dto'
import { schemaParamsCodeSuivi, schemaParamsId } from '../dto/common.dto'
import { versReponseCommande } from '../dto/reponses'
import type { DemandeAuthentifiee } from '../middlewares/authentifier'
import { commandeService } from '../services/commande.service'
import { asyncHandler } from '../utils/async-handler'
import { valider } from '../utils/validation'

export const creerCommande = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const donnees = valider(schemaCreationCommande, requete.body)
  const commande = await commandeService.creer(requete.user, donnees)
  reponse.status(201).json({ donnees: versReponseCommande(commande, requete.user.role) })
})

export const listerCommandes = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const filtres = valider(schemaListeCommandes, requete.query)
  const resultat = await commandeService.lister(requete.user, filtres)
  reponse.status(200).json(resultat)
})

export const obtenirCommande = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { id } = valider(schemaParamsId, requete.params)
  const donnees = await commandeService.obtenirParId(requete.user, id)
  reponse.status(200).json({ donnees })
})

export const obtenirCommandeParCodeSuivi = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { code } = valider(schemaParamsCodeSuivi, requete.params)
  const donnees = await commandeService.obtenirParCodeSuivi(requete.user, code)
  reponse.status(200).json({ donnees })
})

export const modifierCommande = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { id } = valider(schemaParamsId, requete.params)
  const donnees = valider(schemaModificationCommande, requete.body)
  const resultat = await commandeService.modifier(requete.user, id, donnees)
  reponse.status(200).json({ donnees: resultat })
})

export const supprimerCommande = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { id } = valider(schemaParamsId, requete.params)
  await commandeService.supprimer(requete.user, id)
  reponse.status(204).send()
})
