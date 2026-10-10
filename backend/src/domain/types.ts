import type { Commande, Message, Role, TypeActeur, TypeNotification, User } from '@prisma/client'

export interface UtilisateurAuthentifie {
  id: string
  email: string
  nom: string
  prenom: string
  role: Role
}

export type CommandeAvecClient = Commande & { client: User }

export type MessageAvecExpediteur = Message & { expediteur: User }

export interface InfosPagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface TarifsLivraison {
  frais_service_base_usd: number
  frais_service_par_kg_usd: number
  frais_livraison_base_usd: number
  frais_livraison_par_kg_usd: number
}

export interface FraisCalcules {
  frais_service_usd: number
  frais_livraison_usd: number
  montant_total_usd: number
}

export type { Role, TypeActeur, TypeNotification }
