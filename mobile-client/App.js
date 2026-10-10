import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { registerRootComponent } from 'expo'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { io } from 'socket.io-client'
import api, { COULEURS, definirGestionnaireSessionExpiree, definirJetonAcces, stockageSession, URL_API } from './api'
import { afficherNotificationLocale, enregistrerTokenPush } from './notificationsAppareil'
import { EcranConnexion, EcranInscription } from './AuthScreens'
import EcranAccueil from './HomeScreen'
import { EcranCatalogue, EcranDetailProduit } from './CatalogueScreen'
import EcranNouvelleCommande from './NewOrderScreen'
import EcranCommandes from './OrdersScreen'
import EcranNotifications from './NotificationsScreen'
import { EcranCartePleinEcran, EcranSuivi } from './TrackingScreen'

const ContexteAuthentification = createContext(null)
const ContexteSocket = createContext(null)
const ContexteNotifications = createContext(null)

export function useAuthentification() {
  return useContext(ContexteAuthentification)
}

export function useSocket() {
  return useContext(ContexteSocket)
}

export function useNotifications() {
  return useContext(ContexteNotifications)
}

const PileAuthentification = createNativeStackNavigator()
const PilePrincipale = createNativeStackNavigator()
const Onglets = createBottomTabNavigator()

function EcranProfil() {
  const { utilisateur, seDeconnecter } = useAuthentification()
  return (
    <View style={styles.conteneurProfil}>
      <View style={styles.carteProfil}>
        <View style={styles.avatar}>
          <Text style={styles.initiales}>
            {utilisateur?.prenom?.[0] || 'U'}
            {utilisateur?.nom?.[0] || ''}
          </Text>
        </View>
        <Text style={styles.nomComplet}>
          {utilisateur?.prenom} {utilisateur?.nom}
        </Text>
        <Text style={styles.information}>{utilisateur?.email}</Text>
        <Text style={styles.information}>{utilisateur?.telephone}</Text>
        {utilisateur?.ville ? (
          <Text style={styles.information}>
            {utilisateur.ville}
            {utilisateur.pays ? `, ${utilisateur.pays}` : ''}
          </Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.boutonDeconnexion} onPress={seDeconnecter}>
        <Text style={styles.texteDeconnexion}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  )
}

function OngletsPrincipaux() {
  const { totalNonLues } = useNotifications()
  return (
    <Onglets.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COULEURS.primaire },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: COULEURS.primaire,
        tabBarInactiveTintColor: COULEURS.texteSecondaire,
        tabBarStyle: { borderTopColor: COULEURS.bordure }
      }}
    >
      <Onglets.Screen name="Accueil" component={EcranAccueil} options={{ title: 'Colis RDC' }} />
      <Onglets.Screen name="Catalogue" component={EcranCatalogue} options={{ title: 'Boutique' }} />
      <Onglets.Screen name="Commandes" component={EcranCommandes} options={{ title: 'Mes commandes' }} />
      <Onglets.Screen
        name="Notifications"
        component={EcranNotifications}
        options={{ title: 'Notifications', tabBarBadge: totalNonLues > 0 ? totalNonLues : undefined }}
      />
      <Onglets.Screen name="Profil" component={EcranProfil} options={{ title: 'Mon profil' }} />
    </Onglets.Navigator>
  )
}

