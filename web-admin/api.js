import axios from 'axios'
import { io } from 'socket.io-client'

export const URL_API = import.meta.env.VITE_API_URL || 'https://trackercolis-backend.onrender.com'

const CLE_JETON_ACCES = 'colis_rdc.jeton_acces'
const CLE_JETON_RAFRAICHISSEMENT = 'colis_rdc.jeton_rafraichissement'
const CLE_UTILISATEUR = 'colis_rdc.utilisateur'

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

export const LIBELLES_TYPE_NOTIFICATION = {
  STATUT_CHANGE: 'Statut',
  NOUVELLE_COMMANDE: 'Nouvelle commande',
  MESSAGE: 'Message',
  ALERTE: 'Alerte'
}

export function libellerStatut(statut) {
  return LIBELLES_STATUT[statut] ?? statut
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function formaterDate(valeur, avecHeure = true) {
  const date = new Date(valeur)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const jour = String(date.getDate()).padStart(2, '0')
  const base = `${jour} ${MOIS[date.getMonth()]} ${date.getFullYear()}`
  if (!avecHeure) {
    return base
  }
  return `${base} à ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function extraireMessageErreur(erreur) {
  return (
    erreur?.response?.data?.erreur?.message ??
    erreur?.message ??
    'Une erreur est survenue, veuillez réessayer'
  )
}

export const stockageSession = {
  enregistrerJetons(jetonAcces, jetonRafraichissement) {
    localStorage.setItem(CLE_JETON_ACCES, jetonAcces)
    localStorage.setItem(CLE_JETON_RAFRAICHISSEMENT, jetonRafraichissement)
  },
  enregistrerUtilisateur(utilisateur) {
    localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(utilisateur))
  },
  lireJetonAcces() {
    return localStorage.getItem(CLE_JETON_ACCES)
  },
  lireJetonRafraichissement() {
    return localStorage.getItem(CLE_JETON_RAFRAICHISSEMENT)
  },
  lireUtilisateur() {
    const brut = localStorage.getItem(CLE_UTILISATEUR)
    if (!brut) {
      return null
    }
    try {
      return JSON.parse(brut)
    } catch {
      return null
    }
  },
  effacer() {
    localStorage.removeItem(CLE_JETON_ACCES)
    localStorage.removeItem(CLE_JETON_RAFRAICHISSEMENT)
    localStorage.removeItem(CLE_UTILISATEUR)
  }
}

export function definirJetonAcces(jeton) {
  if (jeton) {
    axios.defaults.headers.common.Authorization = `Bearer ${jeton}`
  } else {
    delete axios.defaults.headers.common.Authorization
  }
}

const instance = axios.create({
  baseURL: URL_API,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json' }
})

let promesseRafraichissement = null
let gestionnaireSessionExpiree = null

export function definirGestionnaireSessionExpiree(gestionnaire) {
  gestionnaireSessionExpiree = gestionnaire
}

async function rafraichirJetons() {
  if (!promesseRafraichissement) {
    promesseRafraichissement = (async () => {
      const jetonRafraichissement = stockageSession.lireJetonRafraichissement()
      if (!jetonRafraichissement) {
        throw new Error('Session expirée')
      }
      const reponse = await axios.post(`${URL_API}/api/auth/refresh`, {
        jeton_rafraichissement: jetonRafraichissement
      })
      stockageSession.enregistrerJetons(reponse.data.jeton_acces, reponse.data.jeton_rafraichissement)
      definirJetonAcces(reponse.data.jeton_acces)
      return reponse.data.jeton_acces
    })().finally(() => {
      promesseRafraichissement = null
    })
  }
  return promesseRafraichissement
}

instance.interceptors.request.use((configuration) => {
  const jeton = stockageSession.lireJetonAcces()
  if (jeton) {
    configuration.headers.Authorization = `Bearer ${jeton}`
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
        stockageSession.effacer()
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
  profil() {
    return instance.get('/api/auth/profile').then((r) => r.data.donnees)
  },
  obtenirStatistiques() {
    return instance.get('/api/dashboard/stats').then((r) => r.data.donnees)
  },
  listerCommandesRecentes(params) {
    return instance.get('/api/dashboard/commandes/recentes', { params }).then((r) => r.data.donnees)
  },
  listerSuivi(commandeId) {
    return instance.get(`/api/suivi/${commandeId}`).then((r) => r.data)
  },
  listerMessages(commandeId, params) {
    return instance.get(`/api/messages/${commandeId}`, { params }).then((r) => r.data)
  },
  envoyerMessage(commandeId, donnees) {
    return instance.post(`/api/messages/${commandeId}`, donnees).then((r) => r.data.donnees)
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
  modifierCommande(commandeId, donnees) {
    return instance.put(`/api/commandes/${commandeId}`, donnees).then((r) => r.data.donnees)
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
  creerProduit(donnees) {
    return instance.post('/api/produits', donnees).then((r) => r.data.donnees)
  },
  modifierProduit(id, donnees) {
    return instance.put(`/api/produits/${id}`, donnees).then((r) => r.data.donnees)
  },
  supprimerProduit(id) {
    return instance.delete(`/api/produits/${id}`)
  },
  uploaderPhotosProduit(id, formData) {
    return instance.post(`/api/produits/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then((r) => r.data)
  },
  listerCategories() {
    return instance.get('/api/produits/categories').then((r) => r.data.donnees)
  },
  statsProduits() {
    return instance.get('/api/produits/admin/stats').then((r) => r.data.donnees)
  },

  // =====================================================
  // ACTIONS ADMIN RDC
  // =====================================================
  adminRdc: {
    listerCommandes(params) {
      return instance.get('/api/admin-rdc/commandes', { params }).then((r) => r.data)
    },
    validerCommande(commandeId) {
      return instance.put(`/api/admin-rdc/commandes/${commandeId}/valider`).then((r) => r.data.donnees)
    },
    transmettreCommande(commandeId) {
      return instance.put(`/api/admin-rdc/commandes/${commandeId}/transmettre`).then((r) => r.data.donnees)
    },
    confirmerArrivee(commandeId) {
      return instance.put(`/api/admin-rdc/commandes/${commandeId}/arrivee`).then((r) => r.data.donnees)
    },
    lancerLivraison(commandeId) {
      return instance.put(`/api/admin-rdc/commandes/${commandeId}/livraison`).then((r) => r.data.donnees)
    },
    confirmerLivraison(commandeId) {
      return instance.put(`/api/admin-rdc/commandes/${commandeId}/livrer`).then((r) => r.data.donnees)
    }
  },

  // =====================================================
  // ACTIONS ADMIN CHINE
  // =====================================================
  adminChine: {
    listerCommandes(params) {
      return instance.get('/api/admin-chine/commandes', { params }).then((r) => r.data)
    },
    accepterCommande(commandeId) {
      return instance.put(`/api/admin-chine/commandes/${commandeId}/accepter`).then((r) => r.data.donnees)
    },
    preparerColis(commandeId) {
      return instance.put(`/api/admin-chine/commandes/${commandeId}/preparer`).then((r) => r.data.donnees)
    },
    expedierColis(commandeId) {
      return instance.put(`/api/admin-chine/commandes/${commandeId}/expedier`).then((r) => r.data.donnees)
    },
    lancerTransit(commandeId) {
      return instance.put(`/api/admin-chine/commandes/${commandeId}/transit`).then((r) => r.data.donnees)
    }
  }
}

