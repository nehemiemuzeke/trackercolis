import { z, type ZodTypeAny } from 'zod'
import { ValidationError } from '../domain/errors'

export function valider<S extends ZodTypeAny>(schema: S, donnees: unknown): z.output<S> {
  const resultat = schema.safeParse(donnees)
  if (!resultat.success) {
    throw new ValidationError(
      'Données invalides',
      resultat.error.issues.map((anomalie) => ({
        champ: anomalie.path.join('.') || 'corps',
        message: anomalie.message
      }))
    )
  }
  return resultat.data as z.output<S>
}
