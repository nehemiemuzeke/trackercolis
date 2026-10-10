import 'dotenv/config'
import { z } from 'zod'

const booleenStricte = z
  .enum(['true', 'false'])
  .transform((valeur) => valeur === 'true')

const schemaEnvironnement = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES: z.string().min(1).default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(12).max(15).default(12),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(20),
  USER_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(60),
  SERVICE_FEE_BASE_USD: z.coerce.number().min(0).default(10),
  SERVICE_FEE_PER_KG_USD: z.coerce.number().min(0).default(2.5),
  DELIVERY_FEE_BASE_USD: z.coerce.number().min(0).default(5),
  DELIVERY_FEE_PER_KG_USD: z.coerce.number().min(0).default(1.5),
  ESTIMATED_DELIVERY_DAYS: z.coerce.number().int().min(1).default(21),
  FCM_SERVICE_ACCOUNT_JSON: z.string().default(''),
  SIMULATION_ENABLED: booleenStricte.default('true'),
  SIMULATION_INTERVAL_MS: z.coerce.number().int().min(5000).default(30000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SEED_ADMIN_RDC_EMAIL: z.string().email().default('admin.rdc@collisrdc.cd'),
  SEED_ADMIN_RDC_PASSWORD: z.string().min(8).default('AdminRdc!2024'),
  SEED_ADMIN_CHINE_EMAIL: z.string().email().default('admin.chine@collisrdc.cd'),
  SEED_ADMIN_CHINE_PASSWORD: z.string().min(8).default('AdminChine!2024'),
  SEED_CLIENT_EMAIL: z.string().email().default('client.test@collisrdc.cd'),
  SEED_CLIENT_PASSWORD: z.string().min(8).default('Client!2024')
})

const resultat = schemaEnvironnement.safeParse(process.env)

if (!resultat.success) {
  process.stderr.write(
    JSON.stringify({
      niveau: 'fatal',
      message: 'variables_d_environnement_invalides',
      details: resultat.error.issues.map((anomalie) => ({
        champ: anomalie.path.join('.'),
        message: anomalie.message
      }))
    }) + '\n'
  )
  process.exit(1)
}

export const env = resultat.data

export const originesCors: string[] = env.CORS_ORIGINS.split(',')
  .map((origine) => origine.trim())
  .filter((origine) => origine.length > 0)
