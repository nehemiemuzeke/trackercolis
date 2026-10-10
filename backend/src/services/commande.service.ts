import type { Prisma } from '@prisma/client'
import { env } from '../config/env'
import { prisma } from '../config/prisma'
import { logger } from '../config/logger'
import { AccesRefuseError, ConflitError, IntrouvableError, RequeteInvalideError } from '../domain/errors'
import type { TarifsLivraison, UtilisateurAuthentifie } from '../domain/types'
import { versReponseCommande } from '../dto/reponses'
import type { DonneesCreationCommande, DonneesListeCommandes, DonneesModificationCommande } from '../dto/commande.dto'
import { etapeParStatut } from '../domain/workflow'
import { EVENEMENTS_SERVEUR } from '../realtime/evenements'
import { emettreASalleCommande } from '../realtime/io'
import { depotCommandes } from '../repositories/commande.repository'
import type { CommandeAvecClient } from '../domain/types'
import { depotSuivis } from '../repositories/suivi.repository'
import { depotUtilisateurs } from '../repositories/user.repository'
import { construirePagination } from '../utils/pagination'
import { calculerFrais } from './pricing.service'
import { genererNumeroCommande, genererNumeroTracking } from './tracking-number.service'
import { notificationService, type ServiceNotifications } from './notification.service'

export interface DependancesServiceCommandes {
  depotCommandes: typeof depotCommandes
  depotSuivis: typeof depotSuivis
  depotUtilisateurs: typeof depotUtilisateurs
  serviceNotifications: ServiceNotifications
}

