import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import api, { extraireMessageErreur } from './api.js'
import { useApplication } from './App.jsx'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CLE_SOUVENIR = 'colis_rdc.souvenir_admin'

function lireSouvenir() {
  try {
    const brut = localStorage.getItem(CLE_SOUVENIR)
    if (!brut) return null
    return JSON.parse(brut)
  } catch {
    return null
  }
}

function enregistrerSouvenir(email, motDePasse) {
  localStorage.setItem(CLE_SOUVENIR, JSON.stringify({ email, mot_de_passe: motDePasse }))
}

function effacerSouvenir() {
  localStorage.removeItem(CLE_SOUVENIR)
}

export default function LoginPage() {
  const { utilisateur, seConnecter } = useApplication()
  const navigation = useNavigate()
  const souvenir = lireSouvenir()
  const [email, setEmail] = useState(souvenir?.email ?? '')
  const [motDePasse, setMotDePasse] = useState(souvenir?.mot_de_passe ?? '')
  const [seSouvenir, setSeSouvenir] = useState(Boolean(souvenir))
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)

  useEffect(() => {
    document.title = 'Connexion Admin — Colis RDC'
  }, [])

  if (utilisateur) {
    return <Navigate to="/" replace />
  }

  async function soumettre(evenement) {
    evenement.preventDefault()
    if (!REGEX_EMAIL.test(email) || motDePasse.length === 0) {
      setErreur('Veuillez saisir un email valide et un mot de passe')
      return
    }
    setChargement(true)
    setErreur('')
    try {
      const resultat = await api.connexion({
        email: email.trim().toLowerCase(),
        mot_de_passe: motDePasse
      })
      const role = resultat.utilisateur?.role
      if (role !== 'ADMIN_RDC' && role !== 'ADMIN_CHINE') {
        setErreur('Accès refusé : cette interface est réservée aux administrateurs autorisés.')
        return
      }
      if (!resultat.utilisateur?.est_actif) {
        setErreur('Compte désactivé. Contactez le super-administrateur.')
        return
      }
      if (seSouvenir) {
        enregistrerSouvenir(email.trim().toLowerCase(), motDePasse)
      } else {
        effacerSouvenir()
      }
      seConnecter(resultat.utilisateur, resultat.jeton_acces, resultat.jeton_rafraichissement)
      navigation('/', { replace: true })
    } catch (erreurSurvenue) {
      setErreur(extraireMessageErreur(erreurSurvenue))
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="page-connexion">
      <div className="carte-connexion">
        <div className="logo-connexion" aria-hidden="true">
          <svg viewBox="0 0 64 64" width="56" height="56">
            <rect width="64" height="64" rx="14" fill="var(--couleur-primaire)" />
            <path d="M18 26l14-7 14 7v16l-14 7-14-7z" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
            <path d="M18 26l14 7 14-7M32 33v16" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
          </svg>
        </div>
        <h1>Colis RDC — Administration</h1>
        <p className="sous-titre-connexion">Accès réservé aux administrateurs RDC et Chine</p>
        <form onSubmit={soumettre} noValidate>
          <label className="champ-formulaire">
            <span>Adresse email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin.rdc@collisrdc.cd"
              autoComplete="username"
              autoFocus
              required
            />
          </label>
          <label className="champ-formulaire">
            <span>Mot de passe</span>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="champ-souvenir" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={seSouvenir}
              onChange={(e) => setSeSouvenir(e.target.checked)}
            />
            <span>Se souvenir de moi sur cet appareil</span>
          </label>
          {erreur ? <div className="message-erreur">{erreur}</div> : null}
          <button type="submit" className="bouton bouton-primaire bouton-bloc" disabled={chargement}>
            {chargement ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--couleur-texte-secondaire, #64748b)', textAlign: 'center' }}>
          Les comptes anonymes et clients ne peuvent pas accéder à cette console.
        </p>
      </div>
    </div>
  )
}