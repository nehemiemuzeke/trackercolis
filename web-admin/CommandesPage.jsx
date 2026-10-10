import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api, {
  abonnerEvenement,
  COULEURS_STATUT,
  ETAPES_TIMELINE,
  extraireMessageErreur,
  formaterDate,
  libellerStatut
} from './api.js'
import { useApplication } from './App.jsx'
import { ActionButton, DataTable, Modal, StatusBadge } from './components.jsx'

const TAILLE_PAGE = 15

export default function CommandesPage() {
  const { utilisateur } = useApplication()
  const serviceListe = utilisateur?.role === 'ADMIN_CHINE' ? api.adminChine : api.adminRdc
  const [commandes, setCommandes] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: TAILLE_PAGE, total: 0, total_pages: 0 })
  const [page, setPage] = useState(1)
  const [statutFiltre, setStatutFiltre] = useState('')
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const minuterieRecherche = useRef(null)

  const charger = useCallback(
    async (pageCourante, statut, texteRecherche) => {
      setChargement(true)
      try {
        setErreur('')
        const params = { page: pageCourante, limit: TAILLE_PAGE }
        if (statut) {
          params.statut = statut
        }
        if (texteRecherche) {
          params.q = texteRecherche
        }
        const resultat = await serviceListe.listerCommandes(params)
        setCommandes(resultat.donnees)
        setPagination(resultat.pagination)
      } catch (erreurSurvenue) {
        setErreur(extraireMessageErreur(erreurSurvenue))
      } finally {
        setChargement(false)
      }
    },
    [serviceListe]
  )

  useEffect(() => {
    void charger(page, statutFiltre, recherche)
  }, [charger, page, statutFiltre])

  useEffect(() => {
    const desabonner = abonnerEvenement('order:updated', () => {
      void charger(page, statutFiltre, recherche)
    })
    return desabonner
  }, [charger, page, statutFiltre, recherche])

  function changerRecherche(valeur) {
    setRecherche(valeur)
    if (minuterieRecherche.current) {
      clearTimeout(minuterieRecherche.current)
    }
    minuterieRecherche.current = setTimeout(() => {
      setPage(1)
      void charger(1, statutFiltre, valeur)
    }, 350)
  }

  const colonnes = [
    {
      cle: 'numero_commande',
      libelle: 'Commande',
      rendu: (commande) => (
        <div className="cellule-commande">
          <span className="numero-commande">{commande.numero_commande}</span>
          <span className="numero-suivi">{commande.numero_tracking}</span>
        </div>
      )
    },
    {
      cle: 'client',
      libelle: 'Client',
      rendu: (commande) =>
        commande.client ? (
          <div className="cellule-commande">
            <span>
              {commande.client.prenom} {commande.client.nom}
            </span>
            <span className="texte-secondaire-petit">{commande.client.telephone}</span>
          </div>
        ) : (
          '—'
        )
    },
    {
      cle: 'description_produit',
      libelle: 'Produit',
      rendu: (commande) => (
        <div className="cellule-commande">
          <span className="texte-tronque">{commande.description_produit}</span>
          <span className="texte-secondaire-petit">
            {commande.quantite} × · {commande.poids_estime_kg} kg
          </span>
        </div>
      )
    },
    {
      cle: 'statut_actuel',
      libelle: 'Statut',
      rendu: (commande) => <StatusBadge statut={commande.statut_actuel} />
    },
    {
      cle: 'montant_total_usd',
      libelle: 'Montant',
      triable: true,
      rendu: (commande) => `${commande.montant_total_usd.toFixed(2)} $`
    },
    {
      cle: 'cree_le',
      libelle: 'Créée le',
      rendu: (commande) => formaterDate(commande.cree_le)
    },
    {
      cle: 'actions',
      libelle: 'Actions',
      rendu: (commande) => (
        <div className="actions-rangée">
          <Link className="bouton bouton-secondaire bouton-petit" to={`/commandes/${commande.id}`}>
            Détails
          </Link>
          {commande.actions?.map((action) => (
            <ActionButton
              key={action.action}
              action={action.action}
              libelle={action.libelle}
              commandeId={commande.id}
              onSucces={() => charger(page, statutFiltre, recherche)}
            />
          ))}
        </div>
      )
    }
  ]

  return (
    <section className="page">
      <div className="entete-page">
        <div>
          <h1>Commandes</h1>
          <p className="sous-titre-page">
            {utilisateur?.role === 'ADMIN_CHINE'
              ? 'Commandes transmises à l\'équipe de Guangzhou'
              : 'Toutes les commandes de la plateforme'}
          </p>
        </div>
      </div>

      {erreur ? (
        <div className="bandeau-erreur">
          <span>{erreur}</span>
          <button type="button" className="bouton bouton-danger bouton-petit" onClick={() => charger(page, statutFiltre, recherche)}>
            Réessayer
          </button>
        </div>
      ) : null}

      <div className="carte barre-filtres">
        <input
          type="search"
          className="champ-recherche"
          placeholder="Rechercher par numéro de commande, suivi ou produit..."
          value={recherche}
          onChange={(evenement) => changerRecherche(evenement.target.value)}
        />
        <select
          className="champ-selection"
          value={statutFiltre}
          onChange={(evenement) => {
            setPage(1)
            setStatutFiltre(evenement.target.value)
          }}
        >
          <option value="">Tous les statuts</option>
          {ETAPES_TIMELINE.map((etape) => (
            <option key={etape.statut} value={etape.statut}>
              {libellerStatut(etape.statut)}
            </option>
          ))}
        </select>
      </div>

      <div className="carte">
        <DataTable
          colonnes={colonnes}
          donnees={commandes}
          cleRangée="id"
          chargement={chargement}
          vide="Aucune commande ne correspond aux filtres"
          pagination={{
            page: pagination.page,
            total: pagination.total,
            total_pages: pagination.total_pages,
            changerPage: setPage
          }}
        />
      </div>
    </section>
  )
}
