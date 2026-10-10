import React, { useCallback, useEffect, useState } from 'react'
import api, { extraireMessageErreur, URL_API } from './api.js'
import { DataTable, Modal, StatusBadge } from './components.jsx'

// Taux de change par défaut (1 USD = 2800 FC)
const TAUX_DEFAUT_CDF = 2800

function formaterCDF(montantUSD, taux = TAUX_DEFAUT_CDF) {
  if (!montantUSD || isNaN(montantUSD)) return '0 FC'
  return `${Math.round(Number(montantUSD) * taux).toLocaleString('fr-FR')} FC`
}

export default function ProduitsPage() {
  const [produits, setProduits] = useState([])
  const [categories, setCategories] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [tauxChangeCDF, setTauxChangeCDF] = useState(TAUX_DEFAUT_CDF)
  
  // Modal création / édition
  const [modalOuverte, setModalOuverte] = useState(false)
  const [produitEnEdition, setProduitEnEdition] = useState(null)
  const [fichiersPhotos, setFichiersPhotos] = useState([])
  const [chargementSauvegarde, setChargementSauvegarde] = useState(false)

  const [formulaire, setFormulaire] = useState({
    nom: '',
    description: '',
    description_courte: '',
    prix_usd: 10,
    prix_promo_usd: '',
    stock: 50,
    poids_kg: 0.5,
    categorie_id: '',
    statut: 'PUBLIE',
    est_vedette: false
  })

  const chargerData = useCallback(async () => {
    try {
      setChargement(true)
      const [resProduits, resCats] = await Promise.all([
        api.listerProduits({ recherche, statut: filtreStatut || undefined, limit: 50 }),
        api.listerCategories()
      ])
      setProduits(resProduits.donnees || [])
      setCategories(resCats || [])
    } catch (err) {
      setErreur(extraireMessageErreur(err))
    } finally {
      setChargement(false)
    }
  }, [recherche, filtreStatut])

  useEffect(() => {
    chargerData()
  }, [chargerData])

  function ouvrirModalNouveau() {
    setProduitEnEdition(null)
    setFormulaire({
      nom: '',
      description: '',
      description_courte: '',
      prix_usd: 10,
      prix_promo_usd: '',
      stock: 50,
      poids_kg: 0.5,
      categorie_id: categories[0]?.id || '',
      statut: 'PUBLIE',
      est_vedette: false
    })
    setFichiersPhotos([])
    setModalOuverte(true)
  }

  function ouvrirModalEditer(p) {
    setProduitEnEdition(p)
    setFormulaire({
      nom: p.nom,
      description: p.description,
      description_courte: p.description_courte || '',
      prix_usd: p.prix_usd,
      prix_promo_usd: p.prix_promo_usd || '',
      stock: p.stock,
      poids_kg: p.poids_kg || 0.5,
      categorie_id: p.categorie_id || '',
      statut: p.statut,
      est_vedette: p.est_vedette || false
    })
    setFichiersPhotos([])
    setModalOuverte(true)
  }

  async function enregistrerProduit(e) {
    e.preventDefault()
    setChargementSauvegarde(true)
    try {
      let pEnregistre
      const payload = {
        ...formulaire,
        categorie_id: formulaire.categorie_id ? formulaire.categorie_id : null,
        prix_usd: Number(formulaire.prix_usd),
        prix_promo_usd: formulaire.prix_promo_usd ? Number(formulaire.prix_promo_usd) : null,
        stock: Number(formulaire.stock),
        poids_kg: Number(formulaire.poids_kg)
      }

      if (produitEnEdition) {
        pEnregistre = await api.modifierProduit(produitEnEdition.id, payload)
      } else {
        pEnregistre = await api.creerProduit(payload)
      }

      // Si des images ont été sélectionnées pour le téléversement
      if (fichiersPhotos.length > 0 && pEnregistre?.id) {
        const formData = new FormData()
        for (const file of fichiersPhotos) {
          formData.append('photos', file)
        }
        await api.uploaderPhotosProduit(pEnregistre.id, formData)
      }

      setModalOuverte(false)
      chargerData()
    } catch (err) {
      alert(extraireMessageErreur(err))
    } finally {
      setChargementSauvegarde(false)
    }
  }

  async function supprimer(id) {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return
    try {
      await api.supprimerProduit(id)
      chargerData()
    } catch (err) {
      alert(extraireMessageErreur(err))
    }
  }

  const colonnes = [
    {
      cle: 'image',
      libelle: 'Photo',
      rendu: (p) => (
        <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
          {p.image_principale || p.images?.[0] ? (
            <img
              src={p.image_principale?.startsWith('http') ? p.image_principale : `${URL_API}${p.image_principale || p.images[0]}`}
              alt={p.nom}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 20 }}>📦</div>
          )}
        </div>
      )
    },
    {
      cle: 'nom',
      libelle: 'Produit',
      rendu: (p) => (
        <div>
          <strong>{p.nom}</strong>
          {p.est_vedette && (
            <span style={{ marginLeft: 6, fontSize: 11, backgroundColor: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4 }}>
              ★ Vedette
            </span>
          )}
          <br />
          <span style={{ fontSize: 12, color: '#64748b' }}>Réf: {p.reference}</span>
        </div>
      )
    },
    {
      cle: 'prix_usd',
      libelle: 'Prix (USD / CDF)',
      rendu: (p) => (
        <div>
          <strong>{Number(p.prix_usd).toFixed(2)} $</strong>
          <div style={{ fontSize: 12, color: '#0284c7', fontWeight: '600' }}>
            ≈ {formaterCDF(p.prix_usd, tauxChangeCDF)}
          </div>
          {p.prix_promo_usd ? (
            <div style={{ fontSize: 11, color: '#dc2626', textDecoration: 'line-through' }}>
              {Number(p.prix_promo_usd).toFixed(2)} $ ({formaterCDF(p.prix_promo_usd, tauxChangeCDF)})
            </div>
          ) : null}
        </div>
      )
    },
    {
      cle: 'stock',
      libelle: 'Stock',
      rendu: (p) => (
        <span style={{ color: p.stock <= 5 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
          {p.stock} unités
        </span>
      )
    },
    {
      cle: 'statut',
      libelle: 'Statut',
      rendu: (p) => <StatusBadge statut={p.statut} />
    },
    {
      cle: 'actions',
      libelle: 'Actions',
      rendu: (p) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="bouton bouton-secondaire bouton-petit" onClick={() => ouvrirModalEditer(p)}>
            Éditer
          </button>
          <button type="button" className="bouton bouton-danger bouton-petit" onClick={() => supprimer(p.id)}>
            Supprimer
          </button>
        </div>
      )
    }
  ]

  return (
    <section className="page">
      <div className="entete-page" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Boutique & Produits</h1>
          <p className="sous-titre-page">Gérez le catalogue produit et les prix en USD / Francs Congolais</p>
        </div>
        <button type="button" className="bouton bouton-primaire" onClick={ouvrirModalNouveau}>
          + Nouveau Produit
        </button>
      </div>

      {erreur && <div className="message-erreur" style={{ marginBottom: 16 }}>{erreur}</div>}

      {/* FILTRES ET CONFIGURATION DU TAUX */}
      <div className="carte" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
        />
        
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
        >
          <option value="">Tous les statuts</option>
          <option value="PUBLIE">Publié</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="RUPTURE">Rupture</option>
          <option value="ARCHIVE">Archivé</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569', backgroundColor: '#f8fafc', padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <span>Taux : 1 $ =</span>
          <input
            type="number"
            value={tauxChangeCDF}
            onChange={(e) => setTauxChangeCDF(Number(e.target.value) || 1)}
            style={{ width: 75, padding: '2px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontWeight: 'bold', textAlign: 'center' }}
          />
          <span>FC</span>
        </div>
      </div>

      <div className="carte">
        <DataTable colonnes={colonnes} donnees={produits} cleRangée="id" chargement={chargement} vide="Aucun produit enregistré" />
      </div>

      {/* MODAL CRÉATION / ÉDITION */}
      <Modal ouverte={modalOuverte} titre={produitEnEdition ? 'Modifier le produit' : 'Créer un produit'} onFermer={() => setModalOuverte(false)}>
        <form onSubmit={enregistrerProduit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          <label className="champ-formulaire">
            <span>Nom du produit *</span>
            <input
              type="text"
              required
              placeholder="Ex: iPhone 15 Pro Max 256GB"
              value={formulaire.nom}
              onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="champ-formulaire">
              <span>Catégorie</span>
              <select
                value={formulaire.categorie_id}
                onChange={(e) => setFormulaire({ ...formulaire, categorie_id: e.target.value })}
              >
                <option value="">-- Sans catégorie --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nom}
                  </option>
                ))}
              </select>
            </label>

            <label className="champ-formulaire">
              <span>Stock disponible *</span>
              <input
                type="number"
                min="0"
                required
                value={formulaire.stock}
                onChange={(e) => setFormulaire({ ...formulaire, stock: e.target.value })}
              />
            </label>
          </div>

          {/* GESTION DU PRIX ET CONVERSION CDF */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, backgroundColor: '#f0f9ff', padding: 12, borderRadius: 8, border: '1px solid #bae6fd' }}>
            <label className="champ-formulaire">
              <span>Prix USD ($) *</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formulaire.prix_usd}
                onChange={(e) => setFormulaire({ ...formulaire, prix_usd: e.target.value })}
              />
              <span style={{ fontSize: 12, color: '#0369a1', marginTop: 4, fontWeight: '500' }}>
                Soit ≈ {formaterCDF(formulaire.prix_usd, tauxChangeCDF)}
              </span>
            </label>

            <label className="champ-formulaire">
              <span>Prix Promo USD ($) (optionnel)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Optionnel"
                value={formulaire.prix_promo_usd}
                onChange={(e) => setFormulaire({ ...formulaire, prix_promo_usd: e.target.value })}
              />
              {formulaire.prix_promo_usd ? (
                <span style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: '500' }}>
                  Soit ≈ {formaterCDF(formulaire.prix_promo_usd, tauxChangeCDF)}
                </span>
              ) : null}
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="champ-formulaire">
              <span>Poids estimé (Kg)</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formulaire.poids_kg}
                onChange={(e) => setFormulaire({ ...formulaire, poids_kg: e.target.value })}
              />
            </label>

            <label className="champ-formulaire">
              <span>Description courte</span>
              <input
                type="text"
                placeholder="Résumé en une ligne"
                value={formulaire.description_courte}
                onChange={(e) => setFormulaire({ ...formulaire, description_courte: e.target.value })}
              />
            </label>
          </div>

          <label className="champ-formulaire">
            <span>Description détaillée *</span>
            <textarea
              rows={3}
              required
              placeholder="Détails techniques, état, caractéristiques..."
              value={formulaire.description}
              onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })}
            />
          </label>

          <label className="champ-formulaire">
            <span>Photos du produit (Téléversement)</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFichiersPhotos(Array.from(e.target.files || []))}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="champ-formulaire">
              <span>Statut du produit</span>
              <select value={formulaire.statut} onChange={(e) => setFormulaire({ ...formulaire, statut: e.target.value })}>
                <option value="PUBLIE">Publié (Visible aux clients)</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="RUPTURE">Rupture de stock</option>
                <option value="ARCHIVE">Archivé</option>
              </select>
            </label>

            <label className="champ-formulaire" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
              <input
                type="checkbox"
                checked={formulaire.est_vedette}
                onChange={(e) => setFormulaire({ ...formulaire, est_vedette: e.target.checked })}
              />
              <span>Mettre en vedette (En avant)</span>
            </label>
          </div>

          <div className="actions-modal" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="bouton bouton-secondaire" onClick={() => setModalOuverte(false)}>
              Annuler
            </button>
            <button type="submit" className="bouton bouton-primaire" disabled={chargementSauvegarde}>
              {chargementSauvegarde ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}