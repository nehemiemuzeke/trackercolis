import type { Request, Response } from 'express'
import { schemaCreationProduit, schemaListeProduits, schemaMiseAJourProduit } from '../dto/produit.dto'
import type { DemandeAuthentifiee } from '../middlewares/authentifier'
import { produitService } from '../services/produit.service'
import { asyncHandler } from '../utils/async-handler'
import { valider } from '../utils/validation'

export const listerProduits = asyncHandler(async (requete: Request, reponse: Response) => {
  const filtres = valider(schemaListeProduits, requete.query)
  const estAdmin = (requete as any).user?.role === 'ADMIN_RDC' || (requete as any).user?.role === 'ADMIN_CHINE'
  const resultat = await produitService.lister({ ...filtres, publicSeulement: !estAdmin })
  reponse.status(200).json(resultat)
})

export const obtenirProduit = asyncHandler(async (requete: Request, reponse: Response) => {
  const produit = await produitService.obtenirParId(requete.params.id, true)
  reponse.status(200).json({ donnees: produit })
})

export const creerProduit = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const donnees = valider(schemaCreationProduit, requete.body)
  const produit = await produitService.creer(requete.user.id, donnees as any)
  reponse.status(201).json({ donnees: produit })
})

export const mettreAJourProduit = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const donnees = valider(schemaMiseAJourProduit, requete.body)
  const produit = await produitService.mettreAJour(requete.params.id, donnees as any)
  reponse.status(200).json({ donnees: produit })
})

export const supprimerProduit = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  await produitService.supprimer(requete.params.id)
  reponse.status(204).send()
})

export const uploaderPhotosProduit = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const fichiers = requete.files as Express.Multer.File[]
  if (!fichiers || fichiers.length === 0) {
    reponse.status(400).json({ erreur: { message: 'Aucun fichier transmis' } })
    return
  }
  const urls = fichiers.map((f) => `/uploads/produits/${f.filename}`)
  const produit = await produitService.ajouterImages(requete.params.id, urls)
  reponse.status(200).json({ donnees: produit, urls })
})

export const listerCategories = asyncHandler(async (_requete: Request, reponse: Response) => {
  const categories = await produitService.listerCategories()
  reponse.status(200).json({ donnees: categories })
})

export const obtenirStatsProduits = asyncHandler(async (_requete: Request, reponse: Response) => {
  const stats = await produitService.statsProduits()
  reponse.status(200).json({ donnees: stats })
})