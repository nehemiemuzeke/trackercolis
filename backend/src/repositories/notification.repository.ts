import type { Prisma, Notification } from '@prisma/client'
import { prisma } from '../config/prisma'
import type { ClientPrisma } from './user.repository'

export const depotNotifications = {
  creer(donnees: Prisma.NotificationUncheckedCreateInput, client: ClientPrisma = prisma): Promise<Notification> {
    return client.notification.create({ data: donnees })
  },

  async listerParUtilisateur(
    utilisateurId: string,
    options: { page: number; limit: number; estLu?: boolean }
  ): Promise<{ lignes: Notification[]; total: number }> {
    const where: Prisma.NotificationWhereInput = { user_id: utilisateurId }
    if (options.estLu !== undefined) {
      where.est_lu = options.estLu
    }
    const [lignes, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { cree_le: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit
      }),
      prisma.notification.count({ where })
    ])
    return { lignes, total }
  },

  trouverParIdEtUtilisateur(id: string, utilisateurId: string): Promise<Notification | null> {
    return prisma.notification.findFirst({ where: { id, user_id: utilisateurId } })
  },

  compterNonLues(utilisateurId: string): Promise<number> {
    return prisma.notification.count({ where: { user_id: utilisateurId, est_lu: false } })
  },

  async marquerLue(id: string, utilisateurId: string): Promise<Notification | null> {
    const miseAJour = await prisma.notification.updateMany({
      where: { id, user_id: utilisateurId, est_lu: false },
      data: { est_lu: true }
    })
    if (miseAJour.count === 0) {
      return null
    }
    return prisma.notification.findUnique({ where: { id } })
  },

  async marquerToutLues(utilisateurId: string): Promise<number> {
    const miseAJour = await prisma.notification.updateMany({
      where: { user_id: utilisateurId, est_lu: false },
      data: { est_lu: true }
    })
    return miseAJour.count
  }
}
