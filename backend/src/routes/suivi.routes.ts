import { Router } from 'express'
import { ajouterEtape, listerSuivi } from '../controllers/suivi.controller'
import { authentifier } from '../middlewares/authentifier'
import { limiteurUtilisateur } from '../middlewares/limiteurs'
import { protegerRoles } from '../middlewares/proteger-roles'

const routeur = Router()

routeur.use(authentifier)
routeur.get('/:commandeId', listerSuivi)
routeur.post('/:commandeId/etape', protegerRoles('ADMIN_RDC', 'ADMIN_CHINE'), limiteurUtilisateur, ajouterEtape)

export default routeur
