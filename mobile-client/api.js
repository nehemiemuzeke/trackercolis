import axios from 'axios'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { stockageDurable } from './stockageDurable'

function resoudreUrlApi() {
  const urlConfiguree = Constants.expoConfig?.extra?.apiUrl
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const hote = window.location.hostname
    if (/^(\d+)-(.+)\.e2b\.app$/.test(hote)) {
      return window.location.origin
    }
    if (hote === 'localhost' || hote === '127.0.0.1') {
      return `${window.location.protocol}//${hote}:3000`
    }
    if (urlConfiguree && !urlConfiguree.includes('localhost')) {
      return urlConfiguree
    }
  }
  return urlConfiguree ?? 'http://localhost:3000'
}

// Modifiez cette IP si votre serveur backend change d'adresse IP locale ou URL de production
export const URL_API = 'http://192.168.1.36:3000'

const CLE_JETON_ACCES = 'colis_rdc.jeton_acces'
const CLE_JETON_RAFRAICHISSEMENT = 'colis_rdc.jeton_rafraichissement'
const CLE_UTILISATEUR = 'colis_rdc.utilisateur'

export const TAUX_DEFAUT_CDF = 2800

export const COULEURS = {
  primaire: '#1e40af',
  primaireClair: '#3b82f6',
  fondClair: '#eff6ff',
  fond: '#f1f5f9',
  carte: '#ffffff',
  texte: '#0f172a',
  texteSecondaire: '#64748b',
  succes: '#16a34a',
  alerte: '#d97706',
  danger: '#dc2626',
  bordure: '#e2e8f0',
  accent: '#f59e0b'
}

export const COULEURS_STATUT = {
  COMMANDE_CREEE: '#64748b',
  COMMANDE_VALIDEE_RDC: '#0284c7',
  TRANSMISE_CHINE: '#6366f1',
  ACCEPTEE_CHINE: '#7c3aed',
  COLIS_PREPARE: '#9333ea',
  EXPEDIE_CHINE: '#d97706',
  EN_TRANSIT: '#ea580c',
  ARRIVE_RDC: '#0d9488',
  EN_LIVRAISON: '#16a34a',
  LIVRE: '#15803d'
}

export const LIBELLES_STATUT = {
  COMMANDE_CREEE: 'Commande créée',
  COMMANDE_VALIDEE_RDC: 'Validée RDC',
  TRANSMISE_CHINE: 'Transmise Chine',
  ACCEPTEE_CHINE: 'Acceptée Chine',
  COLIS_PREPARE: 'Colis préparé',
  EXPEDIE_CHINE: 'Expédiée de Chine',
  EN_TRANSIT: 'En transit',
  ARRIVE_RDC: 'Arrivée RDC',
  EN_LIVRAISON: 'En livraison',
  LIVRE: 'Livrée'
}

export const ETAPES_TIMELINE = [
  { numero: 1, statut: 'COMMANDE_CREEE', label: 'Commande créée', lieu: 'Kinshasa' },
  { numero: 2, statut: 'COMMANDE_VALIDEE_RDC', label: 'Validée par la RDC', lieu: 'Kinshasa' },
  { numero: 3, statut: 'TRANSMISE_CHINE', label: 'Transmise en Chine', lieu: 'Digital' },
  { numero: 4, statut: 'ACCEPTEE_CHINE', label: 'Acceptée en Chine', lieu: 'Guangzhou' },
  { numero: 5, statut: 'COLIS_PREPARE', label: 'Colis préparé', lieu: 'Guangzhou' },
  { numero: 6, statut: 'EXPEDIE_CHINE', label: 'Expédié de Chine', lieu: 'Aéroport Baiyun' },
  { numero: 7, statut: 'EN_TRANSIT', label: 'En transit international', lieu: 'Vol international' },
  { numero: 8, statut: 'ARRIVE_RDC', label: 'Arrivé en RDC', lieu: "Aéroport N'djili" },
  { numero: 9, statut: 'EN_LIVRAISON', label: 'En livraison', lieu: 'Kinshasa' },
  { numero: 10, statut: 'LIVRE', label: 'Livré', lieu: 'Adresse client' }
]

