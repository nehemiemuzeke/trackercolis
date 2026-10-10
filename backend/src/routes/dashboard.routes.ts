import { Router } from 'express'
import { listerCommandesRecentes, obtenirStatistiques } from '../controllers/dashboard.controller'
import { authentifier } from '../middlewares/authentifier'
import { protegerRoles } from '../middlewares/proteger-roles'

const routeur = Router()

routeur.use(authentifier, protegerRoles('ADMIN_RDC', 'ADMIN_CHINE'))
routeur.get('/stats', obtenirStatistiques)
routeur.get('/commandes/recentes', listerCommandesRecentes)

export default routeur
