import type { Prisma, SuiviColis } from '@prisma/client'
import { prisma } from '../config/prisma'
import type { ClientPrisma } from './user.repository'

export const depotSuivis = {
  creer(donnees: Prisma.SuiviColisUncheckedCreateInput, client: ClientPrisma = prisma): Promise<SuiviColis> {
    return client.suiviColis.create({ data: donnees })
  },

  listerParCommande(commandeId: string): Promise<SuiviColis[]> {
    return prisma.suiviColis.findMany({
      where: { commande_id: commandeId },
      orderBy: [{ cree_le: 'asc' }, { id: 'asc' }]
    })
  },

  async dernierParCommandeEtEtape(commandeId: string, numeroEtape: number): Promise<SuiviColis | null> {
    const lignes = await prisma.suiviColis.findMany({
      where: { commande_id: commandeId, numero_etape: numeroEtape },
      orderBy: { cree_le: 'desc' },
      take: 1
    })
    return lignes[0] ?? null
  }
}
