import { Router } from 'express'
import {
  accepterCommande,
  expedierColis,
  lancerTransit,
  listerCommandesChine,
  preparerColis
} from '../controllers/admin-chine.controller'
import { authentifier } from '../middlewares/authentifier'
import { protegerRoles } from '../middlewares/proteger-roles'

const routeur = Router()

routeur.use(authentifier, protegerRoles('ADMIN_CHINE'))
routeur.get('/commandes', listerCommandesChine)
routeur.put('/commandes/:id/accepter', accepterCommande)
routeur.put('/commandes/:id/preparer', preparerColis)
routeur.put('/commandes/:id/expedier', expedierColis)
routeur.put('/commandes/:id/transit', lancerTransit)

export default routeur
