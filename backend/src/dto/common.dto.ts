import { z } from 'zod'
import { LISTE_STATUTS } from '../domain/workflow'

export const schemaPagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export const schemaStatutCommande = z.enum(LISTE_STATUTS)

export const schemaParamsId = z.object({
  id: z.string().uuid()
})

export const schemaParamsCommandeId = z.object({
  commandeId: z.string().uuid()
})

export const schemaParamsCodeSuivi = z.object({
  code: z.string().min(5).max(64)
})
