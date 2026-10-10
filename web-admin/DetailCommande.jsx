import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import L from 'leaflet'
import api, {
  abonnerEvenement,
  COULEURS_STATUT,
  extraireMessageErreur,
  formaterDate,
  quitterSalleCommande,
  ROUTE_AERIENNE,
  rejoindreSalleCommande
} from './api.js'
import { useApplication } from './App.jsx'
import { ActionButton, StatusBadge, TrackingTimeline, libellerRole } from './components.jsx'

const LIBELLES_ACTEUR = {
  CLIENT: 'Client',
  ADMIN_RDC: 'Admin RDC',
  ADMIN_CHINE: 'Admin Chine',
  SYSTEME: 'Système'
}

function dernierePositionConnue(suivi) {
  for (let index = suivi.length - 1; index >= 0; index -= 1) {
    const point = suivi[index]
    if (point.latitude !== null && point.longitude !== null) {
      return { latitude: point.latitude, longitude: point.longitude }
    }
  }
  return { latitude: -4.42, longitude: 15.3 }
}

function CarteLeaflet({ suivi }) {
  const conteneurRef = useRef(null)
  const carteRef = useRef(null)
  const calqueRef = useRef(null)

  useEffect(() => {
    if (!conteneurRef.current || carteRef.current) {
      return undefined
    }
    const carte = L.map(conteneurRef.current, { zoomControl: true, attributionControl: false }).setView([10, 70], 3)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 12,
      minZoom: 2
    }).addTo(carte)
    carteRef.current = carte
    calqueRef.current = L.layerGroup().addTo(carte)
    return () => {
      carte.remove()
      carteRef.current = null
      calqueRef.current = null
    }
  }, [])

  useEffect(() => {
    const carte = carteRef.current
    const calque = calqueRef.current
    if (!carte || !calque) {
      return
    }
    calque.clearLayers()

    const pointsRoute = ROUTE_AERIENNE.map((point) => [point.latitude, point.longitude])
    L.polyline(pointsRoute, { color: '#3b82f6', weight: 2.5, dashArray: '6 8', opacity: 0.85 }).addTo(calque)

    for (const point of suivi) {
      if (point.latitude === null || point.longitude === null) {
        continue
      }
      const icone = L.divIcon({
        className: '',
        html: '<div class="marqueur-point-leaflet"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      })
      L.marker([point.latitude, point.longitude], { icon: icone })
        .addTo(calque)
        .bindPopup(
          `<div class="popup-etape"><strong>Etape ${point.numero_etape} — ${point.label}</strong><br/>${point.lieu}<br/>${formaterDate(point.cree_le)}</div>`
        )
    }

    const position = dernierePositionConnue(suivi)
    const iconeActuelle = L.divIcon({
      className: '',
      html: '<div class="marqueur-actuel-leaflet"><span></span></div>',
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    })
    L.marker([position.latitude, position.longitude], { icon: iconeActuelle, zIndexOffset: 1000 })
      .addTo(calque)
      .bindPopup('<div class="popup-etape"><strong>Position actuelle du colis</strong></div>')

    carte.fitBounds(pointsRoute, { padding: [30, 30], maxZoom: 5 })
  }, [suivi])

  return <div ref={conteneurRef} className="carte-leaflet" />
}

function SectionChat({ commandeId, messages, onEnvoyer, envoiEnCours }) {
  const [texte, setTexte] = useState('')
  const conteneurRef = useRef(null)
  const messagesAffiches = useMemo(() => [...messages].reverse(), [messages])

  useEffect(() => {
    if (conteneurRef.current) {
      conteneurRef.current.scrollTop = conteneurRef.current.scrollHeight
    }
  }, [messagesAffiches.length])

  return (
    <div className="section-chat">
      <div className="liste-chat" ref={conteneurRef}>
        {messagesAffiches.length === 0 ? (
          <p className="chat-vide">Aucun message pour cette commande.</p>
        ) : (
          messagesAffiches.map((message) => (
            <div
              key={message.id}
              className={`bulle-chat ${message.expediteur?.role === 'CLIENT' ? 'bulle-client' : 'bulle-admin'}`}
            >
              <span className="auteur-bulle">
                {message.expediteur ? `${message.expediteur.prenom} ${message.expediteur.nom}` : 'Utilisateur'}
                {' · '}
                {libellerRole(message.expediteur?.role)}
              </span>
              <p>{message.contenu}</p>
              <span className="heure-bulle">{formaterDate(message.cree_le)}</span>
            </div>
          ))
        )}
      </div>
      <form
        className="ligne-saisie-chat"
        onSubmit={(evenement) => {
          evenement.preventDefault()
          const contenu = texte.trim()
          if (contenu.length === 0) {
            return
          }
          setTexte('')
          onEnvoyer(contenu)
        }}
      >
        <input
          type="text"
          value={texte}
          onChange={(evenement) => setTexte(evenement.target.value)}
          placeholder="Écrire au client..."
          maxLength={2000}
        />
        <button type="submit" className="bouton bouton-primaire" disabled={envoiEnCours || texte.trim().length === 0}>
          {envoiEnCours ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>
    </div>
  )
}

function champNotesPourRole(role) {
  return role === 'ADMIN_CHINE' ? 'notes_admin_chine' : 'notes_admin_rdc'
}

export default function DetailCommande() {
  const { id } = useParams()
  const { utilisateur: utilisateurCourant } = useApplication()
  const roleUtilisateur = utilisateurCourant?.role ?? 'ADMIN_RDC'
  const [commande, setCommande] = useState(null)
  const [suivi, setSuivi] = useState([])
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [notes, setNotes] = useState('')
  const [enregistrementNotes, setEnregistrementNotes] = useState(false)
  const [messageNotes, setMessageNotes] = useState('')

  const charger = useCallback(async () => {
    try {
      setErreur('')
      const [resultatSuivi, resultatMessages] = await Promise.all([
        api.listerSuivi(id),
        api.listerMessages(id, { page: 1, limit: 100 })
      ])
      setCommande(resultatSuivi.commande)
      setSuivi(resultatSuivi.donnees)
      setMessages(resultatMessages.donnees)
      setNotes(
        champNotesPourRole(roleUtilisateur) === 'notes_admin_chine'
          ? resultatSuivi.commande.notes_admin_chine ?? ''
          : resultatSuivi.commande.notes_admin_rdc ?? ''
      )
    } catch (erreurSurvenue) {
      setErreur(extraireMessageErreur(erreurSurvenue))
    } finally {
      setChargement(false)
    }
  }, [id, roleUtilisateur])

  useEffect(() => {
    void charger()
    rejoindreSalleCommande(id)
    const desabonnerCommande = abonnerEvenement('order:updated', (charge) => {
      if (charge?.id === id) {
        setCommande(charge)
      }
    })
    const desabonnerSuivi = abonnerEvenement('tracking:updated', (charge) => {
      if (charge?.commande_id === id && charge?.suivi) {
        setSuivi((precedent) =>
          precedent.some((point) => point.id === charge.suivi.id) ? precedent : [...precedent, charge.suivi]
        )
      }
    })
    const desabonnerMessage = abonnerEvenement('message:new', (message) => {
      if (message?.commande_id === id) {
        setMessages((precedent) =>
          precedent.some((element) => element.id === message.id) ? precedent : [message, ...precedent]
        )
      }
    })
    return () => {
      quitterSalleCommande(id)
      desabonnerCommande()
      desabonnerSuivi()
      desabonnerMessage()
    }
  }, [id, charger])

  async function envoyerMessage(contenu) {
    setEnvoiEnCours(true)
    try {
      const message = await api.envoyerMessage(id, { contenu })
      setMessages((precedent) =>
        precedent.some((element) => element.id === message.id) ? precedent : [message, ...precedent]
      )
    } catch (erreurSurvenue) {
      setErreur(extraireMessageErreur(erreurSurvenue))
    } finally {
      setEnvoiEnCours(false)
    }
  }

  async function enregistrerNotes() {
    setEnregistrementNotes(true)
    setMessageNotes('')
    try {
      const miseAJour = await api.modifierCommande(id, { [champNotesActif]: notes || undefined })
      setCommande((precedente) => ({
        ...precedente,
        notes_admin_rdc: miseAJour.notes_admin_rdc,
        notes_admin_chine: miseAJour.notes_admin_chine
      }))
      setMessageNotes('Notes enregistrées')
    } catch (erreurSurvenue) {
      setMessageNotes(extraireMessageErreur(erreurSurvenue))
    } finally {
      setEnregistrementNotes(false)
    }
  }

  const champNotesActif = champNotesPourRole(roleUtilisateur)

  if (chargement) {
    return (
      <div className="plein-ecran-chargement">
        <div className="spinner" />
        <p>Chargement de la commande...</p>
      </div>
    )
  }

  if (erreur && !commande) {
    return (
      <div className="plein-ecran-chargement">
        <div className="message-erreur">{erreur}</div>
        <Link className="bouton bouton-primaire" to="/commandes">
          Retour aux commandes
        </Link>
      </div>
    )
  }

  if (!commande) {
    return (
      <div className="plein-ecran-chargement">
        <p>Commande introuvable.</p>
        <Link className="bouton bouton-primaire" to="/commandes">
          Retour aux commandes
        </Link>
      </div>
    )
  }

  const suiviHistorique = [...suivi].reverse()

  return (
    <section className="page">
      <div className="entete-page">
        <div>
          <div className="ligne-titre-commande">
            <h1>{commande.numero_commande}</h1>
            <StatusBadge statut={commande.statut_actuel} />
          </div>
          <p className="sous-titre-page">
            Suivi {commande.numero_tracking} · Etape {commande.etape_actuelle}/10 · Créée le {formaterDate(commande.cree_le)}
          </p>
        </div>
        <div className="actions-entete-page">
          {commande.actions?.map((action) => (
            <ActionButton
              key={action.action}
              action={action.action}
              libelle={action.libelle}
              commandeId={commande.id}
              onSucces={charger}
              variante="succes"
            />
          ))}
          <Link className="bouton bouton-secondaire" to="/commandes">
            Retour
          </Link>
        </div>
      </div>

      {erreur ? <div className="bandeau-erreur"><span>{erreur}</span></div> : null}

      <div className="grille-informations">
        <div className="carte carte-information">
          <h3 className="titre-carte">Produit</h3>
          <dl className="liste-definition">
            <div>
              <dt>Description</dt>
              <dd>{commande.description_produit}</dd>
            </div>
            <div>
              <dt>Quantité</dt>
              <dd>{commande.quantite}</dd>
            </div>
            <div>
              <dt>Poids estimé</dt>
              <dd>{commande.poids_estime_kg} kg</dd>
            </div>
            <div>
              <dt>Valeur déclarée</dt>
              <dd>{commande.valeur_declaree_usd.toFixed(2)} $</dd>
            </div>
            <div>
              <dt>Frais de service</dt>
              <dd>{commande.frais_service_usd.toFixed(2)} $</dd>
            </div>
            <div>
              <dt>Frais de livraison</dt>
              <dd>{commande.frais_livraison_usd.toFixed(2)} $</dd>
            </div>
            <div>
              <dt>Montant total</dt>
              <dd className="valeur-importante">{commande.montant_total_usd.toFixed(2)} $</dd>
            </div>
            <div>
              <dt>Paiement</dt>
              <dd>{commande.statut_paiement === 'PAYE' ? 'Payé' : commande.statut_paiement === 'REMBOURSE' ? 'Remboursé' : 'En attente'}</dd>
            </div>
          </dl>
        </div>

        <div className="carte carte-information">
          <h3 className="titre-carte">Client</h3>
          <dl className="liste-definition">
            <div>
              <dt>Nom complet</dt>
              <dd>{commande.client ? `${commande.client.prenom} ${commande.client.nom}` : '—'}</dd>
            </div>
            <div>
              <dt>Téléphone</dt>
              <dd>{commande.client?.telephone ?? '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{commande.client?.email ?? '—'}</dd>
            </div>
            <div>
              <dt>Adresse de livraison</dt>
              <dd>
                {commande.adresse_livraison}
                <br />
                {commande.ville_livraison}
              </dd>
            </div>
            <div>
              <dt>Livraison estimée</dt>
              <dd>{formaterDate(commande.date_livraison_estimee, false)}</dd>
            </div>
            {commande.date_livraison_reelle ? (
              <div>
                <dt>Livrée le</dt>
                <dd>{formaterDate(commande.date_livraison_reelle)}</dd>
              </div>
            ) : null}
            {commande.notes_client ? (
              <div>
                <dt>Notes du client</dt>
                <dd>{commande.notes_client}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        <div className="carte carte-information">
          <h3 className="titre-carte">Notes internes</h3>
          <textarea
            className="zone-notes"
            value={notes}
            onChange={(evenement) => setNotes(evenement.target.value)}
            placeholder="Notes de suivi internes..."
            rows={6}
            maxLength={1000}
          />
          <button
            type="button"
            className="bouton bouton-secondaire bouton-petit"
            onClick={enregistrerNotes}
            disabled={enregistrementNotes}
          >
            {enregistrementNotes ? 'Enregistrement...' : 'Enregistrer les notes'}
          </button>
          {messageNotes ? <p className="message-notes">{messageNotes}</p> : null}
        </div>
      </div>

      <div className="grille-deux-colonnes">
        <div className="carte">
          <h3 className="titre-carte">Etapes du suivi</h3>
          <TrackingTimeline suivi={suivi} etapeActuelle={commande.etape_actuelle} />
        </div>
        <div className="carte">
          <h3 className="titre-carte">Position sur la route aérienne</h3>
          <CarteLeaflet suivi={suivi} />
        </div>
      </div>

      <div className="grille-deux-colonnes">
        <div className="carte">
          <h3 className="titre-carte">Discussion avec le client</h3>
          <SectionChat commandeId={commande.id} messages={messages} onEnvoyer={envoyerMessage} envoiEnCours={envoiEnCours} />
        </div>
        <div className="carte">
          <h3 className="titre-carte">Historique des actions</h3>
          <ul className="liste-historique">
            {suiviHistorique.map((point) => (
              <li key={point.id} className="element-historique">
                <span className="pastille-historique" style={{ backgroundColor: COULEURS_STATUT[point.statut] }} />
                <div className="contenu-historique">
                  <span className="titre-historique">
                    Etape {point.numero_etape} — {point.label}
                  </span>
                  <span className="detail-historique">
                    {point.lieu} · {LIBELLES_ACTEUR[point.type_acteur] ?? point.type_acteur}
                  </span>
                  <span className="date-historique">{formaterDate(point.cree_le)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
