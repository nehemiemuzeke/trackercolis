import { randomBytes } from 'node:crypto'
import { ConflitError } from '../domain/errors'
import { depotCommandes } from '../repositories/commande.repository'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function suffixeAleatoire(longueur: number): string {
  const octets = randomBytes(longueur)
  let suffixe = ''
  for (let index = 0; index < longueur; index += 1) {
    suffixe += ALPHABET[octets[index] % ALPHABET.length]
  }
  return suffixe
}

function prefixeDate(): string {
  const maintenant = new Date()
  const annee = String(maintenant.getUTCFullYear()).slice(-2)
  const mois = String(maintenant.getUTCMonth() + 1).padStart(2, '0')
  const jour = String(maintenant.getUTCDate()).padStart(2, '0')
  return `${annee}${mois}${jour}`
}

const TENTATIVES_MAXIMALES = 5

export async function genererNumeroCommande(): Promise<string> {
  for (let tentative = 0; tentative < TENTATIVES_MAXIMALES; tentative += 1) {
    const candidat = `CMD-${prefixeDate()}-${suffixeAleatoire(6)}`
    const existante = await depotCommandes.trouverParNumeroCommande(candidat)
    if (!existante) {
      return candidat
    }
  }
  throw new ConflitError('Impossible de générer un numéro de commande unique')
}

export async function genererNumeroTracking(): Promise<string> {
  for (let tentative = 0; tentative < TENTATIVES_MAXIMALES; tentative += 1) {
    const candidat = `RDC-CN-${prefixeDate()}-${suffixeAleatoire(8)}`
    const existante = await depotCommandes.trouverParNumeroTracking(candidat)
    if (!existante) {
      return candidat
    }
  }
  throw new ConflitError('Impossible de générer un numéro de tracking unique')
}