export default function Application() {
  const [utilisateur, setUtilisateur] = useState(null)
  const [jetonAcces, setJetonAcces] = useState(null)
  const [chargementSession, setChargementSession] = useState(true)
  const [socket, setSocket] = useState(null)
  const [totalNonLues, setTotalNonLues] = useState(0)

  const seConnecter = useCallback((nouvelUtilisateur, nouveauJeton) => {
    definirJetonAcces(nouveauJeton)
    setUtilisateur(nouvelUtilisateur)
    setJetonAcces(nouveauJeton)
  }, [])

  const seDeconnecter = useCallback(async () => {
    await stockageSession.effacer()
    definirJetonAcces(null)
    setUtilisateur(null)
    setJetonAcces(null)
    setTotalNonLues(0)
  }, [])

  const rafraichirCompteurNotifications = useCallback(async () => {
    try {
      const resultat = await api.listerNotifications({ page: 1, limit: 1 })
      setTotalNonLues(resultat.total_non_lues)
    } catch {
      return
    }
  }, [])

  useEffect(() => {
    definirGestionnaireSessionExpiree(() => {
      setUtilisateur(null)
      setJetonAcces(null)
      setTotalNonLues(0)
    })
    stockageSession
      .lire()
      .then((session) => {
        if (session.jetonAcces && session.utilisateur) {
          definirJetonAcces(session.jetonAcces)
          setUtilisateur(session.utilisateur)
          setJetonAcces(session.jetonAcces)
        }
      })
      .finally(() => setChargementSession(false))
  }, [])

  useEffect(() => {
    if (!utilisateur) {
      return undefined
    }
    void rafraichirCompteurNotifications()
    void enregistrerTokenPush()
    return undefined
  }, [utilisateur, rafraichirCompteurNotifications])

  useEffect(() => {
    if (!utilisateur || !jetonAcces) {
      setSocket(null)
      return undefined
    }
    const configuration = {
      auth: { jeton: jetonAcces },
      reconnection: true,
      reconnectionAttempts: 10
    }
    if (Platform.OS !== 'web') {
      configuration.transports = ['websocket']
    }
    const connexion = io(URL_API, configuration)
    let rafraichissementEnCours = false
    connexion.on('connect_error', async () => {
      if (rafraichissementEnCours) {
        return
      }
      rafraichissementEnCours = true
      try {
        const session = await stockageSession.lire()
        if (session.jetonAcces && session.jetonAcces !== jetonAcces) {
          connexion.auth = { jeton: session.jetonAcces }
          connexion.disconnect().connect()
        }
      } catch {
        return
      } finally {
        rafraichissementEnCours = false
      }
    })
    setSocket(connexion)
    return () => {
      connexion.disconnect()
      setSocket(null)
    }
  }, [utilisateur, jetonAcces])

  useEffect(() => {
    if (!socket) {
      return undefined
    }
    const gestionnaireNotification = async (notification) => {
      setTotalNonLues((precedent) => precedent + 1)
      await afficherNotificationLocale({
        titre: notification.titre,
        corps: notification.message
      })
    }
    socket.on('notification:new', gestionnaireNotification)
    return () => {
      socket.off('notification:new', gestionnaireNotification)
    }
  }, [socket])

  const valeurNotifications = useMemo(
    () => ({ totalNonLues, setTotalNonLues, rafraichirCompteurNotifications }),
    [totalNonLues, rafraichirCompteurNotifications]
  )
  const valeurAuthentification = useMemo(
    () => ({ utilisateur, seConnecter, seDeconnecter }),
    [utilisateur, seConnecter, seDeconnecter]
  )

  if (chargementSession) {
    return (
      <View style={styles.conteneurChargement}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.texteChargement}>Colis RDC</Text>
      </View>
    )
  }

  return (
    <ContexteAuthentification.Provider value={valeurAuthentification}>
      <ContexteNotifications.Provider value={valeurNotifications}>
        <ContexteSocket.Provider value={socket}>
          <StatusBar style="light" />
          <NavigationContainer>
            {utilisateur ? (
              <PilePrincipale.Navigator
                screenOptions={{
                  headerStyle: { backgroundColor: COULEURS.primaire },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { fontWeight: '700' }
                }}
              >
                <PilePrincipale.Screen
                  name="Principal"
                  component={OngletsPrincipaux}
                  options={{ headerShown: false }}
                />
                <PilePrincipale.Screen
                  name="ProduitDetail"
                  component={EcranDetailProduit}
                  options={{ title: 'Détails du produit' }}
                />
                <PilePrincipale.Screen
                  name="NouvelleCommande"
                  component={EcranNouvelleCommande}
                  options={{ title: 'Nouvelle commande' }}
                />
                <PilePrincipale.Screen name="Suivi" component={EcranSuivi} options={{ title: 'Suivi du colis' }} />
                <PilePrincipale.Screen
                  name="CartePleinEcran"
                  component={EcranCartePleinEcran}
                  options={{ title: 'Carte du parcours' }}
                />
              </PilePrincipale.Navigator>
            ) : (
              <PileAuthentification.Navigator
                screenOptions={{
                  headerStyle: { backgroundColor: COULEURS.primaire },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: { fontWeight: '700' }
                }}
              >
                <PileAuthentification.Screen name="Connexion" options={{ headerShown: false }}>
                  {() => <EcranConnexion seConnecter={seConnecter} />}
                </PileAuthentification.Screen>
                <PileAuthentification.Screen name="Inscription" options={{ title: 'Créer un compte' }}>
                  {() => <EcranInscription seConnecter={seConnecter} />}
                </PileAuthentification.Screen>
              </PileAuthentification.Navigator>
            )}
          </NavigationContainer>
        </ContexteSocket.Provider>
      </ContexteNotifications.Provider>
    </ContexteAuthentification.Provider>
  )
}

const styles = StyleSheet.create({
  conteneurChargement: {
    flex: 1,
    backgroundColor: COULEURS.primaire,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  texteChargement: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  conteneurProfil: { flex: 1, backgroundColor: COULEURS.fond, padding: 20 },
  carteProfil: {
    backgroundColor: COULEURS.carte,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COULEURS.fondClair,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  initiales: { color: COULEURS.primaire, fontSize: 28, fontWeight: '700' },
  nomComplet: { fontSize: 20, fontWeight: '700', color: COULEURS.texte },
  information: { fontSize: 14, color: COULEURS.texteSecondaire },
  boutonDeconnexion: {
    backgroundColor: COULEURS.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20
  },
  texteDeconnexion: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
})

registerRootComponent(Application)