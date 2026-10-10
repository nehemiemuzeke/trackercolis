import type { Response } from 'express'
import { schemaListeRecentes } from '../dto/commande.dto'
import type { DemandeAuthentifiee } from '../middlewares/authentifier'
import { serviceTableauDeBord } from '../services/dashboard.service'
import { asyncHandler } from '../utils/async-handler'
import { valider } from '../utils/validation'

export const obtenirStatistiques = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const donnees = await serviceTableauDeBord.obtenirStatistiques(requete.user)
  reponse.status(200).json({ donnees })
})

export const listerCommandesRecentes = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { limit } = valider(schemaListeRecentes, requete.query)
  const donnees = await serviceTableauDeBord.listerRecentes(requete.user, limit)
  reponse.status(200).json({ donnees })
})
