import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import api, {
  abonnerEvenement,
  definirGestionnaireSessionExpiree,
  fermerSocket,
  initialiserSocket,
  stockageSession
} from './api.js'
import LoginPage from './LoginPage.jsx'
import Dashboard from './Dashboard.jsx'
import CommandesPage from './CommandesPage.jsx'
import DetailCommande from './DetailCommande.jsx'
import ProduitsPage from './ProduitsPage.jsx'
import { Header, Sidebar } from './components.jsx'

const ContexteApplication = createContext(null)

export function useApplication() {
  return useContext(ContexteApplication)
}

function RouteProtegee() {
  const { utilisateur, chargementSession } = useApplication()
  const localisation = useLocation()
  if (chargementSession) {
    return (
      <div className="plein-ecran-chargement">
        <div className="spinner" />
        <p>Chargement de la session...</p>
      </div>
    )
  }
  if (!utilisateur) {
    return <Navigate to="/connexion" replace state={{ origine: localisation.pathname }} />
  }
  return <Outlet />
}

function LayoutAdministration() {
  return (
    <div className="disposition-application">
      <Sidebar />
      <div className="zone-principale">
        <Header />
        <main className="contenu-principal">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [utilisateur, setUtilisateur] = useState(null)
  const [chargementSession, setChargementSession] = useState(true)
  const [totalNonLues, setTotalNonLues] = useState(0)

  const seConnecter = useCallback((nouvelUtilisateur, jetonAcces, jetonRafraichissement) => {
    stockageSession.enregistrerJetons(jetonAcces, jetonRafraichissement)
    stockageSession.enregistrerUtilisateur(nouvelUtilisateur)
    setUtilisateur(nouvelUtilisateur)
  }, [])

  const seDeconnecter = useCallback(() => {
    fermerSocket()
    stockageSession.effacer()
    setUtilisateur(null)
    setTotalNonLues(0)
  }, [])

  const rafraichirCompteurNotifications = useCallback(async () => {
    try {
      const resultat = await api.listerNotifications({ page: 1, limit: 1 })
      setTotalNonLues(resultat.total_non_lues)
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    definirGestionnaireSessionExpiree(() => {
      fermerSocket()
      stockageSession.effacer()
      setUtilisateur(null)
    })
    const sessionUtilisateur = stockageSession.lireUtilisateur()
    if (sessionUtilisateur && stockageSession.lireJetonAcces()) {
      setUtilisateur(sessionUtilisateur)
      api
        .profil()
        .then((profil) => {
          stockageSession.enregistrerUtilisateur(profil)
          setUtilisateur(profil)
        })
        .catch(() => {
          fermerSocket()
          stockageSession.effacer()
          setUtilisateur(null)
        })
        .finally(() => setChargementSession(false))
    } else {
      setChargementSession(false)
    }
  }, [])

  useEffect(() => {
    if (!utilisateur) {
      fermerSocket()
      return undefined
    }
    initialiserSocket()
    void rafraichirCompteurNotifications()
    const desabonner = abonnerEvenement('notification:new', () => {
      setTotalNonLues((precedent) => precedent + 1)
    })
    return () => {
      desabonner()
      fermerSocket()
    }
  }, [utilisateur, rafraichirCompteurNotifications])

  const valeur = useMemo(
    () => ({
      utilisateur,
      chargementSession,
      totalNonLues,
      setTotalNonLues,
      seConnecter,
      seDeconnecter,
      rafraichirCompteurNotifications
    }),
    [utilisateur, chargementSession, totalNonLues, seConnecter, seDeconnecter, rafraichirCompteurNotifications]
  )

  return (
    <ContexteApplication.Provider value={valeur}>
      <Routes>
        <Route path="/connexion" element={<LoginPage />} />
        <Route element={<RouteProtegee />}>
          <Route element={<LayoutAdministration />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/commandes" element={<CommandesPage />} />
            <Route path="/commandes/:id" element={<DetailCommande />} />
            <Route path="/produits" element={<ProduitsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ContexteApplication.Provider>
  )
}