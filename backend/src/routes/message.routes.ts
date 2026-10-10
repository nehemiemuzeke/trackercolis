import { Router } from 'express'
import { envoyerMessage, listerMessages } from '../controllers/message.controller'
import { authentifier } from '../middlewares/authentifier'
import { limiteurUtilisateur } from '../middlewares/limiteurs'

const routeur = Router()

routeur.use(authentifier)
routeur.get('/:commandeId', listerMessages)
routeur.post('/:commandeId', limiteurUtilisateur, envoyerMessage)

export default routeur
