import type { Prisma, Role, StatutCommande, TypeNotification } from '@prisma/client'
import { logger } from '../config/logger'
import { AccesRefuseError, ConflitError, IntrouvableError, RequeteInvalideError } from '../domain/errors'
import type { UtilisateurAuthentifie } from '../domain/types'
import { versReponseCommande, versReponseSuivi } from '../dto/reponses'
import {
  ACTION_PAR_CIBLE,
  etapeParStatut,
  transitionVers
} from '../domain/workflow'
import { EVENEMENTS_SERVEUR } from '../realtime/evenements'
import { emettreASalleCommande } from '../realtime/io'
import { depotCommandes } from '../repositories/commande.repository'
import type { CommandeAvecClient } from '../domain/types'
import { depotSuivis } from '../repositories/suivi.repository'
import { depotUtilisateurs } from '../repositories/user.repository'
import { prisma } from '../config/prisma'
import { notificationService, type ServiceNotifications } from './notification.service'

export interface OptionsTransition {
  photo_preuve?: string
  signature_url?: string
}

interface ContenuNotificationEtape {
  titre: string
  message: string
}

const CONTENUS_CLIENT: Record<StatutCommande, ContenuNotificationEtape> = {
  COMMANDE_CREEE: { titre: 'Commande créée', message: 'Votre commande {numero} a été enregistrée avec succès.' },
  COMMANDE_VALIDEE_RDC: { titre: 'Commande validée', message: 'Votre commande {numero} a été validée par l\'équipe RDC.' },
  TRANSMISE_CHINE: { titre: 'Commande transmise en Chine', message: 'Votre commande {numero} a été transmise à l\'équipe Chine.' },
  ACCEPTEE_CHINE: { titre: 'Commande acceptée en Chine', message: 'Votre commande {numero} a été acceptée par l\'équipe de Guangzhou.' },
  COLIS_PREPARE: { titre: 'Colis préparé', message: 'Votre colis {numero} a été préparé dans l\'entrepôt de Guangzhou.' },
  EXPEDIE_CHINE: { titre: 'Colis expédié de Chine', message: 'Votre colis {numero} a été remis à l\'aéroport Baiyun.' },
  EN_TRANSIT: { titre: 'Colis en transit', message: 'Votre colis {numero} est en vol international vers Kinshasa.' },
  ARRIVE_RDC: { titre: 'Colis arrivé en RDC', message: 'Votre colis {numero} est arrivé à l\'aéroport de N\'djili.' },
  EN_LIVRAISON: { titre: 'Colis en livraison', message: 'Votre colis {numero} est en cours de livraison à Kinshasa.' },
  LIVRE: { titre: 'Colis livré', message: 'Votre colis {numero} a été livré. Merci de votre confiance.' }
}

interface ContenuNotificationAdministrateurs {
  role: Role
  type: TypeNotification
  titre: string
  message: string
}

const CONTENUS_ADMINISTRATEURS: Partial<Record<StatutCommande, ContenuNotificationAdministrateurs>> = {
  TRANSMISE_CHINE: {
    role: 'ADMIN_CHINE',
    type: 'NOUVELLE_COMMANDE',
    titre: 'Nouvelle commande transmise',
    message: 'La commande {numero} attend votre prise en charge à Guangzhou.'
  },
  ACCEPTEE_CHINE: {
    role: 'ADMIN_RDC',
    type: 'STATUT_CHANGE',
    titre: 'Commande acceptée en Chine',
    message: 'La commande {numero} a été acceptée par l\'équipe Chine.'
  },
  EN_TRANSIT: {
    role: 'ADMIN_RDC',
    type: 'STATUT_CHANGE',
    titre: 'Colis en transit vers la RDC',
    message: 'La commande {numero} est en vol vers Kinshasa. Préparez la réception.'
  }
}

export interface DependancesServiceWorkflow {
  depotCommandes: typeof depotCommandes
  depotSuivis: typeof depotSuivis
  depotUtilisateurs: typeof depotUtilisateurs
  serviceNotifications: ServiceNotifications
}

