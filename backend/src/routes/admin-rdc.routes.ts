import { Router } from 'express'
import {
  confirmerArriveeRdc,
  confirmerLivraison,
  lancerLivraison,
  listerCommandesRdc,
  transmettreCommande,
  validerCommande
} from '../controllers/admin-rdc.controller'
import { authentifier } from '../middlewares/authentifier'
import { protegerRoles } from '../middlewares/proteger-roles'

const routeur = Router()

routeur.use(authentifier, protegerRoles('ADMIN_RDC'))
routeur.get('/commandes', listerCommandesRdc)
routeur.put('/commandes/:id/valider', validerCommande)
routeur.put('/commandes/:id/transmettre', transmettreCommande)
routeur.put('/commandes/:id/arrivee', confirmerArriveeRdc)
routeur.put('/commandes/:id/livraison', lancerLivraison)
routeur.put('/commandes/:id/livrer', confirmerLivraison)

export default routeur