const APPELS_ACTION = {
  valider: api.adminRdc.validerCommande,
  transmettre: api.adminRdc.transmettreCommande,
  accepter: api.adminChine.accepterCommande,
  preparer: api.adminChine.preparerColis,
  expedier: api.adminChine.expedierColis,
  transit: api.adminChine.lancerTransit,
  arrivee: api.adminRdc.confirmerArrivee,
  livraison: api.adminRdc.lancerLivraison,
  livrer: api.adminRdc.confirmerLivraison
}

export function executerActionCommande(action, commandeId) {
  const appel = APPELS_ACTION[action]
  if (!appel) {
    return Promise.reject(new Error(`Action inconnue : ${action}`))
  }
  return appel(commandeId)
}

let socket = null

export function initialiserSocket() {
  const jeton = stockageSession.lireJetonAcces()
  if (!jeton) {
    return null
  }
  if (socket) {
    socket.disconnect()
  }
  socket = io(URL_API, { auth: { jeton }, transports: ['websocket'], reconnection: true })
  return socket
}

export function fermerSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function abonnerEvenement(nom, gestionnaire) {
  if (!socket) {
    return () => undefined
  }
  socket.on(nom, gestionnaire)
  return () => socket.off(nom, gestionnaire)
}

export function rejoindreSalleCommande(commandeId) {
  socket?.emit('join:order', { commande_id: commandeId })
}

export function quitterSalleCommande(commandeId) {
  socket?.emit('leave:order', commandeId)
}

export function reinitialiserSocketAvecJetonCourant() {
  const jeton = stockageSession.lireJetonAcces()
  if (!jeton) {
    fermerSocket()
    return
  }
  if (socket) {
    socket.auth = { jeton }
    socket.disconnect().connect()
  } else {
    initialiserSocket()
  }
}

export default api