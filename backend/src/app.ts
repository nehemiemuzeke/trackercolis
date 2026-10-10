import path from 'path'
import compression from 'compression'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { contexteRequete, journalAcces } from './middlewares/contexte-requete'
import { gestionnaireErreurs } from './middlewares/gestionnaire-erreurs'
import { limiteurGlobal } from './middlewares/limiteurs'
import { routeIntrouvable } from './middlewares/route-introuvable'
import { configurerRoutes } from './routes'

export function creerApplication(): express.Express {
  const application = express()

  application.disable('x-powered-by')
  application.set('trust proxy', 1)

  // Configuration Helmet assouplie pour la production
  application.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false
    })
  )

  // Configuration CORS dynamique (accepte Vercel, Mobile, Localhost avec credentials)
  application.use(
    cors({
      origin: (origin, callback) => {
        // Autorise toutes les origines (Vercel, Mobile, Curl, Localhost)
        callback(null, true)
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    })
  )

  application.use(compression())
  application.use(express.json({ limit: '10mb' }))
  application.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Service des fichiers statiques (photos produits)
  application.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

  application.use(contexteRequete)
  application.use(journalAcces)
  application.use('/api', limiteurGlobal, configurerRoutes())
  application.use(routeIntrouvable)
  application.use(gestionnaireErreurs)

  return application
}