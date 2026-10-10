import { env } from '../config/env'
import { logger } from '../config/logger'
import { versReponseSuivi } from '../dto/reponses'
import { POINTS_TRANSIT } from '../domain/geo'
import { EVENEMENTS_SERVEUR } from '../realtime/evenements'
import { emettreASalleCommande } from '../realtime/io'
import { depotCommandes } from '../repositories/commande.repository'
import type { CommandeAvecClient } from '../domain/types'
import { depotSuivis } from '../repositories/suivi.repository'
import { depotUtilisateurs } from '../repositories/user.repository'
import { notificationService, type ChargeNotification, type ServiceNotifications } from './notification.service'

export interface DependancesServiceSimulation {
  depotCommandes: typeof depotCommandes
  depotSuivis: typeof depotSuivis
  depotUtilisateurs: typeof depotUtilisateurs
  serviceNotifications: ServiceNotifications
}

export function creerServiceSimulation(dependances: DependancesServiceSimulation = {
  depotCommandes,
  depotSuivis,
  depotUtilisateurs,
  serviceNotifications: notificationService
}) {
  let minuteur: ReturnType<typeof setInterval> | null = null

  async function avancerColisEnTransit(commande: CommandeAvecClient): Promise<void> {
    const dernierPoint = await dependances.depotSuivis.dernierParCommandeEtEtape(commande.id, 7)
    if (!dernierPoint || dernierPoint.latitude === null || dernierPoint.longitude === null) {
      return
    }
    const indexActuel = POINTS_TRANSIT.findIndex(
      (point) => point.latitude === dernierPoint.latitude && point.longitude === dernierPoint.longitude
    )
    if (indexActuel === -1 || indexActuel >= POINTS_TRANSIT.length - 1) {
      return
    }
    const pointSuivant = POINTS_TRANSIT[indexActuel + 1]
    const suivi = await dependances.depotSuivis.creer({
      commande_id: commande.id,
      numero_etape: 7,
      statut: 'EN_TRANSIT',
      label: 'En transit international',
      description: 'Position du colis mise à jour pendant le vol',
      lieu: pointSuivant.label,
      latitude: pointSuivant.latitude,
      longitude: pointSuivant.longitude,
      type_acteur: 'SYSTEME'
    })
    emettreASalleCommande(commande.id, EVENEMENTS_SERVEUR.SUIVI_MIS_A_JOUR, {
      commande_id: commande.id,
      suivi: versReponseSuivi(suivi)
    })
    logger.debug({ commande_id: commande.id, lieu: pointSuivant.label }, 'position_transit_mise_a_jour')

    if (indexActuel + 1 === POINTS_TRANSIT.length - 1) {
      const administrateursRdc = await dependances.depotUtilisateurs.listerActifsParRole('ADMIN_RDC')
      const alertes: ChargeNotification[] = [
        {
          user_id: commande.client_id,
          commande_id: commande.id,
          titre: 'Colis en approche de Kinshasa',
          message: `Votre colis ${commande.numero_commande} approche du territoire congolais.`,
          type: 'ALERTE'
        }
      ]
      for (const administrateur of administrateursRdc) {
        alertes.push({
          user_id: administrateur.id,
          commande_id: commande.id,
          titre: 'Colis en approche de la RDC',
          message: `La commande ${commande.numero_commande} approche de Kinshasa. Préparez la confirmation d'arrivée.`,
          type: 'ALERTE'
        })
      }
      await dependances.serviceNotifications.envoyerPlusieurs(alertes)
    }
  }

  async function executerCycle(): Promise<void> {
    const commandes = await dependances.depotCommandes.listerParStatut('EN_TRANSIT')
    for (const commande of commandes) {
      await avancerColisEnTransit(commande)
    }
  }

  function demarrer(): void {
    if (!env.SIMULATION_ENABLED) {
      logger.info('simulation_desactivee')
      return
    }
    if (minuteur) {
      return
    }
    minuteur = setInterval(() => {
      void executerCycle().catch((erreur: unknown) => {
        logger.error({ err: erreur }, 'erreur_cycle_simulation')
      })
    }, env.SIMULATION_INTERVAL_MS)
    logger.info({ intervalle_ms: env.SIMULATION_INTERVAL_MS }, 'simulation_demarree')
  }

  function arreter(): void {
    if (minuteur) {
      clearInterval(minuteur)
      minuteur = null
      logger.info('simulation_arretee')
    }
  }

  return { demarrer, arreter, executerCycle }
}

export const serviceSimulation = creerServiceSimulation()
