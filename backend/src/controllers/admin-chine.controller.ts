import type { StatutCommande } from '@prisma/client'
import type { Response } from 'express'
import { schemaListeCommandes } from '../dto/commande.dto'
import { schemaParamsId } from '../dto/common.dto'
import { versReponseCommande } from '../dto/reponses'
import type { DemandeAuthentifiee } from '../middlewares/authentifier'
import { commandeService } from '../services/commande.service'
import { serviceWorkflow } from '../services/workflow.service'
import { asyncHandler } from '../utils/async-handler'
import { valider } from '../utils/validation'

function gestionnaireTransition(statutCible: StatutCommande) {
  return asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
    const { id } = valider(schemaParamsId, requete.params)
    const commande = await serviceWorkflow.appliquerTransition(id, statutCible, requete.user)
    reponse.status(200).json({ donnees: versReponseCommande(commande, requete.user.role) })
  })
}

export const listerCommandesChine = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const filtres = valider(schemaListeCommandes, requete.query)
  const resultat = await commandeService.lister(requete.user, filtres)
  reponse.status(200).json(resultat)
})

export const accepterCommande = gestionnaireTransition('ACCEPTEE_CHINE')
export const preparerColis = gestionnaireTransition('COLIS_PREPARE')
export const expedierColis = gestionnaireTransition('EXPEDIE_CHINE')
export const lancerTransit = gestionnaireTransition('EN_TRANSIT')
