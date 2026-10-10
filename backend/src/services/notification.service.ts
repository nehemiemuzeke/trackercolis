import type { TypeNotification } from '@prisma/client'
import { IntrouvableError } from '../domain/errors'
import { depotNotifications } from '../repositories/notification.repository'
import { depotUtilisateurs } from '../repositories/user.repository'
import { versReponseNotification } from '../dto/reponses'
import { EVENEMENTS_SERVEUR } from '../realtime/evenements'
import { emettreAUtilisateur } from '../realtime/io'
import { envoyerNotificationPush } from './fcm.service'
import { construirePagination } from '../utils/pagination'

export interface ChargeNotification {
  user_id: string
  commande_id: string | null
  titre: string
  message: string
  type: TypeNotification
}

export interface DependancesServiceNotifications {
  depotNotifications: typeof depotNotifications
  depotUtilisateurs: typeof depotUtilisateurs
}

export function creerServiceNotifications(dependances: DependancesServiceNotifications = {
  depotNotifications,
  depotUtilisateurs
}) {
  async function envoyer(charge: ChargeNotification) {
    const notification = await dependances.depotNotifications.creer({
      user_id: charge.user_id,
      commande_id: charge.commande_id,
      titre: charge.titre,
      message: charge.message,
      type: charge.type
    })
    const reponse = versReponseNotification(notification)
    emettreAUtilisateur(charge.user_id, EVENEMENTS_SERVEUR.NOUVELLE_NOTIFICATION, reponse)
    const utilisateur = await dependances.depotUtilisateurs.trouverParId(charge.user_id)
    if (utilisateur) {
      envoyerNotificationPush(utilisateur.fcm_token, charge.titre, charge.message, {
        commande_id: charge.commande_id ?? '',
        type: charge.type
      })
    }
    return reponse
  }

  async function envoyerPlusieurs(charges: ChargeNotification[]): Promise<void> {
    for (const charge of charges) {
      await envoyer(charge)
    }
  }

  async function lister(
    utilisateurId: string,
    options: { page: number; limit: number; est_lu?: boolean }
  ) {
    const [{ lignes, total }, totalNonLues] = await Promise.all([
      dependances.depotNotifications.listerParUtilisateur(utilisateurId, options),
      dependances.depotNotifications.compterNonLues(utilisateurId)
    ])
    return {
      donnees: lignes.map(versReponseNotification),
      pagination: construirePagination(options.page, options.limit, total),
      total_non_lues: totalNonLues
    }
  }

  async function marquerLue(utilisateurId: string, notificationId: string) {
    const miseAJour = await dependances.depotNotifications.marquerLue(notificationId, utilisateurId)
    if (miseAJour) {
      return versReponseNotification(miseAJour)
    }
    const existante = await dependances.depotNotifications.trouverParIdEtUtilisateur(notificationId, utilisateurId)
    if (!existante) {
      throw new IntrouvableError('Notification introuvable')
    }
    return versReponseNotification(existante)
  }

  async function marquerToutLues(utilisateurId: string) {
    const modifiees = await dependances.depotNotifications.marquerToutLues(utilisateurId)
    return { modifiees }
  }

  return { envoyer, envoyerPlusieurs, lister, marquerLue, marquerToutLues }
}

export const notificationService = creerServiceNotifications()
export type ServiceNotifications = ReturnType<typeof creerServiceNotifications>
