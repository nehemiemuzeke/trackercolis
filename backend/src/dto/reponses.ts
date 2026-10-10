import type { Commande, Message, Notification, Role, SuiviColis, User } from '@prisma/client'
import { actionsDisponibles, type ActionDisponible } from '../domain/workflow'
import type { CommandeAvecClient, MessageAvecExpediteur } from '../domain/types'

export type { CommandeAvecClient, MessageAvecExpediteur }

export function versReponseUtilisateur(utilisateur: User) {
  return {
    id: utilisateur.id,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    email: utilisateur.email,
    telephone: utilisateur.telephone,
    role: utilisateur.role,
    adresse: utilisateur.adresse,
    ville: utilisateur.ville,
    pays: utilisateur.pays,
    photo_profil: utilisateur.photo_profil,
    est_actif: utilisateur.est_actif,
    cree_le: utilisateur.cree_le,
    modifie_le: utilisateur.modifie_le
  }
}

export function versUtilisateurAuthentifie(utilisateur: User) {
  return {
    id: utilisateur.id,
    email: utilisateur.email,
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    role: utilisateur.role
  }
}

export function versReponseCommande(commande: CommandeAvecClient, role: Role) {
  return {
    id: commande.id,
    numero_commande: commande.numero_commande,
    numero_tracking: commande.numero_tracking,
    client_id: commande.client_id,
    description_produit: commande.description_produit,
    categorie_produit: commande.categorie_produit,
    quantite: commande.quantite,
    poids_estime_kg: commande.poids_estime_kg,
    valeur_declaree_usd: commande.valeur_declaree_usd,
    adresse_livraison: commande.adresse_livraison,
    ville_livraison: commande.ville_livraison,
    statut_actuel: commande.statut_actuel,
    etape_actuelle: commande.etape_actuelle,
    admin_rdc_id: commande.admin_rdc_id,
    admin_chine_id: commande.admin_chine_id,
    frais_service_usd: commande.frais_service_usd,
    frais_livraison_usd: commande.frais_livraison_usd,
    montant_total_usd: commande.montant_total_usd,
    statut_paiement: commande.statut_paiement,
    date_livraison_estimee: commande.date_livraison_estimee,
    date_livraison_reelle: commande.date_livraison_reelle,
    notes_client: commande.notes_client,
    notes_admin_rdc: role === 'CLIENT' ? undefined : commande.notes_admin_rdc,
    notes_admin_chine: role === 'CLIENT' ? undefined : commande.notes_admin_chine,
    cree_le: commande.cree_le,
    modifie_le: commande.modifie_le,
    client:
      role === 'CLIENT'
        ? undefined
        : {
            id: commande.client.id,
            nom: commande.client.nom,
            prenom: commande.client.prenom,
            email: commande.client.email,
            telephone: commande.client.telephone,
            adresse: commande.client.adresse,
            ville: commande.client.ville,
            pays: commande.client.pays
          },
    actions: role === 'CLIENT' ? [] : actionsDisponibles(commande.statut_actuel, role, commande.id)
  }
}

export function versReponseSuivi(suivi: SuiviColis) {
  return {
    id: suivi.id,
    commande_id: suivi.commande_id,
    numero_etape: suivi.numero_etape,
    statut: suivi.statut,
    label: suivi.label,
    description: suivi.description,
    lieu: suivi.lieu,
    latitude: suivi.latitude,
    longitude: suivi.longitude,
    declenche_par: suivi.declenche_par,
    type_acteur: suivi.type_acteur,
    photo_preuve: suivi.photo_preuve,
    signature_url: suivi.signature_url,
    cree_le: suivi.cree_le
  }
}

export function versReponseNotification(notification: Notification) {
  return {
    id: notification.id,
    user_id: notification.user_id,
    commande_id: notification.commande_id,
    titre: notification.titre,
    message: notification.message,
    type: notification.type,
    est_lu: notification.est_lu,
    cree_le: notification.cree_le
  }
}

export function versReponseMessage(message: MessageAvecExpediteur) {
  return {
    id: message.id,
    commande_id: message.commande_id,
    expediteur_id: message.expediteur_id,
    destinataire_id: message.destinataire_id,
    contenu: message.contenu,
    piece_jointe: message.piece_jointe,
    est_lu: message.est_lu,
    cree_le: message.cree_le,
    expediteur: {
      id: message.expediteur.id,
      nom: message.expediteur.nom,
      prenom: message.expediteur.prenom,
      role: message.expediteur.role
    }
  }
}

export type { ActionDisponible }
