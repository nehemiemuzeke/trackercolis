import { z } from 'zod'
import { CATEGORIES_PRODUIT } from '../domain/catalogue'
import { schemaPagination, schemaStatutCommande } from './common.dto'

export const schemaCreationCommande = z.object({
  description_produit: z.string().trim().min(3).max(500),
  categorie_produit: z.enum(CATEGORIES_PRODUIT),
  quantite: z.number().int().min(1).max(1000),
  poids_estime_kg: z.number().min(0.1).max(500),
  valeur_declaree_usd: z.number().min(1).max(100000),
  adresse_livraison: z.string().trim().min(5).max(300),
  ville_livraison: z.string().trim().min(2).max(60),
  notes_client: z.string().trim().max(1000).optional()
})

export const schemaModificationCommande = z.object({
  description_produit: z.string().trim().min(3).max(500).optional(),
  categorie_produit: z.enum(CATEGORIES_PRODUIT).optional(),
  quantite: z.number().int().min(1).max(1000).optional(),
  poids_estime_kg: z.number().min(0.1).max(500).optional(),
  valeur_declaree_usd: z.number().min(1).max(100000).optional(),
  adresse_livraison: z.string().trim().min(5).max(300).optional(),
  ville_livraison: z.string().trim().min(2).max(60).optional(),
  notes_client: z.string().trim().max(1000).optional(),
  notes_admin_rdc: z.string().trim().max(1000).optional(),
  notes_admin_chine: z.string().trim().max(1000).optional()
})

export const schemaListeCommandes = schemaPagination.extend({
  statut: schemaStatutCommande.optional(),
  q: z.string().trim().max(100).optional()
})

export const schemaListeRecentes = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5)
})

export type DonneesCreationCommande = z.infer<typeof schemaCreationCommande>
export type DonneesModificationCommande = z.infer<typeof schemaModificationCommande>
export type DonneesListeCommandes = z.infer<typeof schemaListeCommandes>
