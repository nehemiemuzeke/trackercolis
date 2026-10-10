import type { Message } from '@prisma/client'
import { ConflitError } from '../domain/errors'
import type { UtilisateurAuthentifie } from '../domain/types'
import type { DonneesEnvoiMessage } from '../dto/message.dto'
import { EVENEMENTS_SERVEUR } from '../realtime/evenements'
import { emettreASalleCommande, emettreAUtilisateur } from '../realtime/io'
import { depotMessages } from '../repositories/message.repository'
import { depotUtilisateurs } from '../repositories/user.repository'
import { construirePagination } from '../utils/pagination'
import { notificationService, type ServiceNotifications } from './notification.service'
import { commandeService } from './commande.service'

export interface ReponseMessage {
  id: string
  commande_id: string
  expediteur_id: string
  destinataire_id: string
  contenu: string
  piece_jointe: string | null
  est_lu: boolean
  cree_le: Date
  expediteur: { id: string; nom: string; prenom: string; role: string }
}

export interface DependancesServiceMessages {
  depotMessages: typeof depotMessages
  depotUtilisateurs: typeof depotUtilisateurs
  serviceNotifications: ServiceNotifications
}

function versReponse(message: Message, expediteur: { id: string; nom: string; prenom: string; role: string }): ReponseMessage {
  return {
    id: message.id,
    commande_id: message.commande_id,
    expediteur_id: message.expediteur_id,
    destinataire_id: message.destinataire_id,
    contenu: message.contenu,
    piece_jointe: message.piece_jointe,
    est_lu: message.est_lu,
    cree_le: message.cree_le,
    expediteur
  }
}

export function creerServiceMessages(dependances: DependancesServiceMessages = {
  depotMessages,
  depotUtilisateurs,
  serviceNotifications: notificationService
}) {
  async function resoudreDestinataire(utilisateur: UtilisateurAuthentifie, commandeId: string, adminRdcId: string | null): Promise<string | null> {
    if (utilisateur.role !== 'CLIENT') {
      const commande = await commandeService.verifierAcces(utilisateur, commandeId)
      return commande.client_id
    }
    if (adminRdcId) {
      return adminRdcId
    }
    const admins = await dependances.depotUtilisateurs.listerActifsParRole('ADMIN_RDC')
    return admins[0]?.id ?? null
  }

  async function lister(utilisateur: UtilisateurAuthentifie, commandeId: string, options: { page: number; limit: number }) {
    await commandeService.verifierAcces(utilisateur, commandeId)
    await dependances.depotMessages.marquerLusPourDestinataire(commandeId, utilisateur.id)
    const { lignes, total } = await dependances.depotMessages.listerParCommande(commandeId, options)
    return {
      donnees: lignes.map((ligne) =>
        versReponse(ligne, {
          id: ligne.expediteur.id,
          nom: ligne.expediteur.nom,
          prenom: ligne.expediteur.prenom,
          role: ligne.expediteur.role
        })
      ),
      pagination: construirePagination(options.page, options.limit, total)
    }
  }

  async function envoyer(utilisateur: UtilisateurAuthentifie, commandeId: string, donnees: DonneesEnvoiMessage): Promise<ReponseMessage> {
    const commande = await commandeService.verifierAcces(utilisateur, commandeId)
    const destinataireId = await resoudreDestinataire(utilisateur, commandeId, commande.admin_rdc_id)
    if (!destinataireId) {
      throw new ConflitError('Aucun administrateur RDC est disponible pour cette commande')
    }
    const message = await dependances.depotMessages.creer({
      commande_id: commandeId,
      expediteur_id: utilisateur.id,
      destinataire_id: destinataireId,
      contenu: donnees.contenu,
      piece_jointe: donnees.piece_jointe ?? null
    })
    const reponse = versReponse(message, {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role
    })
    await dependances.serviceNotifications.envoyer({
      user_id: destinataireId,
      commande_id: commandeId,
      titre: 'Nouveau message',
      message: `${utilisateur.prenom} ${utilisateur.nom} : ${donnees.contenu.slice(0, 80)}`,
      type: 'MESSAGE'
    })
    emettreASalleCommande(commandeId, EVENEMENTS_SERVEUR.NOUVEAU_MESSAGE, reponse)
    emettreAUtilisateur(destinataireId, EVENEMENTS_SERVEUR.NOUVEAU_MESSAGE, reponse)
    return reponse
  }

  return { lister, envoyer }
}

export const messageService = creerServiceMessages()
