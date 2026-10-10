import { z } from 'zod'
import { schemaStatutCommande } from './common.dto'

export const schemaAjoutEtape = z.object({
  statut: schemaStatutCommande,
  photo_preuve: z.string().url().max(500).optional(),
  signature_url: z.string().url().max(500).optional()
})

export type DonneesAjoutEtape = z.infer<typeof schemaAjoutEtape>
