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
import api, { COULEURS, extraireMessageErreur, formaterDate } from './api'
import { useNotifications } from './App'

const COULEURS_TYPE = {
  STATUT_CHANGE: COULEURS.primaire,
  NOUVELLE_COMMANDE: '#7c3aed',
  MESSAGE: '#0d9488',
  ALERTE: COULEURS.alerte
}

const TAILLE_PAGE = 20

export default function EcranNotifications({ navigation }) {
  const { setTotalNonLues } = useNotifications()
  const [notifications, setNotifications] = useState([])
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
      const resultat = await api.listerNotifications({ page: numeroPage, limit: TAILLE_PAGE })
      setTotalPages(resultat.pagination.total_pages)
      setNotifications((precedentes) =>
        remplacement
          ? resultat.donnees
          : [...precedentes, ...resultat.donnees.filter((nouvelle) => !precedentes.some((ancienne) => ancienne.id === nouvelle.id))]
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

  async function ouvrirNotification(notification) {
    try {
      if (!notification.est_lu) {
        await api.marquerNotificationLue(notification.id)
        setNotifications((precedentes) =>
          precedentes.map((element) => (element.id === notification.id ? { ...element, est_lu: true } : element))
        )
        setTotalNonLues((precedent) => Math.max(0, precedent - 1))
      }
      if (notification.commande_id) {
        navigation.navigate('Suivi', { commandeId: notification.commande_id })
      }
    } catch {
      return
    }
  }

  async function marquerToutLues() {
    try {
      await api.marquerToutesNotificationsLues()
      setNotifications((precedentes) => precedentes.map((element) => ({ ...element, est_lu: true })))
      setTotalNonLues(0)
    } catch {
      return
    }
  }

  if (chargement) {
    return (
      <View style={styles.conteneurEtat}>
        <ActivityIndicator size="large" color={COULEURS.primaire} />
        <Text style={styles.texteEtat}>Chargement des notifications...</Text>
      </View>
    )
  }

  return (
    <View style={styles.conteneur}>
      <TouchableOpacity style={styles.boutonToutLire} onPress={marquerToutLues}>
        <Text style={styles.texteToutLire}>Tout marquer comme lu</Text>
      </TouchableOpacity>

      {erreur ? (
        <View style={styles.carteErreur}>
          <Text style={styles.texteErreur}>{erreur}</Text>
          <TouchableOpacity style={styles.boutonReessayer} onPress={() => chargerPage(1, true)}>
            <Text style={styles.texteBoutonReessayer}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(notification) => notification.id}
        contentContainerStyle={styles.contenuListe}
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
          if (!chargementPlus && page < totalPages) {
            void chargerPage(page + 1, false)
          }
        }}
        ListFooterComponent={
          chargementPlus ? <ActivityIndicator color={COULEURS.primaire} style={styles.piedListe} /> : null
        }
        ListEmptyComponent={
          <View style={styles.carteVide}>
            <Text style={styles.texteVide}>Aucune notification pour le moment.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.carteNotification, item.est_lu ? null : styles.carteNonLue]}
            onPress={() => ouvrirNotification(item)}
          >
            <View style={[styles.barreType, { backgroundColor: COULEURS_TYPE[item.type] ?? COULEURS.primaire }]} />
            <View style={styles.corpsNotification}>
              <View style={styles.enteteNotification}>
                <Text style={styles.titreNotification}>{item.titre}</Text>
                {item.est_lu ? null : <View style={styles.pointNonLu} />}
              </View>
              <Text style={styles.messageNotification}>{item.message}</Text>
              <Text style={styles.dateNotification}>{formaterDate(item.cree_le)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: COULEURS.fond },
  conteneurEtat: { flex: 1, backgroundColor: COULEURS.fond, alignItems: 'center', justifyContent: 'center', gap: 12 },
  texteEtat: { color: COULEURS.texteSecondaire, fontSize: 15 },
  boutonToutLire: { marginHorizontal: 16, marginTop: 14, alignSelf: 'flex-end' },
  texteToutLire: { color: COULEURS.primaire, fontWeight: '700', fontSize: 13 },
  carteErreur: {
    marginHorizontal: 16,
    marginTop: 8,
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
  contenuListe: { paddingHorizontal: 16, paddingVertical: 10, paddingBottom: 24, gap: 10 },
  carteNotification: {
    backgroundColor: COULEURS.carte,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden'
  },
  carteNonLue: { borderWidth: 1, borderColor: COULEURS.primaireClair },
  barreType: { width: 4 },
  corpsNotification: { flex: 1, padding: 12, gap: 3 },
  enteteNotification: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titreNotification: { fontWeight: '700', color: COULEURS.texte, fontSize: 14, flex: 1 },
  pointNonLu: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COULEURS.primaire,
    marginLeft: 8
  },
  messageNotification: { color: COULEURS.texteSecondaire, fontSize: 13 },
  dateNotification: { color: COULEURS.texteSecondaire, fontSize: 11 },
  carteVide: { backgroundColor: COULEURS.carte, borderRadius: 12, padding: 20, alignItems: 'center' },
  texteVide: { color: COULEURS.texteSecondaire },
  piedListe: { paddingVertical: 16 }
})
