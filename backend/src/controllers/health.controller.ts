import type { Request, Response } from 'express'
import { prisma } from '../config/prisma'

export async function verifierSante(_requete: Request, reponse: Response): Promise<void> {
  const debut = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    reponse.status(200).json({
      statut: 'ok',
      base_de_donnees: 'connectee',
      latence_ms: Date.now() - debut,
      temps_disponibilite_s: Math.round(process.uptime())
    })
  } catch {
    reponse.status(503).json({ statut: 'degrade', base_de_donnees: 'indisponible' })
  }
}
