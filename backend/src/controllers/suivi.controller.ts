import type { Response } from 'express'
import { schemaParamsCommandeId } from '../dto/common.dto'
import { schemaAjoutEtape } from '../dto/suivi.dto'
import type { DemandeAuthentifiee } from '../middlewares/authentifier'
import { suiviService } from '../services/suivi.service'
import { asyncHandler } from '../utils/async-handler'
import { valider } from '../utils/validation'

export const listerSuivi = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { commandeId } = valider(schemaParamsCommandeId, requete.params)
  const resultat = await suiviService.lister(requete.user, commandeId)
  reponse.status(200).json(resultat)
})

export const ajouterEtape = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { commandeId } = valider(schemaParamsCommandeId, requete.params)
  const donnees = valider(schemaAjoutEtape, requete.body)
  const resultat = await suiviService.ajouterEtape(requete.user, commandeId, donnees)
  reponse.status(201).json({ donnees: resultat })
})