export function creerServiceWorkflow(dependances: DependancesServiceWorkflow = {
  depotCommandes,
  depotSuivis,
  depotUtilisateurs,
  serviceNotifications: notificationService
}) {
  async function appliquerTransition(
    commandeId: string,
    statutCible: StatutCommande,
    acteur: UtilisateurAuthentifie,
    options: OptionsTransition = {}
  ): Promise<CommandeAvecClient> {
    const transition = transitionVers(statutCible)
    if (!transition) {
      throw new RequeteInvalideError(`Statut cible non supporté pour une transition manuelle : ${statutCible}`)
    }
    if (!transition.roles_autorises.includes(acteur.role)) {
      throw new AccesRefuseError('Votre rôle ne permet pas d\'effectuer cette action')
    }
    const commande = await dependances.depotCommandes.trouverParId(commandeId)
    if (!commande) {
      throw new IntrouvableError('Commande introuvable')
    }
    if (commande.statut_actuel !== transition.statut_source) {
      throw new ConflitError(
        `Action impossible : la commande est actuellement au statut ${commande.statut_actuel}`
      )
    }
    const etape = etapeParStatut(statutCible)

    const { commandeMiseAJour, suiviCree } = await prisma.$transaction(async (client) => {
      const donnees: Prisma.CommandeUncheckedUpdateInput = {
        statut_actuel: statutCible,
        etape_actuelle: etape.numero
      }
      if (acteur.role === 'ADMIN_RDC' && etape.type_acteur === 'ADMIN_RDC') {
        donnees.admin_rdc_id = acteur.id
      }
      if (acteur.role === 'ADMIN_CHINE' && etape.type_acteur === 'ADMIN_CHINE') {
        donnees.admin_chine_id = acteur.id
      }
      if (statutCible === 'COMMANDE_VALIDEE_RDC') {
        donnees.statut_paiement = 'PAYE'
      }
      if (statutCible === 'LIVRE') {
        donnees.date_livraison_reelle = new Date()
      }
      const suivi = await dependances.depotSuivis.creer(
        {
          commande_id: commandeId,
          numero_etape: etape.numero,
          statut: statutCible,
          label: etape.label,
          description: etape.description,
          lieu: etape.lieu,
          latitude: etape.latitude,
          longitude: etape.longitude,
          type_acteur: etape.type_acteur,
          declenche_par: acteur.id,
          photo_preuve: options.photo_preuve ?? null,
          signature_url: options.signature_url ?? null
        },
        client
      )
      const maj = await dependances.depotCommandes.mettreAJour(commandeId, donnees, client)
      return { commandeMiseAJour: maj, suiviCree: suivi }
    })

    logger.info(
      {
        evenement: 'audit_action_admin',
        acteur_id: acteur.id,
        role_acteur: acteur.role,
        commande_id: commandeId,
        action: ACTION_PAR_CIBLE[statutCible] ?? statutCible,
        statut_precedent: transition.statut_source,
        statut_cible: statutCible
      },
      'transition_commande'
    )

    emettreASalleCommande(commandeId, EVENEMENTS_SERVEUR.COMMANDE_MISE_A_JOUR, versReponseCommande(commandeMiseAJour, acteur.role))
    emettreASalleCommande(commandeId, EVENEMENTS_SERVEUR.SUIVI_MIS_A_JOUR, {
      commande_id: commandeId,
      suivi: versReponseSuivi(suiviCree)
    })

    const contenuClient = CONTENUS_CLIENT[statutCible]
    await dependances.serviceNotifications.envoyer({
      user_id: commandeMiseAJour.client_id,
      commande_id: commandeId,
      titre: contenuClient.titre,
      message: contenuClient.message.replace('{numero}', commandeMiseAJour.numero_commande),
      type: 'STATUT_CHANGE'
    })

    const contenuAdministrateurs = CONTENUS_ADMINISTRATEURS[statutCible]
    if (contenuAdministrateurs) {
      const administrateurs = await dependances.depotUtilisateurs.listerActifsParRole(contenuAdministrateurs.role)
      await dependances.serviceNotifications.envoyerPlusieurs(
        administrateurs.map((administrateur) => ({
          user_id: administrateur.id,
          commande_id: commandeId,
          titre: contenuAdministrateurs.titre,
          message: contenuAdministrateurs.message.replace('{numero}', commandeMiseAJour.numero_commande),
          type: contenuAdministrateurs.type
        }))
      )
    }

    return commandeMiseAJour
  }

  return { appliquerTransition }
}

export const serviceWorkflow = creerServiceWorkflow()
export type ServiceWorkflow = ReturnType<typeof creerServiceWorkflow>
