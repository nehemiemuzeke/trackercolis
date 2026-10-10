import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { abonnerEvenement, COULEURS_STATUT, extraireMessageErreur, formaterDate, libellerStatut } from './api.js'
import { useApplication } from './App.jsx'
import { ActionButton, DataTable, StatsCard, StatusBadge } from './components.jsx'

export default function Dashboard() {
  const { utilisateur } = useApplication()
  const [statistiques, setStatistiques] = useState(null)
  const [recentes, setRecentes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    try {
      setErreur('')
      const [stats, lignesRecentes] = await Promise.all([
        api.obtenirStatistiques(),
        api.listerCommandesRecentes({ limit: 5 })
      ])
      setStatistiques(stats)
      setRecentes(lignesRecentes)
    } catch (erreurSurvenue) {
      setErreur(extraireMessageErreur(erreurSurvenue))
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    void charger()
    const desabonner = abonnerEvenement('order:updated', () => {
      void charger()
    })
    return desabonner
  }, [charger])

  const maximumParStatut = statistiques
    ? Math.max(1, ...Object.values(statistiques.par_statut))
    : 1

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
      triable: true,
      rendu: (commande) =>
        commande.client ? `${commande.client.prenom} ${commande.client.nom}` : '—'
    },
    {
      cle: 'description_produit',
      libelle: 'Produit',
      rendu: (commande) => <span className="texte-tronque">{commande.description_produit}</span>
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
            Voir
          </Link>
          {commande.actions?.map((action) => (
            <ActionButton
              key={action.action}
              action={action.action}
              libelle={action.libelle}
              commandeId={commande.id}
              onSucces={charger}
            />
          ))}
        </div>
      )
    }
  ]

  if (chargement && !statistiques) {
    return (
      <div className="plein-ecran-chargement">
        <div className="spinner" />
        <p>Chargement du tableau de bord...</p>
      </div>
    )
  }

  return (
    <section className="page">
      <div className="entete-page">
        <div>
          <h1>Tableau de bord</h1>
          <p className="sous-titre-page">
            {utilisateur?.role === 'ADMIN_CHINE'
              ? 'Vue sur les commandes transmises à l\'équipe Chine'
              : 'Vue globale des commandes RDC vers la Chine'}
          </p>
        </div>
      </div>

      {erreur ? (
        <div className="bandeau-erreur">
          <span>{erreur}</span>
          <button type="button" className="bouton bouton-danger bouton-petit" onClick={charger}>
            Réessayer
          </button>
        </div>
      ) : null}

      {statistiques ? (
        <>
          <div className="grille-statistiques">
            <StatsCard
              titre="Commandes totales"
              valeur={statistiques.total}
              couleur="var(--couleur-primaire)"
              icone={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
                  <path d="M3 8l9 5 9-5M12 13v8" />
                </svg>
              }
            />
            <StatsCard
              titre="En attente"
              valeur={statistiques.en_attente}
              libelle="Non encore expédiées"
              couleur="var(--couleur-alerte)"
              icone={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            />
            <StatsCard
              titre="En transit"
              valeur={statistiques.en_transit}
              libelle="Expédiées ou en vol"
              couleur="#ea580c"
              icone={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                </svg>
              }
            />
            <StatsCard
              titre="Livrées"
              valeur={statistiques.livrees}
              libelle={`${statistiques.montant_total_usd.toFixed(2)} $ de chiffre cumulé`}
              couleur="var(--couleur-succes)"
              icone={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
            />
          </div>

          <div className="grille-deux-colonnes">
            <div className="carte">
              <h3 className="titre-carte">Commandes par statut</h3>
              <div className="diagramme-barres">
                {Object.entries(statistiques.par_statut).map(([statut, quantite]) => (
                  <div key={statut} className="ligne-diagramme">
                    <span className="libelle-diagramme">{libellerStatut(statut)}</span>
                    <div className="piste-diagramme">
                      <div
                        className="barre-diagramme"
                        style={{
                          width: `${Math.round((quantite / maximumParStatut) * 100)}%`,
                          backgroundColor: COULEURS_STATUT[statut] ?? 'var(--couleur-primaire)'
                        }}
                      />
                    </div>
                    <span className="valeur-diagramme">{quantite}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="carte">
              <h3 className="titre-carte">Activité récente</h3>
              <ul className="liste-activite">
                {recentes.length === 0 ? (
                  <li className="element-activite">Aucune commande récente</li>
                ) : (
                  recentes.map((commande) => (
                    <li key={commande.id} className="element-activite">
                      <Link to={`/commandes/${commande.id}`} className="lien-activite">
                        <span className="pastille-activite" style={{ backgroundColor: COULEURS_STATUT[commande.statut_actuel] }} />
                        <span className="texte-activite">
                          <strong>{commande.numero_commande}</strong> — {commande.description_produit}
                        </span>
                        <span className="date-activite">{formaterDate(commande.cree_le, false)}</span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="carte">
            <h3 className="titre-carte">Commandes récentes</h3>
            <DataTable
              colonnes={colonnes}
              donnees={recentes}
              cleRangée="id"
              vide="Aucune commande enregistrée"
            />
          </div>
        </>
      ) : null}
    </section>
  )
}
