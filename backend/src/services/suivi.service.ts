import type { UtilisateurAuthentifie } from '../domain/types'
import { versReponseCommande, versReponseSuivi } from '../dto/reponses'
import type { DonneesAjoutEtape } from '../dto/suivi.dto'
import { depotSuivis } from '../repositories/suivi.repository'
import { commandeService, type ServiceCommandes } from './commande.service'
import { serviceWorkflow, type ServiceWorkflow } from './workflow.service'

export interface DependancesServiceSuivi {
  depotSuivis: typeof depotSuivis
  serviceCommandes: ServiceCommandes
  serviceWorkflow: ServiceWorkflow
}

export function creerServiceSuivi(dependances: DependancesServiceSuivi = {
  depotSuivis,
  serviceCommandes: commandeService,
  serviceWorkflow: serviceWorkflow
}) {
  async function lister(utilisateur: UtilisateurAuthentifie, commandeId: string) {
    const commande = await dependances.serviceCommandes.verifierAcces(utilisateur, commandeId)
    const lignes = await dependances.depotSuivis.listerParCommande(commandeId)
    return {
      commande: versReponseCommande(commande, utilisateur.role),
      donnees: lignes.map(versReponseSuivi)
    }
  }

  async function ajouterEtape(utilisateur: UtilisateurAuthentifie, commandeId: string, donnees: DonneesAjoutEtape) {
    await dependances.serviceCommandes.verifierAcces(utilisateur, commandeId)
    const commande = await dependances.serviceWorkflow.appliquerTransition(commandeId, donnees.statut, utilisateur, {
      photo_preuve: donnees.photo_preuve,
      signature_url: donnees.signature_url
    })
    return versReponseCommande(commande, utilisateur.role)
  }

  return { lister, ajouterEtape }
}

export const suiviService = creerServiceSuivi()
