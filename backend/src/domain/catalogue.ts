export const CATEGORIES_PRODUIT = [
  'ELECTRONIQUE',
  'VETEMENTS',
  'ACCESSOIRES',
  'COSMETIQUES',
  'AMEUBLEMENT',
  'PIECES_AUTO',
  'ALIMENTATION',
  'AUTRE'
] as const

export type CategorieProduit = (typeof CATEGORIES_PRODUIT)[number]

export const LIBELLES_CATEGORIE: Record<CategorieProduit, string> = {
  ELECTRONIQUE: 'Électronique',
  VETEMENTS: 'Vêtements',
  ACCESSOIRES: 'Accessoires',
  COSMETIQUES: 'Cosmétiques',
  AMEUBLEMENT: 'Ameublement',
  PIECES_AUTO: 'Pièces auto',
  ALIMENTATION: 'Alimentation',
  AUTRE: 'Autre'
}
