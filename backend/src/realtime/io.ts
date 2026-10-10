import type { Server } from 'socket.io'
import type { EvenementServeur } from './evenements'

let instanceIo: Server | null = null

export function definirIo(io: Server): void {
  instanceIo = io
}

export function obtenirIo(): Server | null {
  return instanceIo
}

export function salleUtilisateur(utilisateurId: string): string {
  return `user:${utilisateurId}`
}

export function salleCommande(commandeId: string): string {
  return `order:${commandeId}`
}

export function emettreAUtilisateur(utilisateurId: string, evenement: EvenementServeur, donnees: unknown): void {
  instanceIo?.to(salleUtilisateur(utilisateurId)).emit(evenement, donnees)
}

export function emettreAuxUtilisateurs(utilisateurIds: string[], evenement: EvenementServeur, donnees: unknown): void {
  const uniques = Array.from(new Set(utilisateurIds))
  for (const utilisateurId of uniques) {
    emettreAUtilisateur(utilisateurId, evenement, donnees)
  }
}

export function emettreASalleCommande(commandeId: string, evenement: EvenementServeur, donnees: unknown): void {
  instanceIo?.to(salleCommande(commandeId)).emit(evenement, donnees)
}