export const ROUTE_AERIENNE = [
  { label: 'Guangzhou', latitude: 23.1291, longitude: 113.2644 },
  { label: 'Aéroport Baiyun', latitude: 23.3924, longitude: 113.2988 },
  { label: 'Asie du Sud-Est', latitude: 15.0, longitude: 105.0 },
  { label: 'Océan Indien', latitude: 5.0, longitude: 80.0 },
  { label: "Corne de l'Afrique", latitude: 2.0, longitude: 45.0 },
  { label: "Afrique de l'Est", latitude: -1.0, longitude: 36.0 },
  { label: 'Approche RDC', latitude: -3.0, longitude: 25.0 },
  { label: "Aéroport N'djili", latitude: -4.3858, longitude: 15.4446 },
  { label: 'Kinshasa Centre', latitude: -4.42, longitude: 15.3 },
  { label: 'Adresse client', latitude: -4.4419, longitude: 15.2663 }
]

export const CATEGORIES_PRODUIT = [
  'ELECTRONIQUE',
  'VETEMENTS',
  'ACCESSOIRES',
  'COSMETIQUES',
  'AMEUBLEMENT',
  'PIECES_AUTO',
  'ALIMENTATION',
  'AUTRE'
]

export const LIBELLES_CATEGORIE = {
  ELECTRONIQUE: 'Électronique',
  VETEMENTS: 'Vêtements',
  ACCESSOIRES: 'Accessoires',
  COSMETIQUES: 'Cosmétiques',
  AMEUBLEMENT: 'Ameublement',
  PIECES_AUTO: 'Pièces auto',
  ALIMENTATION: 'Alimentation',
  AUTRE: 'Autre'
}

