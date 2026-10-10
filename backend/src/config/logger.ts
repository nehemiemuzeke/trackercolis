import pino from 'pino'
import { env } from './env'

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: 'colis-rdc-api', environnement: env.NODE_ENV },
  redact: {
    paths: [
      'req.headers.authorization',
      'mot_de_passe',
      '*.mot_de_passe',
      '*.password',
      '*.fcm_token',
      '*.jeton_acces',
      '*.jeton_rafraichissement',
      '*.refreshToken',
      '*.token'
    ],
    censor: '[protege]'
  },
  ...(env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l', ignore: 'pid,hostname,service,environnement' }
        }
      }
    : {})
})
