import http from 'node:http'
import { creerApplication } from './app'
import { env } from './config/env'
import { logger } from './config/logger'
import { prisma } from './config/prisma'
import { obtenirIo } from './realtime/io'
import { initialiserSocketIo } from './realtime/socket'
import { serviceSimulation } from './services/simulation.service'

function demarrer(): void {
  const application = creerApplication()
  const serveur = http.createServer(application)
  initialiserSocketIo(serveur)

  serveur.listen(env.PORT, '0.0.0.0', () => {
    logger.info({ port: env.PORT, environnement: env.NODE_ENV }, 'serveur_demarre')
    serviceSimulation.demarrer()
  })

  let arretEnCours = false

  async function arreter(signal: string): Promise<void> {
    if (arretEnCours) {
      return
    }
    arretEnCours = true
    logger.info({ signal }, 'arret_propre_declenche')
    const minuteurForce = setTimeout(() => process.exit(1), 10000)
    minuteurForce.unref()
    serviceSimulation.arreter()
    obtenirIo()?.close()
    serveur.close(() => {
      void prisma.$disconnect().finally(() => {
        clearTimeout(minuteurForce)
        process.exit(0)
      })
    })
  }

  process.on('SIGTERM', () => {
    void arreter('SIGTERM')
  })
  process.on('SIGINT', () => {
    void arreter('SIGINT')
  })
  process.on('unhandledRejection', (raison: unknown) => {
    logger.error({ err: raison }, 'rejet_de_promise_non_gere')
  })
  process.on('uncaughtException', (erreur: Error) => {
    logger.error({ err: erreur }, 'exception_non_capturee')
    void arreter('uncaughtException')
  })
}

demarrer()
