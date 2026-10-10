import bcrypt from 'bcryptjs'
import type { User } from '@prisma/client'
import { env } from '../config/env'
import { AccesRefuseError, ConflitError, IntrouvableError, NonAuthentifieError } from '../domain/errors'
import { versReponseUtilisateur, versUtilisateurAuthentifie } from '../dto/reponses'
import type { DonneesConnexion, DonneesInscription } from '../dto/auth.dto'
import { depotUtilisateurs } from '../repositories/user.repository'
import { genererJetonAcces, genererJetonRafraichissement, verifierJetonRafraichissement } from '../utils/jetons'

export interface DependancesServiceAuth {
  depotUtilisateurs: typeof depotUtilisateurs
}

export function creerServiceAuth(dependances: DependancesServiceAuth = { depotUtilisateurs }) {
  function construireJetons(utilisateur: User) {
    const identite = versUtilisateurAuthentifie(utilisateur)
    return {
      jeton_acces: genererJetonAcces(identite),
      jeton_rafraichissement: genererJetonRafraichissement(identite)
    }
  }

  async function inscrire(donnees: DonneesInscription) {
    const existant = await dependances.depotUtilisateurs.trouverParEmail(donnees.email)
    if (existant) {
      throw new ConflitError('Un compte existe déjà avec cet email')
    }
    const empreinte = await bcrypt.hash(donnees.mot_de_passe, env.BCRYPT_SALT_ROUNDS)
    const utilisateur = await dependances.depotUtilisateurs.creer({
      nom: donnees.nom,
      prenom: donnees.prenom,
      email: donnees.email,
      mot_de_passe: empreinte,
      telephone: donnees.telephone,
      role: 'CLIENT',
      adresse: donnees.adresse,
      ville: donnees.ville,
      pays: donnees.pays
    })
    return { utilisateur: versReponseUtilisateur(utilisateur), ...construireJetons(utilisateur) }
  }

  async function connecter(donnees: DonneesConnexion) {
    const utilisateur = await dependances.depotUtilisateurs.trouverParEmail(donnees.email)
    if (!utilisateur) {
      throw new NonAuthentifieError('Email ou mot de passe incorrect')
    }
    const empreinteValide = await bcrypt.compare(donnees.mot_de_passe, utilisateur.mot_de_passe)
    if (!empreinteValide) {
      throw new NonAuthentifieError('Email ou mot de passe incorrect')
    }
    if (!utilisateur.est_actif) {
      throw new AccesRefuseError('Ce compte est désactivé')
    }
    return { utilisateur: versReponseUtilisateur(utilisateur), ...construireJetons(utilisateur) }
  }

  async function rafraichir(jetonRafraichissement: string) {
    const chargeUtile = verifierJetonRafraichissement(jetonRafraichissement)
    const utilisateur = await dependances.depotUtilisateurs.trouverParId(chargeUtile.sub)
    if (!utilisateur || !utilisateur.est_actif) {
      throw new NonAuthentifieError('Session invalide, veuillez vous reconnecter')
    }
    return { utilisateur: versReponseUtilisateur(utilisateur), ...construireJetons(utilisateur) }
  }

  async function obtenirProfil(utilisateurId: string) {
    const utilisateur = await dependances.depotUtilisateurs.trouverParId(utilisateurId)
    if (!utilisateur) {
      throw new IntrouvableError('Utilisateur introuvable')
    }
    return versReponseUtilisateur(utilisateur)
  }

  async function mettreAJourTokenFcm(utilisateurId: string, token: string) {
    const utilisateur = await dependances.depotUtilisateurs.trouverParId(utilisateurId)
    if (!utilisateur) {
      throw new IntrouvableError('Utilisateur introuvable')
    }
    await dependances.depotUtilisateurs.mettreAJour(utilisateurId, { fcm_token: token })
  }

  return { inscrire, connecter, rafraichir, obtenirProfil, mettreAJourTokenFcm }
}

export const authService = creerServiceAuth()
