import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import api, { COULEURS, URL_API } from './api'

function urlImage(produit) {
  const chemin = produit?.image_principale || produit?.images?.[0]
  if (!chemin) return null
  if (chemin.startsWith('http')) return chemin
  return `${URL_API}${chemin}`
}

export function EcranCatalogue({ navigation }) {
  const [produits, setProduits] = useState([])
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(true)
  const [rafraichissement, setRafraichissement] = useState(false)
  const [erreur, setErreur] = useState('')

  const charger = useCallback(async () => {
    try {
      setErreur('')
      const resultat = await api.listerProduits({
        limit: 50,
        recherche: recherche.trim() || undefined,
        statut: 'PUBLIE'
      })
      setProduits(resultat.donnees || [])
    } catch (e) {
      setErreur(e?.message || 'Impossible de charger les produits')
      setProduits([])
    } finally {
      setChargement(false)
      setRafraichissement(false)
    }
  }, [recherche])

  useFocusEffect(
    useCallback(() => {
      setChargement(true)
      void charger()
    }, [charger])
  )

  return (
    <View style={styles.conteneur}>
      <View style={styles.enTete}>
        <TextInput
          style={styles.champRecherche}
          placeholder="Rechercher un produit..."
          placeholderTextColor="#94a3b8"
          value={recherche}
          onChangeText={setRecherche}
          onSubmitEditing={() => {
            setChargement(true)
            void charger()
          }}
          returnKeyType="search"
        />
      </View>

      {chargement ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={COULEURS.primaire} />
          <Text style={styles.texteCentre}>Chargement de la boutique...</Text>
        </View>
      ) : erreur ? (
        <View style={styles.centre}>
          <Text style={styles.texteErreur}>{erreur}</Text>
          <TouchableOpacity
            style={styles.boutonReessayer}
            onPress={() => {
              setChargement(true)
              void charger()
            }}
          >
            <Text style={styles.texteBouton}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={produits}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grille}
          refreshControl={
            <RefreshControl
              refreshing={rafraichissement}
              onRefresh={() => {
                setRafraichissement(true)
                void charger()
              }}
              colors={[COULEURS.primaire]}
            />
          }
          ListEmptyComponent={
            <Text style={styles.vide}>Aucun produit publié pour le moment.</Text>
          }
          renderItem={({ item }) => {
            const uri = urlImage(item)
            return (
              <TouchableOpacity
                style={styles.carte}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ProduitDetail', { produit: item })}
              >
                <View style={styles.conteneurImage}>
                  {uri ? (
                    <Image source={{ uri }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <Text style={styles.emoji}>📦</Text>
                  )}
                </View>
                <Text style={styles.nom} numberOfLines={2}>
                  {item.nom}
                </Text>
                <Text style={styles.prix}>
                  {Number(item.prix_usd || 0).toFixed(2)} USD
                </Text>
                {item.est_vedette ? (
                  <Text style={styles.vedette}>★ Vedette</Text>
                ) : null}
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

export function EcranDetailProduit({ route, navigation }) {
  const produit = route.params?.produit
  if (!produit) {
    return (
      <View style={styles.centre}>
        <Text style={styles.texteErreur}>Produit introuvable</Text>
      </View>
    )
  }

  const uri = urlImage(produit)

  return (
    <View style={styles.conteneur}>
      <View style={[styles.conteneurImage, styles.imageDetail]}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={[styles.emoji, { fontSize: 64 }]}>📦</Text>
        )}
      </View>

      <View style={styles.corpsDetail}>
        <Text style={styles.titreDetail}>{produit.nom}</Text>
        <Text style={styles.prixDetail}>
          {Number(produit.prix_usd || 0).toFixed(2)} USD
        </Text>
        <Text style={styles.meta}>
          Poids estimé : {produit.poids_kg ?? 0.5} kg
          {produit.stock != null ? `  ·  Stock : ${produit.stock}` : ''}
        </Text>
        {produit.reference ? (
          <Text style={styles.meta}>Réf. {produit.reference}</Text>
        ) : null}
        <Text style={styles.description}>
          {produit.description || produit.description_courte || 'Aucune description'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.boutonCommander}
        onPress={() =>
          navigation.navigate('NouvelleCommande', { produitPreRempli: produit })
        }
      >
        <Text style={styles.texteBouton}>Commander cet article</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: COULEURS.fond },
  enTete: { padding: 16, backgroundColor: COULEURS.primaire },
  champRecherche: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COULEURS.texte
  },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  texteCentre: { color: COULEURS.texteSecondaire, fontSize: 14 },
  texteErreur: { color: COULEURS.danger, textAlign: 'center', fontSize: 14 },
  boutonReessayer: {
    backgroundColor: COULEURS.primaire,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  grille: { padding: 8, paddingBottom: 28 },
  carte: {
    flex: 1,
    backgroundColor: '#ffffff',
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    maxWidth: '47%'
  },
  conteneurImage: {
    height: 140,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: { width: '100%', height: '100%' },
  emoji: { fontSize: 40 },
  nom: {
    paddingHorizontal: 10,
    paddingTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: COULEURS.texte,
    minHeight: 40
  },
  prix: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    fontSize: 15,
    fontWeight: '700',
    color: COULEURS.primaire
  },
  vedette: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    fontSize: 11,
    color: '#d97706',
    fontWeight: '700'
  },
  vide: { textAlign: 'center', marginTop: 48, color: COULEURS.texteSecondaire },
  imageDetail: { height: 260, borderRadius: 0 },
  corpsDetail: { padding: 20, flex: 1, gap: 8 },
  titreDetail: { fontSize: 22, fontWeight: '800', color: COULEURS.texte },
  prixDetail: { fontSize: 22, fontWeight: '800', color: COULEURS.primaire },
  meta: { fontSize: 14, color: COULEURS.texteSecondaire },
  description: { fontSize: 15, color: COULEURS.texte, marginTop: 8, lineHeight: 22 },
  boutonCommander: {
    backgroundColor: COULEURS.primaire,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center'
  },
  texteBouton: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
})