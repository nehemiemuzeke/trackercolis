import React, { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { useNotifications } from './App'

function CarteCompteur({ valeur, libelle, couleur }) {
  return (
    <View style={[styles.carteCompteur, { borderTopColor: couleur }]}>
      <Text style={[styles.valeurCompteur, { color: couleur }]}>{valeur}</Text>
      <Text style={styles.libelleCompteur}>{libelle}</Text>
    </View>
  )
}

export default function EcranAccueil({ navigation }) {
  const { rafraichirCompteurNotifications } = useNotifications()
  const [chargement, setChargement] = useState(true)
  const [rafraichissement, setRafraichissement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [commandes, setCommandes] = useState([])
  const [notifications, setNotifications] = useState([])
  const [recherche, setRecherche] = useState('')
  const [erreurRecherche, setErreurRecherche] = useState('')
  const [rechercheEnCours, setRechercheEnCours] = useState(false)

  const charger = useCallback(async () => {
    try {
      setErreur('')
      const [resultatCommandes, resultatNotifications] = await Promise.all([
        api.listerCommandes({ page: 1, limit: 100 }),
        api.listerNotifications({ page: 1, limit: 5, est_lu: 'false' })
      ])
      setCommandes(resultatCommandes.donnees)
      setNotifications(resultatNotifications.donnees)
    } catch (erreurSurvenue) {
      setErreur(extraireMessageErreur(erreurSurvenue))
    } finally {
      setChargement(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void charger()
      void rafraichirCompteurNotifications()
    }, [charger, rafraichirCompteurNotifications])
  )

  async function rechercherColis() {
    const code = recherche.trim()
    if (code.length < 5) {
      setErreurRecherche('Saisissez un numéro de suivi valide')
      return
    }
    setRechercheEnCours(true)
    setErreurRecherche('')
    try {
      const commande = await api.suivreParCode(code)
      navigation.navigate('Suivi', { commandeId: commande.id })
    } catch (erreurSurvenue) {
      setErreurRecherche(extraireMessageErreur(erreurSurvenue))
    } finally {
      setRechercheEnCours(false)
    }
  }

  const enCours = commandes.filter((commande) => commande.statut_actuel !== 'LIVRE').length
  const enTransit = commandes.filter((commande) => commande.statut_actuel === 'EN_TRANSIT').length
  const livrees = commandes.filter((commande) => commande.statut_actuel === 'LIVRE').length

  if (chargement) {
    return (
      <View style={styles.conteneurEtat}>
        <ActivityIndicator size="large" color={COULEURS.primaire} />
        <Text style={styles.texteEtat}>Chargement de votre espace...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.conteneur}
      contentContainerStyle={styles.contenu}
      refreshControl={
        <RefreshControl
          refreshing={rafraichissement}
          onRefresh={async () => {
            setRafraichissement(true)
            await charger()
            await rafraichirCompteurNotifications()
            setRafraichissement(false)
          }}
          colors={[COULEURS.primaire]}
        />
      }
    >
      {erreur ? (
        <View style={styles.carteErreur}>
          <Text style={styles.texteErreur}>{erreur}</Text>
          <TouchableOpacity style={styles.boutonReessayer} onPress={charger}>
            <Text style={styles.texteBoutonReessayer}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.carteRecherche}>
        <Text style={styles.titreSection}>Suivre un colis</Text>
        <View style={styles.ligneRecherche}>
          <TextInput
            style={styles.champRecherche}
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Numéro de suivi (RDC-CN-...)"
            placeholderTextColor={COULEURS.texteSecondaire}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={[styles.boutonRecherche, rechercheEnCours ? styles.boutonDesactive : null]}
            onPress={rechercherColis}
            disabled={rechercheEnCours}
          >
            {rechercheEnCours ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.texteBoutonRecherche}>Suivre</Text>
            )}
          </TouchableOpacity>
        </View>
        {erreurRecherche ? <Text style={styles.texteErreur}>{erreurRecherche}</Text> : null}
      </View>

      <TouchableOpacity style={styles.boutonNouvelleCommande} onPress={() => navigation.navigate('NouvelleCommande')}>
        <Text style={styles.texteBoutonNouvelleCommande}>Nouvelle commande</Text>
      </TouchableOpacity>

      <View style={styles.grilleCompteurs}>
        <CarteCompteur valeur={commandes.length} libelle="Total" couleur={COULEURS.primaire} />
        <CarteCompteur valeur={enCours} libelle="En cours" couleur={COULEURS.alerte} />
        <CarteCompteur valeur={enTransit} libelle="En vol" couleur="#ea580c" />
        <CarteCompteur valeur={livrees} libelle="Livrées" couleur={COULEURS.succes} />
      </View>

      <Text style={styles.titreSection}>Commandes récentes</Text>
      {commandes.length === 0 ? (
        <View style={styles.carteVide}>
          <Text style={styles.texteVide}>Aucune commande pour le moment.</Text>
          <Text style={styles.texteVideSecondaire}>Créez votre première commande depuis la Chine.</Text>
        </View>
      ) : (
        commandes.slice(0, 3).map((commande) => (
          <TouchableOpacity
            key={commande.id}
            style={styles.carteCommande}
            onPress={() => navigation.navigate('Suivi', { commandeId: commande.id })}
          >
            <View style={styles.enteteCarteCommande}>
              <Text style={styles.numeroTracking}>{commande.numero_tracking}</Text>
              <View style={[styles.badgeStatut, { backgroundColor: `${COULEURS_STATUT[commande.statut_actuel]}22` }]}>
                <Text style={[styles.texteBadgeStatut, { color: COULEURS_STATUT[commande.statut_actuel] }]}>
                  {libellerStatut(commande.statut_actuel)}
                </Text>
              </View>
            </View>
            <Text style={styles.descriptionCommande} numberOfLines={1}>
              {commande.description_produit}
            </Text>
            <Text style={styles.dateCommande}>Etape {commande.etape_actuelle}/10 · {formaterDate(commande.cree_le)}</Text>
          </TouchableOpacity>
        ))
      )}
      {commandes.length > 3 ? (
        <TouchableOpacity onPress={() => navigation.navigate('Commandes')}>
          <Text style={styles.lienToutVoir}>Voir toutes mes commandes</Text>
        </TouchableOpacity>
      ) : null}

      <Text style={styles.titreSection}>Notifications non lues</Text>
      {notifications.length === 0 ? (
        <View style={styles.carteVide}>
          <Text style={styles.texteVide}>Aucune notification non lue.</Text>
        </View>
      ) : (
        notifications.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={styles.carteNotification}
            onPress={async () => {
              try {
                await api.marquerNotificationLue(notification.id)
                await rafraichirCompteurNotifications()
              } catch {
                return
              }
              if (notification.commande_id) {
                navigation.navigate('Suivi', { commandeId: notification.commande_id })
              }
            }}
          >
            <View style={[styles.barreNotification, { backgroundColor: COULEURS.primaire }]} />
            <View style={styles.corpsNotification}>
              <Text style={styles.titreNotification}>{notification.titre}</Text>
              <Text style={styles.messageNotification} numberOfLines={2}>
                {notification.message}
              </Text>
              <Text style={styles.dateNotification}>{formaterDate(notification.cree_le)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 16, gap: 12, paddingBottom: 32 },
  conteneurEtat: { flex: 1, backgroundColor: COULEURS.fond, alignItems: 'center', justifyContent: 'center', gap: 12 },
  texteEtat: { color: COULEURS.texteSecondaire, fontSize: 15 },
  carteErreur: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#fecaca'
  },
  texteErreur: { color: COULEURS.danger, fontSize: 13, textAlign: 'center' },
  boutonReessayer: { backgroundColor: COULEURS.danger, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  texteBoutonReessayer: { color: '#ffffff', fontWeight: '700' },
  carteRecherche: { backgroundColor: COULEURS.carte, borderRadius: 14, padding: 16, gap: 10 },
  titreSection: { fontSize: 16, fontWeight: '700', color: COULEURS.texte, marginTop: 8 },
  ligneRecherche: { flexDirection: 'row', gap: 8 },
  champRecherche: {
    flex: 1,
    borderWidth: 1,
    borderColor: COULEURS.bordure,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COULEURS.texte,
    backgroundColor: '#f8fafc'
  },
  boutonRecherche: { backgroundColor: COULEURS.primaire, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  boutonDesactive: { opacity: 0.6 },
  texteBoutonRecherche: { color: '#ffffff', fontWeight: '700' },
  boutonNouvelleCommande: {
    backgroundColor: COULEURS.primaire,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center'
  },
  texteBoutonNouvelleCommande: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  grilleCompteurs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  carteCompteur: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: COULEURS.carte,
    borderRadius: 12,
    padding: 14,
    borderTopWidth: 3
  },
  valeurCompteur: { fontSize: 26, fontWeight: '800' },
  libelleCompteur: { fontSize: 13, color: COULEURS.texteSecondaire, marginTop: 2 },
  carteCommande: { backgroundColor: COULEURS.carte, borderRadius: 12, padding: 14, gap: 6 },
  enteteCarteCommande: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numeroTracking: { fontWeight: '700', color: COULEURS.texte, fontSize: 14 },
  badgeStatut: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  texteBadgeStatut: { fontSize: 11, fontWeight: '700' },
  descriptionCommande: { color: COULEURS.texteSecondaire, fontSize: 13 },
  dateCommande: { color: COULEURS.texteSecondaire, fontSize: 12 },
  carteVide: {
    backgroundColor: COULEURS.carte,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    gap: 4
  },
  texteVide: { color: COULEURS.texte, fontWeight: '600' },
  texteVideSecondaire: { color: COULEURS.texteSecondaire, fontSize: 13 },
  lienToutVoir: { color: COULEURS.primaire, fontWeight: '700', textAlign: 'center', paddingVertical: 6 },
  carteNotification: {
    backgroundColor: COULEURS.carte,
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden'
  },
  barreNotification: { width: 4 },
  corpsNotification: { flex: 1, padding: 12, gap: 3 },
  titreNotification: { fontWeight: '700', color: COULEURS.texte, fontSize: 14 },
  messageNotification: { color: COULEURS.texteSecondaire, fontSize: 13 },
  dateNotification: { color: COULEURS.texteSecondaire, fontSize: 11 }
})
