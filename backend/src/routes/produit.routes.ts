import { Router } from 'express'
import {
  creerProduit,
  listerCategories,
  listerProduits,
  mettreAJourProduit,
  obtenirProduit,
  obtenirStatsProduits,
  supprimerProduit,
  uploaderPhotosProduit
} from '../controllers/produit.controller'
import { authentifier } from '../middlewares/authentifier'
import { protegerRoles } from '../middlewares/proteger-roles'
import { uploaderPhotos } from '../middlewares/upload'

const routeur = Router()

// Routes publiques (Client mobile ou catalogue)
routeur.get('/', listerProduits)
routeur.get('/categories', listerCategories)
routeur.get('/:id', obtenirProduit)

// Routes réservées aux Admins
routeur.use(authentifier, protegerRoles('ADMIN_RDC', 'ADMIN_CHINE'))
routeur.post('/', creerProduit)
routeur.put('/:id', mettreAJourProduit)
routeur.delete('/:id', supprimerProduit)
routeur.post('/:id/photos', uploaderPhotos.array('photos', 5), uploaderPhotosProduit)
routeur.get('/admin/stats', obtenirStatsProduits)

export default routeur