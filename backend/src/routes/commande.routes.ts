import { Router } from 'express'
import {
  creerCommande,
  listerCommandes,
  modifierCommande,
  obtenirCommande,
  obtenirCommandeParCodeSuivi,
  supprimerCommande
} from '../controllers/commande.controller'
import { authentifier } from '../middlewares/authentifier'
import { limiteurUtilisateur } from '../middlewares/limiteurs'

const routeur = Router()

routeur.use(authentifier)
routeur.post('/', limiteurUtilisateur, creerCommande)
routeur.get('/', listerCommandes)
routeur.get('/tracking/:code', obtenirCommandeParCodeSuivi)
routeur.get('/:id', obtenirCommande)
routeur.put('/:id', modifierCommande)
routeur.delete('/:id', supprimerCommande)

export default routeur
