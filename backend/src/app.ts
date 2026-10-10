import path from 'path'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { originesCors } from './config/env'
import { contexteRequete, journalAcces } from './middlewares/contexte-requete'
import { gestionnaireErreurs } from './middlewares/gestionnaire-erreurs'
import { limiteurGlobal } from './middlewares/limiteurs'
import { routeIntrouvable } from './middlewares/route-introuvable'
import { configurerRoutes } from './routes'

export function creerApplication(): express.Express {
  const application = express()

  application.disable('x-powered-by')
  application.set('trust proxy', 1)
  application.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  application.use(cors({ origin: originesCors, credentials: true }))
  application.use(compression())
  application.use(express.json({ limit: '10mb' }))
  application.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Service des fichiers médias (images produits)
  application.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

  application.use(contexteRequete)
  application.use(journalAcces)
  application.use('/api', limiteurGlobal, configurerRoutes())
  application.use(routeIntrouvable)
  application.use(gestionnaireErreurs)

  return application
}