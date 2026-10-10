import { Prisma, StatutProduit } from '@prisma/client'
import { prisma } from '../config/prisma'
import { ErreurMetier } from '../utils/erreurs'

function genererReference(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `PRD-${y}${m}${d}-${rand}`
}

export const produitService = {
  async lister(params: {
    page: number
    limit: number
    recherche?: string
    statut?: StatutProduit
    categorie_id?: string
    est_vedette?: boolean
    publicSeulement?: boolean
  }) {
    const where: Prisma.ProduitWhereInput = {}
    if (params.publicSeulement) {
      where.statut = 'PUBLIE'
    } else if (params.statut) {
      where.statut = params.statut
    }
    if (params.categorie_id) where.categorie_id = params.categorie_id
    if (params.est_vedette !== undefined) where.est_vedette = params.est_vedette
    if (params.recherche) {
      where.OR = [
        { nom: { contains: params.recherche, mode: 'insensitive' } },
        { description: { contains: params.recherche, mode: 'insensitive' } },
        { reference: { contains: params.recherche, mode: 'insensitive' } }
      ]
    }

    const skip = (params.page - 1) * params.limit
    const [total, donnees] = await Promise.all([
      prisma.produit.count({ where }),
      prisma.produit.findMany({
        where,
        include: {
          categorie: true,
          vendeur: { select: { id: true, nom: true, prenom: true } }
        },
        orderBy: [{ est_vedette: 'desc' }, { cree_le: 'desc' }],
        skip,
        take: params.limit
      })
    ])

    return {
      donnees,
      page: params.page,
      limit: params.limit,
      total,
      total_pages: Math.ceil(total / params.limit) || 1
    }
  },

  async obtenirParId(id: string, incrementerVues = false) {
    const produit = await prisma.produit.findUnique({
      where: { id },
      include: {
        categorie: true,
        vendeur: { select: { id: true, nom: true, prenom: true } }
      }
    })
    if (!produit) throw new ErreurMetier('Produit introuvable', 404)
    if (incrementerVues) {
      await prisma.produit.update({ where: { id }, data: { vues: { increment: 1 } } })
    }
    return produit
  },

  async creer(vendeurId: string, donnees: {
    nom: string
    description: string
    description_courte?: string | null
    prix_usd: number
    prix_promo_usd?: number | null
    stock: number
    poids_kg: number
    categorie_id?: string | null
    statut: StatutProduit
    est_vedette: boolean
    tags?: string[]
    images?: string[]
    image_principale?: string | null
  }) {
    return prisma.produit.create({
      data: {
        reference: genererReference(),
        nom: donnees.nom,
        description: donnees.description,
        description_courte: donnees.description_courte ?? null,
        prix_usd: donnees.prix_usd,
        prix_promo_usd: donnees.prix_promo_usd ?? null,
        stock: donnees.stock,
        poids_kg: donnees.poids_kg,
        categorie_id: donnees.categorie_id ?? null,
        statut: donnees.statut,
        est_vedette: donnees.est_vedette,
        tags: donnees.tags ?? [],
        images: donnees.images ?? [],
        image_principale: donnees.image_principale ?? null,
        vendeur_id: vendeurId
      },
      include: { categorie: true }
    })
  },

  async mettreAJour(id: string, donnees: Partial<{
    nom: string
    description: string
    description_courte: string | null
    prix_usd: number
    prix_promo_usd: number | null
    stock: number
    poids_kg: number
    categorie_id: string | null
    statut: StatutProduit
    est_vedette: boolean
    tags: string[]
    images: string[]
    image_principale: string | null
  }>) {
    await this.obtenirParId(id)
    return prisma.produit.update({
      where: { id },
      data: donnees,
      include: { categorie: true }
    })
  },

  async supprimer(id: string) {
    await this.obtenirParId(id)
    await prisma.produit.delete({ where: { id } })
  },

  async ajouterImages(id: string, urls: string[]) {
    const produit = await this.obtenirParId(id)
    const images = [...produit.images, ...urls]
    const image_principale = produit.image_principale ?? urls[0] ?? null
    return prisma.produit.update({
      where: { id },
      data: { images, image_principale },
      include: { categorie: true }
    })
  },

  async listerCategories() {
    return prisma.categorie.findMany({
      where: { est_active: true },
      orderBy: { ordre: 'asc' },
      include: { _count: { select: { produits: true } } }
    })
  },

  async creerCategorie(donnees: { nom: string; description?: string | null; icone?: string | null; ordre?: number }) {
    return prisma.categorie.create({
      data: {
        nom: donnees.nom,
        description: donnees.description ?? null,
        icone: donnees.icone ?? null,
        ordre: donnees.ordre ?? 0
      }
    })
  },

  async statsProduits() {
    const [total, publies, rupture, vedettes, valeurStock] = await Promise.all([
      prisma.produit.count(),
      prisma.produit.count({ where: { statut: 'PUBLIE' } }),
      prisma.produit.count({ where: { statut: 'RUPTURE' } }),
      prisma.produit.count({ where: { est_vedette: true } }),
      prisma.produit.aggregate({
        _sum: { stock: true },
        where: { statut: { in: ['PUBLIE', 'RUPTURE'] } }
      })
    ])
    const topVues = await prisma.produit.findMany({
      where: { statut: 'PUBLIE' },
      orderBy: { vues: 'desc' },
      take: 5,
      select: { id: true, nom: true, vues: true, prix_usd: true, image_principale: true, stock: true }
    })
    return {
      total,
      publies,
      rupture,
      vedettes,
      unites_stock: valeurStock._sum.stock ?? 0,
      top_vues: topVues
    }
  }
}