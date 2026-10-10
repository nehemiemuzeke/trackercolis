import { Router } from 'express'
import routeurAdminChine from './admin-chine.routes'
import routeurAdminRdc from './admin-rdc.routes'
import routeurAuth from './auth.routes'
import routeurCommandes from './commande.routes'
import routeurDashboard from './dashboard.routes'
import routeurSante from './health.routes'
import routeurMessages from './message.routes'
import routeurNotifications from './notification.routes'
import routeurProduits from './produit.routes'
import routeurSuivi from './suivi.routes'

export function configurerRoutes(): Router {
  const routeur = Router()
  routeur.use('/auth', routeurAuth)
  routeur.use('/commandes', routeurCommandes)
  routeur.use('/produits', routeurProduits)
  routeur.use('/suivi', routeurSuivi)
  routeur.use('/admin-rdc', routeurAdminRdc)
  routeur.use('/admin-chine', routeurAdminChine)
  routeur.use('/notifications', routeurNotifications)
  routeur.use('/messages', routeurMessages)
  routeur.use('/dashboard', routeurDashboard)
  routeur.use('/health', routeurSante)
  return routeur
}