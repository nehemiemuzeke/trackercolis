import { Router } from 'express'
import { connecter, inscrire, mettreAJourTokenFcm, obtenirProfil, rafraichir } from '../controllers/auth.controller'
import { authentifier } from '../middlewares/authentifier'
import { limiteurAuth, limiteurUtilisateur } from '../middlewares/limiteurs'

const routeur = Router()

routeur.post('/register', limiteurAuth, inscrire)
routeur.post('/login', limiteurAuth, connecter)
routeur.post('/refresh', limiteurAuth, rafraichir)
routeur.get('/profile', authentifier, obtenirProfil)
routeur.put('/fcm-token', authentifier, limiteurUtilisateur, mettreAJourTokenFcm)

export default routeur
