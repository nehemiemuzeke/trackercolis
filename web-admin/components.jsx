import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import api, {
  COULEURS_STATUT,
  ETAPES_TIMELINE,
  executerActionCommande,
  extraireMessageErreur,
  formaterDate,
  LIBELLES_TYPE_NOTIFICATION,
  libellerStatut
} from './api.js'
import { useApplication } from './App.jsx'

export function StatusBadge({ statut }) {
  const couleur = COULEURS_STATUT[statut] ?? '#64748b'
  return (
    <span className="badge-statut" style={{ color: couleur, backgroundColor: `${couleur}1f`, borderColor: `${couleur}55` }}>
      {libellerStatut(statut)}
    </span>
  )
}

export function StatsCard({ titre, valeur, libelle, couleur, icone }) {
  return (
    <div className="carte carte-statistique" style={{ borderTopColor: couleur }}>
      <div className="entete-statistique">
        <span className="icone-statistique" style={{ color: couleur }}>
          {icone}
        </span>
        <span className="valeur-statistique" style={{ color: couleur }}>
          {valeur}
        </span>
      </div>
      <p className="titre-statistique">{titre}</p>
      {libelle ? <p className="libelle-statistique">{libelle}</p> : null}
    </div>
  )
}

export function Modal({ ouverte, titre, children, onFermer }) {
  if (!ouverte) {
    return null
  }
  return (
    <div
      className="fond-modal"
      role="dialog"
      aria-modal="true"
      onClick={onFermer}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        className="boite-modal"
        onClick={(evenement) => evenement.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        <div
          className="entete-boite-modal"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{titre}</h3>
          <button
            type="button"
            className="bouton-fermeture"
            onClick={onFermer}
            aria-label="Fermer"
            style={{
              border: 'none',
              background: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ×
          </button>
        </div>
        <div
          className="corps-boite-modal"
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export function ActionButton({ action, libelle, commandeId, onSucces, variante = 'primaire' }) {
  const [confirmationOuverte, setConfirmationOuverte] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState('')

  async function confirmer() {
    setChargement(true)
    setErreur('')
    try {
      await executerActionCommande(action, commandeId)
      setConfirmationOuverte(false)
      if (onSucces) {
        onSucces()
      }
    } catch (erreurSurvenue) {
      setErreur(extraireMessageErreur(erreurSurvenue))
    } finally {
      setChargement(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className={`bouton bouton-${variante} bouton-petit`}
        onClick={() => setConfirmationOuverte(true)}
      >
        {libelle}
      </button>
      <Modal ouverte={confirmationOuverte} titre="Confirmer l'action" onFermer={() => setConfirmationOuverte(false)}>
        <p className="texte-confirmation">Voulez-vous vraiment effectuer cette action ?</p>
        <p className="texte-confirmation-libelle">« {libelle} »</p>
        {erreur ? <div className="message-erreur">{erreur}</div> : null}
        <div className="actions-modal">
          <button type="button" className="bouton bouton-secondaire" onClick={() => setConfirmationOuverte(false)} disabled={chargement}>
            Annuler
          </button>
          <button type="button" className="bouton bouton-primaire" onClick={confirmer} disabled={chargement}>
            {chargement ? 'Traitement...' : 'Confirmer'}
          </button>
        </div>
      </Modal>
    </>
  )
}

export function DataTable({ colonnes, donnees, cleRangée, chargement, vide = 'Aucune donnée', pagination, onTri }) {
  const [triCourant, setTriCourant] = useState({ cle: null, direction: 'asc' })

  const donneesTriees = useMemo(() => {
    if (!triCourant.cle) {
      return donnees
    }
    const copie = [...donnees]
    copie.sort((a, b) => {
      const valeurA = a[triCourant.cle]
      const valeurB = b[triCourant.cle]
      if (valeurA === valeurB) {
        return 0
      }
      const comparaison = valeurA > valeurB ? 1 : -1
      return triCourant.direction === 'asc' ? comparaison : -comparaison
    })
    return copie
  }, [donnees, triCourant])

  function basculerTri(colonne) {
    if (!colonne.triable || !onTri) {
      return
    }
    setTriCourant((precedent) => ({
      cle: colonne.cle,
      direction: precedent.cle === colonne.cle && precedent.direction === 'asc' ? 'desc' : 'asc'
    }))
    onTri({ cle: colonne.cle, direction: triCourant.cle === colonne.cle && triCourant.direction === 'asc' ? 'desc' : 'asc' })
  }

  return (
    <div className="conteneur-tableau">
      <table className="tableau-donnees">
        <thead>
          <tr>
            {colonnes.map((colonne) => (
              <th
                key={colonne.cle}
                className={colonne.triable ? 'colonne-triable' : undefined}
                onClick={() => basculerTri(colonne)}
              >
                {colonne.libelle}
                {triCourant.cle === colonne.cle ? (
                  <span className="indicateur-tri">{triCourant.direction === 'asc' ? ' ▲' : ' ▼'}</span>
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chargement ? (
            <tr>
              <td colSpan={colonnes.length}>
                <div className="chargement-tableau">
                  <div className="spinner spinner-petit" />
                  Chargement...
                </div>
              </td>
            </tr>
          ) : donneesTriees.length === 0 ? (
            <tr>
              <td colSpan={colonnes.length} className="tableau-vide">
                {vide}
              </td>
            </tr>
          ) : (
            donneesTriees.map((rangée) => (
              <tr key={rangée[cleRangée]}>
                {colonnes.map((colonne) => (
                  <td key={colonne.cle}>{colonne.rendu ? colonne.rendu(rangée) : rangée[colonne.cle]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pagination && pagination.total_pages > 1 ? (
        <div className="pied-pagination">
          <span className="informations-pagination">
            Page {pagination.page} sur {pagination.total_pages} · {pagination.total} commande(s)
          </span>
          <div className="boutons-pagination">
            <button
              type="button"
              className="bouton bouton-secondaire bouton-petit"
              disabled={pagination.page <= 1}
              onClick={() => pagination.changerPage(pagination.page - 1)}
            >
              Précédent
            </button>
            <button
              type="button"
              className="bouton bouton-secondaire bouton-petit"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => pagination.changerPage(pagination.page + 1)}
            >
              Suivant
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function TrackingTimeline({ suivi, etapeActuelle }) {
  const premiereOccurrence = useMemo(() => {
    const occurrences = {}
    for (const point of suivi) {
      if (!occurrences[point.numero_etape]) {
        occurrences[point.numero_etape] = point
      }
    }
    return occurrences
  }, [suivi])

  return (
    <ol className="chronologie">
      {ETAPES_TIMELINE.map((etape) => {
        const point = premiereOccurrence[etape.numero]
        const realisee = Boolean(point)
        const actuelle = etape.numero === etapeActuelle
        const couleur = COULEURS_STATUT[etape.statut]
        return (
          <li
            key={etape.numero}
            className={`element-chronologie ${realisee ? 'realisee' : ''} ${actuelle ? 'actuelle' : ''}`}
          >
            <span className="pastille-chronologie" style={realisee ? { backgroundColor: couleur, borderColor: couleur } : undefined}>
              {etape.numero}
            </span>
            <div className="contenu-chronologie">
              <div className="entete-chronologie">
                <span className="libelle-chronologie">{etape.label}</span>
                {actuelle ? <span className="etiquette-courante">En cours</span> : null}
              </div>
              <span className="lieu-chronologie">{point ? point.lieu : etape.lieu}</span>
              {point ? <span className="date-chronologie">{formaterDate(point.cree_le)}</span> : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function NotificationDropdown() {
  const { totalNonLues, setTotalNonLues, rafraichirCompteurNotifications } = useApplication()
  const navigation = useNavigate()
  const [ouverte, setOuverte] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [chargement, setChargement] = useState(false)
  const conteneurRef = useRef(null)

  useEffect(() => {
    function fermerAuClicExterieur(evenement) {
      if (conteneurRef.current && !conteneurRef.current.contains(evenement.target)) {
        setOuverte(false)
      }
    }
    document.addEventListener('mousedown', fermerAuClicExterieur)
    return () => document.removeEventListener('mousedown', fermerAuClicExterieur)
  }, [])

  async function ouvrir() {
    setOuverte((precedent) => !precedent)
    if (!ouverte) {
      setChargement(true)
      try {
        const resultat = await api.listerNotifications({ page: 1, limit: 8 })
        setNotifications(resultat.donnees)
      } catch {
        setNotifications([])
      } finally {
        setChargement(false)
      }
    }
  }

  async function cliquerNotification(notification) {
    try {
      if (!notification.est_lu) {
        await api.marquerNotificationLue(notification.id)
        setNotifications((precedentes) =>
          precedentes.map((element) => (element.id === notification.id ? { ...element, est_lu: true } : element))
        )
        setTotalNonLues((precedent) => Math.max(0, precedent - 1))
      }
      if (notification.commande_id) {
        setOuverte(false)
        navigation(`/commandes/${notification.commande_id}`)
      }
    } catch {
      return
    }
  }

  async function toutMarquer() {
    try {
      await api.marquerToutesNotificationsLues()
      setNotifications((precedentes) => precedentes.map((element) => ({ ...element, est_lu: true })))
      setTotalNonLues(0)
    } catch {
      return
    }
  }

  return (
    <div className="conteneur-notifications" ref={conteneurRef}>
      <button type="button" className="bouton-cloche" onClick={ouvrir} aria-label="Notifications">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 01-3.4 0" />
        </svg>
        {totalNonLues > 0 ? <span className="compteur-cloche">{totalNonLues > 99 ? '99+' : totalNonLues}</span> : null}
      </button>
      {ouverte ? (
        <div className="panneau-notifications">
          <div className="entete-panneau-notifications">
            <span>Notifications</span>
            {totalNonLues > 0 ? (
              <button type="button" className="lien-action" onClick={toutMarquer}>
                Tout marquer lu
              </button>
            ) : null}
          </div>
          <div className="liste-panneau-notifications">
            {chargement ? (
              <div className="chargement-tableau">
                <div className="spinner spinner-petit" />
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <p className="panneau-vide">Aucune notification</p>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`element-notification ${notification.est_lu ? '' : 'non-lue'}`}
                  onClick={() => cliquerNotification(notification)}
                >
                  <span className="barre-type-notification" style={{ backgroundColor: couleurTypeNotification(notification.type) }} />
                  <span className="corps-element-notification">
                    <span className="titre-element-notification">{notification.titre}</span>
                    <span className="message-element-notification">{notification.message}</span>
                    <span className="date-element-notification">
                      {LIBELLES_TYPE_NOTIFICATION[notification.type] ?? notification.type} · {formaterDate(notification.cree_le)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function couleurTypeNotification(type) {
  const couleurs = {
    STATUT_CHANGE: 'var(--couleur-primaire)',
    NOUVELLE_COMMANDE: '#7c3aed',
    MESSAGE: '#0d9488',
    ALERTE: 'var(--couleur-alerte)'
  }
  return couleurs[type] ?? 'var(--couleur-primaire)'
}

export function Header() {
  const { utilisateur, seDeconnecter } = useApplication()
  return (
    <header className="entete-application">
      <div className="titre-entete">
        <h2>Administration logistique</h2>
      </div>
      <div className="actions-entete">
        <NotificationDropdown />
        <div className="profil-entete">
          <div className="avatar-entete">
            {utilisateur?.prenom?.[0]}
            {utilisateur?.nom?.[0]}
          </div>
          <div className="informations-profil-entete">
            <span className="nom-profil-entete">
              {utilisateur?.prenom} {utilisateur?.nom}
            </span>
            <span className="role-profil-entete">{libellerRole(utilisateur?.role)}</span>
          </div>
        </div>
        <button type="button" className="bouton bouton-secondaire bouton-petit" onClick={seDeconnecter}>
          Déconnexion
        </button>
      </div>
    </header>
  )
}

export function libellerRole(role) {
  if (role === 'ADMIN_RDC') {
    return 'Administrateur RDC'
  }
  if (role === 'ADMIN_CHINE') {
    return 'Administrateur Chine'
  }
  return role ?? ''
}

export function Sidebar() {
  const [repliee, setRepliee] = useState(false)
  return (
    <aside className={`barre-laterale ${repliee ? 'repliee' : ''}`}>
      <div className="entete-barre-laterale">
        <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
          <rect width="64" height="64" rx="14" fill="var(--couleur-primaire)" />
          <path d="M18 26l14-7 14 7v16l-14 7-14-7z" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
          <path d="M18 26l14 7 14-7M32 33v16" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
        </svg>
        {!repliee ? <span className="nom-application">Colis RDC</span> : null}
      </div>
      <nav className="navigation-laterale">
        <NavLink to="/" end className={({ isActive }) => `lien-navigation ${isActive ? 'actif' : ''}`} title="Tableau de bord">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          {!repliee ? <span>Tableau de bord</span> : null}
        </NavLink>
        <NavLink to="/commandes" className={({ isActive }) => `lien-navigation ${isActive ? 'actif' : ''}`} title="Commandes">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
            <path d="M3 8l9 5 9-5M12 13v8" />
          </svg>
          {!repliee ? <span>Commandes</span> : null}
        </NavLink>
        <NavLink to="/produits" className={({ isActive }) => `lien-navigation ${isActive ? 'actif' : ''}`} title="Produits & Boutique">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          {!repliee ? <span>Produits & Boutique</span> : null}
        </NavLink>
      </nav>
      <button
        type="button"
        className="bouton-replier"
        onClick={() => setRepliee((precedent) => !precedent)}
        aria-label="Replier la barre latérale"
      >
        {repliee ? '»' : '«'}
      </button>
    </aside>
  )
}