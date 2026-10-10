import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { env } from '../src/config/env'
import { logger } from '../src/config/logger'

const prisma = new PrismaClient()

async function principal(): Promise<void> {
  const [empreinteAdminRdc, empreinteAdminChine, empreinteClient] = await Promise.all([
    bcrypt.hash(env.SEED_ADMIN_RDC_PASSWORD, env.BCRYPT_SALT_ROUNDS),
    bcrypt.hash(env.SEED_ADMIN_CHINE_PASSWORD, env.BCRYPT_SALT_ROUNDS),
    bcrypt.hash(env.SEED_CLIENT_PASSWORD, env.BCRYPT_SALT_ROUNDS)
  ])

  await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_RDC_EMAIL },
    update: { est_actif: true },
    create: {
      nom: 'Kabongo',
      prenom: 'David',
      email: env.SEED_ADMIN_RDC_EMAIL,
      mot_de_passe: empreinteAdminRdc,
      telephone: '+243810000001',
      role: 'ADMIN_RDC',
      adresse: "Aéroport international de N'djili",
      ville: 'Kinshasa',
      pays: 'RD Congo'
    }
  })

  await prisma.user.upsert({
    where: { email: env.SEED_ADMIN_CHINE_EMAIL },
    update: { est_actif: true },
    create: {
      nom: 'Wang',
      prenom: 'Li',
      email: env.SEED_ADMIN_CHINE_EMAIL,
      mot_de_passe: empreinteAdminChine,
      telephone: '+8613800000002',
      role: 'ADMIN_CHINE',
      adresse: 'District de Tianhe',
      ville: 'Guangzhou',
      pays: 'Chine'
    }
  })

  await prisma.user.upsert({
    where: { email: env.SEED_CLIENT_EMAIL },
    update: { est_actif: true },
    create: {
      nom: 'Mutombo',
      prenom: 'Grace',
      email: env.SEED_CLIENT_EMAIL,
      mot_de_passe: empreinteClient,
      telephone: '+243820000003',
      role: 'CLIENT',
      adresse: '12, Avenue Kasa-Vubu, Gombe',
      ville: 'Kinshasa',
      pays: 'RD Congo'
    }
  })

  logger.info({ administrateur_rdc: env.SEED_ADMIN_RDC_EMAIL, administrateur_chine: env.SEED_ADMIN_CHINE_EMAIL, client: env.SEED_CLIENT_EMAIL }, 'seed_termine')
}

principal()
  .catch((erreur: unknown) => {
    logger.error({ err: erreur }, 'echec_seed')
    process.exitCode = 1
  })
  .finally(() => {
    void prisma.$disconnect()
  })
