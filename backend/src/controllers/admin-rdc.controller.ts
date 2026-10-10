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

export const listerCommandesRdc = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const filtres = valider(schemaListeCommandes, requete.query)
  const resultat = await commandeService.lister(requete.user, filtres)
  reponse.status(200).json(resultat)
})

export const validerCommande = gestionnaireTransition('COMMANDE_VALIDEE_RDC')
export const transmettreCommande = gestionnaireTransition('TRANSMISE_CHINE')
export const confirmerArriveeRdc = gestionnaireTransition('ARRIVE_RDC')
export const lancerLivraison = gestionnaireTransition('EN_LIVRAISON')
export const confirmerLivraison = gestionnaireTransition('LIVRE')
