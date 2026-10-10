import type { Prisma, User } from '@prisma/client'
import type { Role } from '@prisma/client'
import { prisma } from '../config/prisma'

export type ClientPrisma = Prisma.TransactionClient

export const depotUtilisateurs = {
  creer(donnees: Prisma.UserCreateInput, client: ClientPrisma = prisma): Promise<User> {
    return client.user.create({ data: donnees })
  },

  trouverParId(id: string, client: ClientPrisma = prisma): Promise<User | null> {
    return client.user.findUnique({ where: { id } })
  },

  trouverParEmail(email: string, client: ClientPrisma = prisma): Promise<User | null> {
    return client.user.findUnique({ where: { email } })
  },

  mettreAJour(id: string, donnees: Prisma.UserUpdateInput, client: ClientPrisma = prisma): Promise<User> {
    return client.user.update({ where: { id }, data: donnees })
  },

  listerActifsParRole(role: Role, client: ClientPrisma = prisma): Promise<User[]> {
    return client.user.findMany({ where: { role, est_actif: true }, orderBy: { cree_le: 'asc' } })
  }
}
