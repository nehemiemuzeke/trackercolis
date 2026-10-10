import type { Prisma, StatutCommande } from '@prisma/client'
import { prisma } from '../config/prisma'
import type { CommandeAvecClient } from '../domain/types'
import type { ClientPrisma } from './user.repository'

export interface FiltresListeCommandes {
  page: number
  limit: number
  statut?: StatutCommande
  recherche?: string
  client_id?: string
  etape_minimale?: number
}

const selectionAvecClient = {
  id: true,
  numero_commande: true,
  numero_tracking: true,
  client_id: true,
  description_produit: true,
  categorie_produit: true,
  quantite: true,
  poids_estime_kg: true,
  valeur_declaree_usd: true,
  adresse_livraison: true,
  ville_livraison: true,
  statut_actuel: true,
  etape_actuelle: true,
  admin_rdc_id: true,
  admin_chine_id: true,
  frais_service_usd: true,
  frais_livraison_usd: true,
  montant_total_usd: true,
  statut_paiement: true,
  date_livraison_estimee: true,
  date_livraison_reelle: true,
  notes_client: true,
  notes_admin_rdc: true,
  notes_admin_chine: true,
  cree_le: true,
  modifie_le: true,
  client: true
} satisfies Prisma.CommandeSelect

export const depotCommandes = {
  creer(donnees: Prisma.CommandeUncheckedCreateInput, client: ClientPrisma = prisma) {
    return client.commande.create({ data: donnees, select: selectionAvecClient }) as Promise<CommandeAvecClient>
  },

  trouverParId(id: string, client: ClientPrisma = prisma) {
    return client.commande.findUnique({ where: { id }, select: selectionAvecClient }) as Promise<CommandeAvecClient | null>
  },

  trouverParNumeroCommande(numero: string, client: ClientPrisma = prisma) {
    return client.commande.findUnique({ where: { numero_commande: numero }, select: selectionAvecClient }) as Promise<CommandeAvecClient | null>
  },

  trouverParNumeroTracking(code: string, client: ClientPrisma = prisma) {
    return client.commande.findUnique({ where: { numero_tracking: code }, select: selectionAvecClient }) as Promise<CommandeAvecClient | null>
  },

  async lister(filtres: FiltresListeCommandes): Promise<{ lignes: CommandeAvecClient[]; total: number }> {
    const where: Prisma.CommandeWhereInput = {}
    if (filtres.statut) {
      where.statut_actuel = filtres.statut
    }
    if (filtres.client_id) {
      where.client_id = filtres.client_id
    }
    if (filtres.etape_minimale !== undefined) {
      where.etape_actuelle = { gte: filtres.etape_minimale }
    }
    if (filtres.recherche) {
      where.OR = [
        { numero_commande: { contains: filtres.recherche, mode: 'insensitive' } },
        { numero_tracking: { contains: filtres.recherche, mode: 'insensitive' } },
        { description_produit: { contains: filtres.recherche, mode: 'insensitive' } }
      ]
    }
    const [lignes, total] = await prisma.$transaction([
      prisma.commande.findMany({
        where,
        select: selectionAvecClient,
        orderBy: { cree_le: 'desc' },
        skip: (filtres.page - 1) * filtres.limit,
        take: filtres.limit
      }),
      prisma.commande.count({ where })
    ])
    return { lignes: lignes as CommandeAvecClient[], total }
  },

  listerRecentes(limit: number, where: Prisma.CommandeWhereInput = {}) {
    return prisma.commande.findMany({
      select: selectionAvecClient,
      where,
      orderBy: { cree_le: 'desc' },
      take: limit
    }) as Promise<CommandeAvecClient[]>
  },

  listerParStatut(statut: StatutCommande) {
    return prisma.commande.findMany({
      select: selectionAvecClient,
      where: { statut_actuel: statut }
    }) as Promise<CommandeAvecClient[]>
  },

  mettreAJour(id: string, donnees: Prisma.CommandeUncheckedUpdateInput, client: ClientPrisma = prisma) {
    return client.commande.update({ where: { id }, data: donnees, select: selectionAvecClient }) as Promise<CommandeAvecClient>
  },

  supprimer(id: string, client: ClientPrisma = prisma) {
    return client.commande.delete({ where: { id } })
  },

  async compterParStatut(where: Prisma.CommandeWhereInput): Promise<Record<string, number>> {
    const groupes = await prisma.commande.groupBy({
      by: ['statut_actuel'],
      _count: { _all: true },
      where
    })
    const compteur: Record<string, number> = {}
    for (const groupe of groupes) {
      compteur[groupe.statut_actuel] = groupe._count._all
    }
    return compteur
  },

  async sommerMontantTotal(where: Prisma.CommandeWhereInput): Promise<number> {
    const agregat = await prisma.commande.aggregate({ _sum: { montant_total_usd: true }, where })
    return agregat._sum.montant_total_usd ?? 0
  },

  compter(where: Prisma.CommandeWhereInput): Promise<number> {
    return prisma.commande.count({ where })
  }
}