export function creerServiceCommandes(dependances: DependancesServiceCommandes = {
  depotCommandes,
  depotSuivis,
  depotUtilisateurs,
  serviceNotifications: notificationService
}) {
  function tarifsActuels(): TarifsLivraison {
    return {
      frais_service_base_usd: env.SERVICE_FEE_BASE_USD,
      frais_service_par_kg_usd: env.SERVICE_FEE_PER_KG_USD,
      frais_livraison_base_usd: env.DELIVERY_FEE_BASE_USD,
      frais_livraison_par_kg_usd: env.DELIVERY_FEE_PER_KG_USD
    }
  }

  function porteeParRole(utilisateur: UtilisateurAuthentifie): { client_id?: string; etape_minimale?: number } {
    if (utilisateur.role === 'CLIENT') {
      return { client_id: utilisateur.id }
    }
    if (utilisateur.role === 'ADMIN_CHINE') {
      return { etape_minimale: 3 }
    }
    return {}
  }

  function verifierAccesCommande(utilisateur: UtilisateurAuthentifie, commande: CommandeAvecClient): void {
    if (utilisateur.role === 'ADMIN_RDC') {
      return
    }
    if (utilisateur.role === 'ADMIN_CHINE') {
      if (commande.etape_actuelle < 3) {
        throw new IntrouvableError('Commande introuvable')
      }
      return
    }
    if (commande.client_id !== utilisateur.id) {
      throw new AccesRefuseError('Cette commande ne vous appartient pas')
    }
  }

  async function verifierAcces(utilisateur: UtilisateurAuthentifie, commandeId: string): Promise<CommandeAvecClient> {
    const commande = await dependances.depotCommandes.trouverParId(commandeId)
    if (!commande) {
      throw new IntrouvableError('Commande introuvable')
    }
    verifierAccesCommande(utilisateur, commande)
    return commande
  }

  async function creer(utilisateur: UtilisateurAuthentifie, donnees: DonneesCreationCommande): Promise<CommandeAvecClient> {
    const frais = calculerFrais(donnees, tarifsActuels())
    const [numeroCommande, numeroTracking] = await Promise.all([genererNumeroCommande(), genererNumeroTracking()])
    const dateLivraisonEstimee = new Date(Date.now() + env.ESTIMATED_DELIVERY_DAYS * 24 * 60 * 60 * 1000)

    const commandeCreee = await prisma.$transaction(async (client) => {
      const creee = await dependances.depotCommandes.creer(
        {
          numero_commande: numeroCommande,
          numero_tracking: numeroTracking,
          client_id: utilisateur.id,
          description_produit: donnees.description_produit,
          categorie_produit: donnees.categorie_produit,
          quantite: donnees.quantite,
          poids_estime_kg: donnees.poids_estime_kg,
          valeur_declaree_usd: donnees.valeur_declaree_usd,
          adresse_livraison: donnees.adresse_livraison,
          ville_livraison: donnees.ville_livraison,
          statut_actuel: 'COMMANDE_CREEE',
          etape_actuelle: 1,
          frais_service_usd: frais.frais_service_usd,
          frais_livraison_usd: frais.frais_livraison_usd,
          montant_total_usd: frais.montant_total_usd,
          statut_paiement: 'EN_ATTENTE',
          date_livraison_estimee: dateLivraisonEstimee,
          notes_client: donnees.notes_client ?? null
        },
        client
      )
      const etape = etapeParStatut('COMMANDE_CREEE')
      await dependances.depotSuivis.creer(
        {
          commande_id: creee.id,
          numero_etape: etape.numero,
          statut: etape.statut,
          label: etape.label,
          description: etape.description,
          lieu: etape.lieu,
          latitude: etape.latitude,
          longitude: etape.longitude,
          type_acteur: 'CLIENT',
          declenche_par: utilisateur.id
        },
        client
      )
      return creee
    })

    await dependances.serviceNotifications.envoyer({
      user_id: utilisateur.id,
      commande_id: commandeCreee.id,
      titre: 'Commande créée',
      message: `Votre commande ${commandeCreee.numero_commande} a été enregistrée. Numéro de suivi : ${commandeCreee.numero_tracking}.`,
      type: 'STATUT_CHANGE'
    })

    const administrateursRdc = await dependances.depotUtilisateurs.listerActifsParRole('ADMIN_RDC')
    await dependances.serviceNotifications.envoyerPlusieurs(
      administrateursRdc.map((administrateur) => ({
        user_id: administrateur.id,
        commande_id: commandeCreee.id,
        titre: 'Nouvelle commande à valider',
        message: `La commande ${commandeCreee.numero_commande} de ${utilisateur.prenom} ${utilisateur.nom} attend votre validation.`,
        type: 'NOUVELLE_COMMANDE'
      }))
    )

    logger.info({ commande_id: commandeCreee.id, client_id: utilisateur.id }, 'commande_creee')
    return commandeCreee
  }

  async function lister(utilisateur: UtilisateurAuthentifie, filtres: DonneesListeCommandes) {
    const portee = porteeParRole(utilisateur)
    const { lignes, total } = await dependances.depotCommandes.lister({
      page: filtres.page,
      limit: filtres.limit,
      statut: filtres.statut,
      recherche: filtres.q,
      client_id: portee.client_id,
      etape_minimale: portee.etape_minimale
    })
    return {
      donnees: lignes.map((ligne) => versReponseCommande(ligne, utilisateur.role)),
      pagination: construirePagination(filtres.page, filtres.limit, total)
    }
  }

  async function obtenirParId(utilisateur: UtilisateurAuthentifie, commandeId: string) {
    const commande = await verifierAcces(utilisateur, commandeId)
    return versReponseCommande(commande, utilisateur.role)
  }

  async function obtenirParCodeSuivi(utilisateur: UtilisateurAuthentifie, code: string) {
    const commande = await dependances.depotCommandes.trouverParNumeroTracking(code)
    if (!commande) {
      throw new IntrouvableError('Aucune commande ne correspond à ce numéro de suivi')
    }
    verifierAccesCommande(utilisateur, commande)
    return versReponseCommande(commande, utilisateur.role)
  }

  async function modifier(utilisateur: UtilisateurAuthentifie, commandeId: string, donnees: DonneesModificationCommande) {
    const commande = await verifierAcces(utilisateur, commandeId)
    const miseAJour: Prisma.CommandeUncheckedUpdateInput = {}

    if (utilisateur.role === 'CLIENT') {
      if (commande.statut_actuel !== 'COMMANDE_CREEE') {
        throw new ConflitError('Cette commande a déjà été validée et ne peut plus être modifiée')
      }
      const champsClient: Array<keyof DonneesModificationCommande> = [
        'description_produit',
        'categorie_produit',
        'quantite',
        'poids_estime_kg',
        'valeur_declaree_usd',
        'adresse_livraison',
        'ville_livraison',
        'notes_client'
      ]
      for (const champ of champsClient) {
        if (donnees[champ] !== undefined) {
          miseAJour[champ] = donnees[champ]
        }
      }
      if (donnees.poids_estime_kg !== undefined || donnees.valeur_declaree_usd !== undefined) {
        const frais = calculerFrais(
          {
            poids_estime_kg: donnees.poids_estime_kg ?? commande.poids_estime_kg,
            valeur_declaree_usd: donnees.valeur_declaree_usd ?? commande.valeur_declaree_usd
          },
          tarifsActuels()
        )
        miseAJour.frais_service_usd = frais.frais_service_usd
        miseAJour.frais_livraison_usd = frais.frais_livraison_usd
        miseAJour.montant_total_usd = frais.montant_total_usd
      }
    } else if (utilisateur.role === 'ADMIN_RDC') {
      if (donnees.notes_admin_rdc !== undefined) {
        miseAJour.notes_admin_rdc = donnees.notes_admin_rdc
      }
    } else if (donnees.notes_admin_chine !== undefined) {
      miseAJour.notes_admin_chine = donnees.notes_admin_chine
    }

    if (Object.keys(miseAJour).length === 0) {
      throw new RequeteInvalideError('Aucun champ modifiable fourni')
    }

    const commandeModifiee = await dependances.depotCommandes.mettreAJour(commandeId, miseAJour)
    emettreASalleCommande(commandeId, EVENEMENTS_SERVEUR.COMMANDE_MISE_A_JOUR, versReponseCommande(commandeModifiee, utilisateur.role))
    return versReponseCommande(commandeModifiee, utilisateur.role)
  }

  async function supprimer(utilisateur: UtilisateurAuthentifie, commandeId: string) {
    const commande = await verifierAcces(utilisateur, commandeId)
    if (utilisateur.role !== 'CLIENT') {
      throw new AccesRefuseError('Seul le client propriétaire peut annuler sa commande')
    }
    if (commande.statut_actuel !== 'COMMANDE_CREEE') {
      throw new ConflitError('Seule une commande non encore validée peut être annulée')
    }
    await dependances.depotCommandes.supprimer(commandeId)
    logger.info({ commande_id: commandeId, client_id: utilisateur.id }, 'commande_annulee')
  }

  return { creer, lister, obtenirParId, obtenirParCodeSuivi, modifier, supprimer, verifierAcces }
}

export const commandeService = creerServiceCommandes()
export type ServiceCommandes = ReturnType<typeof creerServiceCommandes>