export function libellerStatut(statut) {
  return LIBELLES_STATUT[statut] ?? statut
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function formaterDate(valeur) {
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const jour = String(date.getDate()).padStart(2, '0')
  const heures = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${jour} ${MOIS[date.getMonth()]} ${date.getFullYear()} à ${heures}:${minutes}`
}

export function formaterCDF(montantUSD, taux = TAUX_DEFAUT_CDF) {
  if (!montantUSD || isNaN(montantUSD)) return '0 FC'
  return `${Math.round(Number(montantUSD) * taux).toLocaleString('fr-FR')} FC`
}

export function extraireMessageErreur(erreur) {
  return (
    erreur?.response?.data?.erreur?.message ??
    erreur?.message ??
    'Une erreur est survenue, veuillez réessayer'
  )
}

const instance = axios.create({
  baseURL: URL_API,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

let jetonAccesCourant = null
let promesseRafraichissement = null
let gestionnaireSessionExpiree = null

export function definirJetonAcces(jeton) {
  jetonAccesCourant = jeton
}

export function definirGestionnaireSessionExpiree(gestionnaire) {
  gestionnaireSessionExpiree = gestionnaire
}

export const stockageSession = {
  async enregistrerJetons(jetonAcces, jetonRafraichissement) {
    jetonAccesCourant = jetonAcces
    await stockageDurable.ecrire(CLE_JETON_ACCES, jetonAcces)
    await stockageDurable.ecrire(CLE_JETON_RAFRAICHISSEMENT, jetonRafraichissement)
  },
  async enregistrerUtilisateur(utilisateur) {
    await stockageDurable.ecrire(CLE_UTILISATEUR, JSON.stringify(utilisateur))
  },
  async lire() {
    const [jetonAcces, jetonRafraichissement, utilisateurBrut] = await Promise.all([
      stockageDurable.lire(CLE_JETON_ACCES),
      stockageDurable.lire(CLE_JETON_RAFRAICHISSEMENT),
      stockageDurable.lire(CLE_UTILISATEUR)
    ])
    let utilisateur = null
    if (utilisateurBrut) {
      try {
        utilisateur = JSON.parse(utilisateurBrut)
      } catch {
        utilisateur = null
      }
    }
    if (jetonAcces) {
      jetonAccesCourant = jetonAcces
    }
    return { jetonAcces, jetonRafraichissement, utilisateur }
  },
  async effacer() {
    jetonAccesCourant = null
    await stockageDurable.supprimer(CLE_JETON_ACCES)
    await stockageDurable.supprimer(CLE_JETON_RAFRAICHISSEMENT)
    await stockageDurable.supprimer(CLE_UTILISATEUR)
  }
}

async function rafraichirJetons() {
  if (!promesseRafraichissement) {
    promesseRafraichissement = (async () => {
      const jetonRafraichissement = await stockageDurable.lire(CLE_JETON_RAFRAICHISSEMENT)
      if (!jetonRafraichissement) {
        throw new Error('Session expirée')
      }
      const reponse = await axios.post(`${URL_API}/api/auth/refresh`, {
        jeton_rafraichissement: jetonRafraichissement
      })
      await stockageSession.enregistrerJetons(reponse.data.jeton_acces, reponse.data.jeton_rafraichissement)
      return reponse.data.jeton_acces
    })().finally(() => {
      promesseRafraichissement = null
    })
  }
  return promesseRafraichissement
}

instance.interceptors.request.use((configuration) => {
  if (jetonAccesCourant) {
    configuration.headers.Authorization = `Bearer ${jetonAccesCourant}`
  }
  return configuration
})

instance.interceptors.response.use(
  (reponse) => reponse,
  async (erreur) => {
    const requeteOriginale = erreur.config
    const statut = erreur.response?.status
    const estAppelAuth = requeteOriginale?.url?.includes('/api/auth/')
    if (statut === 401 && requeteOriginale && !requeteOriginale.dejaReessayee && !estAppelAuth) {
      requeteOriginale.dejaReessayee = true
      try {
        const nouveauJeton = await rafraichirJetons()
        requeteOriginale.headers.Authorization = `Bearer ${nouveauJeton}`
        return instance(requeteOriginale)
      } catch (erreurRafraichissement) {
        await stockageSession.effacer()
        if (gestionnaireSessionExpiree) {
          gestionnaireSessionExpiree()
        }
        return Promise.reject(erreurRafraichissement)
      }
    }
    return Promise.reject(erreur)
  }
)

export const api = {
  connexion(donnees) {
    return instance.post('/api/auth/login', donnees).then((r) => r.data)
  },
  inscription(donnees) {
    return instance.post('/api/auth/register', donnees).then((r) => r.data)
  },
  profil() {
    return instance.get('/api/auth/profile').then((r) => r.data.donnees)
  },
  mettreAJourTokenFcm(fcmToken) {
    return instance.put('/api/auth/fcm-token', { fcm_token: fcmToken })
  },
  listerCommandes(params) {
    return instance.get('/api/commandes', { params }).then((r) => r.data)
  },
  creerCommande(donnees) {
    return instance.post('/api/commandes', donnees).then((r) => r.data.donnees)
  },
  detailsCommande(commandeId) {
    return instance.get(`/api/commandes/${commandeId}`).then((r) => r.data.donnees)
  },
  supprimerCommande(commandeId) {
    return instance.delete(`/api/commandes/${commandeId}`)
  },
  suivreParCode(code) {
    return instance.get(`/api/commandes/tracking/${encodeURIComponent(code)}`).then((r) => r.data.donnees)
  },
  listerSuivi(commandeId) {
    return instance.get(`/api/suivi/${commandeId}`).then((r) => r.data)
  },
  listerNotifications(params) {
    return instance.get('/api/notifications', { params }).then((r) => r.data)
  },
  marquerNotificationLue(notificationId) {
    return instance.put(`/api/notifications/${notificationId}/lu`).then((r) => r.data.donnees)
  },
  marquerToutesNotificationsLues() {
    return instance.put('/api/notifications/lire-tout').then((r) => r.data.donnees)
  },
  listerMessages(commandeId, params) {
    return instance.get(`/api/messages/${commandeId}`, { params }).then((r) => r.data)
  },
  envoyerMessage(commandeId, donnees) {
    return instance.post(`/api/messages/${commandeId}`, donnees).then((r) => r.data.donnees)
  },

  // =====================================================
  // PRODUITS & BOUTIQUE
  // =====================================================
  listerProduits(params) {
    return instance.get('/api/produits', { params }).then((r) => r.data)
  },
  obtenirProduit(id) {
    return instance.get(`/api/produits/${id}`).then((r) => r.data.donnees)
  },
  detailsProduit(id) {
    return instance.get(`/api/produits/${id}`).then((r) => r.data.donnees)
  }
}

export default api