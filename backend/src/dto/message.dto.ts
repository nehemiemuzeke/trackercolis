import { z } from 'zod'
import { schemaPagination } from './common.dto'

export const schemaEnvoiMessage = z.object({
  contenu: z.string().trim().min(1, 'Le message ne peut pas être vide').max(2000),
  piece_jointe: z.string().url().max(500).optional()
})

export const schemaListeMessages = schemaPagination

export const schemaMessageSocket = z.object({
  commande_id: z.string().uuid(),
  contenu: z.string().trim().min(1).max(2000),
  piece_jointe: z.string().url().max(500).optional()
})

export const schemaRejoindreCommande = z.object({
  commande_id: z.string().uuid()
})

export type DonneesEnvoiMessage = z.infer<typeof schemaEnvoiMessage>
export type DonneesListeMessages = z.infer<typeof schemaListeMessages>
