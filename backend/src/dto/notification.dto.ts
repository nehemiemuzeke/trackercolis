import { z } from 'zod'
import { schemaPagination } from './common.dto'

export const schemaListeNotifications = schemaPagination.extend({
  est_lu: z
    .enum(['true', 'false'])
    .optional()
    .transform((valeur) => (valeur === undefined ? undefined : valeur === 'true'))
})

export const schemaParamsNotificationId = z.object({
  id: z.string().uuid()
})

export type DonneesListeNotifications = z.infer<typeof schemaListeNotifications>
