import { z } from 'zod'

export const schemaCreationProduit = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(200),
  description: z.string().min(5, 'La description doit contenir au moins 5 caractères').max(5000),
  description_courte: z.string().max(300).optional().nullable(),
  prix_usd: z.coerce.number().positive('Le prix doit être supérieur à 0'),
  prix_promo_usd: z.coerce.number().positive().optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  poids_kg: z.coerce.number().positive().default(0.5),
  categorie_id: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid('UUID de catégorie invalide').optional().nullable()
  ),
  statut: z.enum(['BROUILLON', 'PUBLIE', 'RUPTURE', 'ARCHIVE']).default('BROUILLON'),
  est_vedette: z.coerce.boolean().default(false),
  tags: z.array(z.string()).optional().default([])
})

export const schemaMiseAJourProduit = schemaCreationProduit.partial()

export const schemaListeProduits = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  recherche: z.string().optional(),
  statut: z.enum(['BROUILLON', 'PUBLIE', 'RUPTURE', 'ARCHIVE']).optional(),
  categorie_id: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().uuid().optional()
  ),
  est_vedette: z.coerce.boolean().optional()
})

export const schemaCategorie = z.object({
  nom: z.string().min(2).max(100),
  description: z.string().max(500).optional().nullable(),
  icone: z.string().max(50).optional().nullable(),
  ordre: z.coerce.number().int().default(0)
})