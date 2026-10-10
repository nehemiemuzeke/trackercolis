import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import api, {
  COULEURS,
  COULEURS_STATUT,
  extraireMessageErreur,
  formaterDate,
  libellerStatut
} from './api'

const FILTRES = [
  { cle: 'TOUTES', libelle: 'Toutes' },
  { cle: 'EN_COURS', libelle: 'En cours' },
  { cle: 'LIVREES', libelle: 'Livrées' }
]

const TAILLE_PAGE = 20

function CarteCommande({ commande, onPress }) {
  return (
    <TouchableOpacity style={styles.carteCommande} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.enteteCarte}>
        <Text style={styles.numeroTracking}>{commande.numero_tracking}</Text>
        <View style={[styles.badgeStatut, { backgroundColor: `${COULEURS_STATUT[commande.statut_actuel]}22` }]}>
          <Text style={[styles.texteBadge, { color: COULEURS_STATUT[commande.statut_actuel] }]}>
            {libellerStatut(commande.statut_actuel)}
          </Text>
        </View>
      </View>
      <Text style={styles.description} numberOfLines={1}>
        {commande.quantite} × {commande.description_produit}
      </Text>
      <View style={styles.piedCarte}>
        <Text style={styles.montant}>{commande.montant_total_usd.toFixed(2)} USD</Text>
        <Text style={styles.date}>Etape {commande.etape_actuelle}/10 · {formaterDate(commande.cree_le)}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function EcranCommandes({ navigation }) {
  const [filtreActif, setFiltreActif] = useState('TOUTES')
  const [commandes, setCommandes] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [chargement, setChargement] = useState(true)
  const [chargementPlus, setChargementPlus] = useState(false)
  const [rafraichissement, setRafraichissement] = useState(false)
  const [erreur, setErreur] = useState('')

  const chargerPage = useCallback(async (numeroPage, remplacement) => {
    if (remplacement) {
      setChargement(true)
    } else {
      setChargementPlus(true)
    }
    try {
      setErreur('')
      const resultat = await api.listerCommandes({ page: numeroPage, limit: TAILLE_PAGE })
      setTotalPages(resultat.pagination.total_pages)
      setCommandes((precedentes) =>
        remplacement ? resultat.donnees : [...precedentes, ...resultat.donnees.filter((nouvelle) => !precedentes.some((ancienne) => ancienne.id === nouvelle.id))]
      )
      setPage(numeroPage)
    } catch (erreurSurvenue) {
      setErreur(extraireMessageErreur(erreurSurvenue))
    } finally {
      setChargement(false)
      setChargementPlus(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void chargerPage(1, true)
    }, [chargerPage])
  )

  const commandesAffichees =
    filtreActif === 'TOUTES'
      ? commandes
      : commandes.filter((commande) =>
          filtreActif === 'LIVREES' ? commande.statut_actuel === 'LIVRE' : commande.statut_actuel !== 'LIVRE'
        )

  if (chargement) {
    return (
      <View style={styles.conteneurEtat}>
        <ActivityIndicator size="large" color={COULEURS.primaire} />
        <Text style={styles.texteEtat}>Chargement de vos commandes...</Text>
      </View>
    )
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.barreFiltres}>
        {FILTRES.map((filtre) => (
          <TouchableOpacity
            key={filtre.cle}
            style={[styles.puceFiltre, filtreActif === filtre.cle ? styles.puceFiltreActive : null]}
            onPress={() => setFiltreActif(filtre.cle)}
          >
            <Text style={[styles.texteFiltre, filtreActif === filtre.cle ? styles.texteFiltreActif : null]}>
              {filtre.libelle}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {erreur ? (
        <View style={styles.carteErreur}>
          <Text style={styles.texteErreur}>{erreur}</Text>
          <TouchableOpacity style={styles.boutonReessayer} onPress={() => chargerPage(1, true)}>
            <Text style={styles.texteBoutonReessayer}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={commandesAffichees}
        keyExtractor={(commande) => commande.id}
        contentContainerStyle={styles.contenuListe}
        renderItem={({ item }) => (
          <CarteCommande commande={item} onPress={() => navigation.navigate('Suivi', { commandeId: item.id })} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={rafraichissement}
            onRefresh={async () => {
              setRafraichissement(true)
              await chargerPage(1, true)
              setRafraichissement(false)
            }}
            colors={[COULEURS.primaire]}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (!chargementPlus && page < totalPages && filtreActif === 'TOUTES') {
            void chargerPage(page + 1, false)
          }
        }}
        ListFooterComponent={
          chargementPlus ? <ActivityIndicator color={COULEURS.primaire} style={styles.piedListe} /> : null
        }
        ListEmptyComponent={
          <View style={styles.carteVide}>
            <Text style={styles.texteVide}>Aucune commande dans cette catégorie.</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: COULEURS.fond },
  conteneurEtat: { flex: 1, backgroundColor: COULEURS.fond, alignItems: 'center', justifyContent: 'center', gap: 12 },
  texteEtat: { color: COULEURS.texteSecondaire, fontSize: 15 },
  barreFiltres: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 },
  puceFiltre: {
    flex: 1,
    borderWidth: 1,
    borderColor: COULEURS.bordure,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: COULEURS.carte
  },
  puceFiltreActive: { backgroundColor: COULEURS.primaire, borderColor: COULEURS.primaire },
  texteFiltre: { fontSize: 13, fontWeight: '600', color: COULEURS.texteSecondaire },
  texteFiltreActif: { color: '#ffffff' },
  contenuListe: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  carteCommande: { backgroundColor: COULEURS.carte, borderRadius: 12, padding: 14, gap: 8 },
  enteteCarte: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numeroTracking: { fontWeight: '700', color: COULEURS.texte, fontSize: 14 },
  badgeStatut: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  texteBadge: { fontSize: 11, fontWeight: '700' },
  description: { color: COULEURS.texteSecondaire, fontSize: 13 },
  piedCarte: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  montant: { color: COULEURS.primaire, fontWeight: '700', fontSize: 13 },
  date: { color: COULEURS.texteSecondaire, fontSize: 11 },
  carteErreur: {
    marginHorizontal: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  texteErreur: { color: COULEURS.danger, fontSize: 13, textAlign: 'center' },
  boutonReessayer: { backgroundColor: COULEURS.danger, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  texteBoutonReessayer: { color: '#ffffff', fontWeight: '700' },
  carteVide: { backgroundColor: COULEURS.carte, borderRadius: 12, padding: 20, alignItems: 'center' },
  texteVide: { color: COULEURS.texteSecondaire },
  piedListe: { paddingVertical: 16 }
})
