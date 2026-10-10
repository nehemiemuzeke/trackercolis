import type { Prisma, Message, User } from '@prisma/client'
import { prisma } from '../config/prisma'
import type { ClientPrisma } from './user.repository'

export const depotMessages = {
  creer(donnees: Prisma.MessageUncheckedCreateInput, client: ClientPrisma = prisma): Promise<Message> {
    return client.message.create({ data: donnees })
  },

  trouverParId(id: string, client: ClientPrisma = prisma): Promise<Message | null> {
    return client.message.findUnique({ where: { id } })
  },

  async listerParCommande(
    commandeId: string,
    options: { page: number; limit: number }
  ): Promise<{ lignes: Array<Message & { expediteur: User }>; total: number }> {
    const where: Prisma.MessageWhereInput = { commande_id: commandeId }
    const [lignes, total] = await prisma.$transaction([
      prisma.message.findMany({
        where,
        include: { expediteur: true },
        orderBy: { cree_le: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit
      }),
      prisma.message.count({ where })
    ])
    return { lignes, total }
  },

  marquerLusPourDestinataire(commandeId: string, destinataireId: string, client: ClientPrisma = prisma) {
    return client.message.updateMany({
      where: { commande_id: commandeId, destinataire_id: destinataireId, est_lu: false },
      data: { est_lu: true }
    })
  }
}
