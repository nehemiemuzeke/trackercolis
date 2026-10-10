import { z } from 'zod'

export const schemaInscription = z.object({
  nom: z.string().trim().min(2).max(100),
  prenom: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  mot_de_passe: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(72)
    .regex(/[A-Za-z]/, 'Le mot de passe doit contenir au moins une lettre')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  telephone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide'),
  adresse: z.string().trim().min(5).max(300).optional(),
  ville: z.string().trim().min(2).max(60).optional(),
  pays: z.string().trim().min(2).max(60).optional()
})

export const schemaConnexion = z.object({
  email: z.string().trim().toLowerCase().email(),
  mot_de_passe: z.string().min(1)
})

export const schemaRafraichissement = z.object({
  jeton_rafraichissement: z.string().min(10)
})

export const schemaTokenFcm = z.object({
  fcm_token: z.string().min(20).max(512)
})

export type DonneesInscription = z.infer<typeof schemaInscription>
export type DonneesConnexion = z.infer<typeof schemaConnexion>
export type DonneesRafraichissement = z.infer<typeof schemaRafraichissement>
export type DonneesTokenFcm = z.infer<typeof schemaTokenFcm>
