import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api, {
  COULEURS,
  COULEURS_STATUT,
  ETAPES_TIMELINE,
  extraireMessageErreur,
  formaterDate,
  libellerStatut
} from './api'
import { useSocket } from './App'
import { CarteEtendue, CarteSuivi } from './CarteColis'

function TimelineSuivi({ suivi, etapeActuelle }) {
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
    <View style={styles.conteneurTimeline}>
      {ETAPES_TIMELINE.map((etape, index) => {
        const point = premiereOccurrence[etape.numero]
        const realisee = Boolean(point)
        const actuelle = etape.numero === etapeActuelle
        const couleur = realisee ? COULEURS_STATUT[etape.statut] : COULEURS.bordure
        return (
          <View key={etape.numero} style={styles.ligneTimeline}>
            <View style={styles.colonneJonction}>
              <View style={[styles.cercleEtape, { borderColor: couleur, backgroundColor: realisee ? couleur : '#ffffff' }]}>
                <Text style={[styles.numeroEtape, { color: realisee ? '#ffffff' : COULEURS.texteSecondaire }]}>
                  {etape.numero}
                </Text>
              </View>
              {index < ETAPES_TIMELINE.length - 1 ? (
                <View style={[styles.jonction, { backgroundColor: realisee && premiereOccurrence[etape.numero + 1] ? COULEURS.primaireClair : COULEURS.bordure }]} />
              ) : null}
            </View>
            <View style={[styles.contenuEtape, actuelle ? styles.contenuEtapeActive : null]}>
              <View style={styles.enteteEtape}>
                <Text style={[styles.libelleEtape, realisee ? styles.libelleEtapeRealisee : null]}>{etape.label}</Text>
                {actuelle ? <View style={styles.badgeActuel}><Text style={styles.texteBadgeActuel}>En cours</Text></View> : null}
              </View>
              <Text style={styles.lieuEtape}>{point ? point.lieu : etape.lieu}</Text>
              {point ? <Text style={styles.dateEtape}>{formaterDate(point.cree_le)}</Text> : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}

function SectionChat({ messages, onEnvoyer, envoiEnCours, erreurChat }) {
  const [texte, setTexte] = useState('')

  return (
    <View style={styles.conteneurChat}>
      <Text style={styles.titreSection}>Discussion avec l'équipe</Text>
      <View style={styles.listeMessages}>
        {messages.length === 0 ? (
          <Text style={styles.chatVide}>Aucun message. Démarrez la conversation.</Text>
        ) : (
          [...messages].reverse().map((message) => {
            const estClient = message.expediteur?.role === 'CLIENT'
            return (
              <View key={message.id} style={[styles.bulleMessage, estClient ? styles.bulleClient : styles.bulleAdmin]}>
                <Text style={styles.auteurMessage}>
                  {message.expediteur ? `${message.expediteur.prenom} ${message.expediteur.nom}` : 'Utilisateur'}
                </Text>
                <Text style={styles.contenuMessage}>{message.contenu}</Text>
                <Text style={styles.heureMessage}>{formaterDate(message.cree_le)}</Text>
              </View>
            )
          })
        )}
      </View>
      {erreurChat ? <Text style={styles.texteErreurChat}>{erreurChat}</Text> : null}
      <View style={styles.ligneSaisie}>
        <TextInput
          style={styles.champMessage}
          value={texte}
          onChangeText={setTexte}
          placeholder="Écrivez votre message..."
          placeholderTextColor={COULEURS.texteSecondaire}
          multiline
        />
        <TouchableOpacity
          style={[styles.boutonEnvoyer, texte.trim().length === 0 || envoiEnCours ? styles.boutonDesactive : null]}
          disabled={texte.trim().length === 0 || envoiEnCours}
          onPress={async () => {
            const contenu = texte.trim()
            if (contenu.length === 0) {
              return
            }
            setTexte('')
            await onEnvoyer(contenu)
          }}
        >
          {envoiEnCours ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.texteEnvoyer}>Envoyer</Text>}
        </TouchableOpacity>
      </View>
    </View>
  )
}

export function EcranSuivi({ route, navigation }) {
  const { commandeId: commandeIdParam, code } = route.params ?? {}
  const socket = useSocket()
  const [commandeId, setCommandeId] = useState(commandeIdParam ?? null)
  const [commande, setCommande] = useState(null)
  const [suivi, setSuivi] = useState([])
  const [messages, setMessages] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [rafraichissement, setRafraichissement] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreurChat, setErreurChat] = useState('')

  async function charger(idCourant) {
    try {
      setErreur('')
      let commandeChargee = null
      if (idCourant) {
        commandeChargee = await api.detailsCommande(idCourant)
      } else if (code) {
        commandeChargee = await api.suivreParCode(code)
      }
      if (!commandeChargee) {
        setErreur('Commande introuvable')
        return
      }
      setCommandeId(commandeChargee.id)
      const [resultatSuivi, resultatMessages] = await Promise.all([
        api.listerSuivi(commandeChargee.id),
        api.listerMessages(commandeChargee.id, { page: 1, limit: 50 })
      ])
      setCommande(commandeChargee)
      setSuivi(resultatSuivi.donnees)
      setMessages(resultatMessages.donnees)
    } catch (erreurSurvenue) {
      setErreur(extraireMessageErreur(erreurSurvenue))
    } finally {
      setChargement(false)
    }
  }

  useEffect(() => {
    void charger(commandeIdParam ?? null)
  }, [commandeIdParam, code])

  useEffect(() => {
    if (!socket || !commandeId) {
      return undefined
    }
    socket.emit('join:order', { commande_id: commandeId })
    const gestionnaireCommande = (charge) => {
      if (charge?.id === commandeId) {
        setCommande(charge)
      }
    }
    const gestionnaireSuivi = (charge) => {
      if (charge?.commande_id === commandeId && charge?.suivi) {
        setSuivi((precedent) => (precedent.some((point) => point.id === charge.suivi.id) ? precedent : [...precedent, charge.suivi]))
      }
    }
    const gestionnaireMessage = (message) => {
      if (message?.commande_id === commandeId) {
        setMessages((precedent) => (precedent.some((element) => element.id === message.id) ? precedent : [message, ...precedent]))
      }
    }
    socket.on('order:updated', gestionnaireCommande)
    socket.on('tracking:updated', gestionnaireSuivi)
    socket.on('message:new', gestionnaireMessage)
    return () => {
      socket.emit('leave:order', commandeId)
      socket.off('order:updated', gestionnaireCommande)
      socket.off('tracking:updated', gestionnaireSuivi)
      socket.off('message:new', gestionnaireMessage)
    }
  }, [socket, commandeId])

  async function envoyerMessage(contenu) {
    if (!commandeId) {
      return
    }
    setEnvoiEnCours(true)
    setErreurChat('')
    try {
      const message = await api.envoyerMessage(commandeId, { contenu })
      setMessages((precedent) => (precedent.some((element) => element.id === message.id) ? precedent : [message, ...precedent]))
    } catch (erreurSurvenue) {
      setErreurChat(extraireMessageErreur(erreurSurvenue))
    } finally {
      setEnvoiEnCours(false)
    }
  }

  if (chargement) {
    return (
      <View style={styles.conteneurEtat}>
        <ActivityIndicator size="large" color={COULEURS.primaire} />
        <Text style={styles.texteEtat}>Chargement du suivi...</Text>
      </View>
    )
  }

  if (erreur || !commande) {
    return (
      <View style={styles.conteneurEtat}>
        <Text style={styles.texteErreurEtat}>{erreur || 'Commande introuvable'}</Text>
        <TouchableOpacity style={styles.boutonReessayer} onPress={() => charger(commandeId ?? null)}>
          <Text style={styles.texteBoutonReessayer}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.contenu}
        refreshControl={
          <RefreshControl
            refreshing={rafraichissement}
            onRefresh={async () => {
              setRafraichissement(true)
              await charger(commandeId)
              setRafraichissement(false)
            }}
            colors={[COULEURS.primaire]}
          />
        }
      >
        <View style={styles.carteEntete}>
          <View style={styles.ligneEntete}>
            <Text style={styles.numeroTracking}>{commande.numero_tracking}</Text>
            <View style={[styles.badgeStatut, { backgroundColor: `${COULEURS_STATUT[commande.statut_actuel]}22` }]}>
              <Text style={[styles.texteBadge, { color: COULEURS_STATUT[commande.statut_actuel] }]}>
                {libellerStatut(commande.statut_actuel)}
              </Text>
            </View>
          </View>
          <Text style={styles.descriptionCommande}>
            {commande.quantite} × {commande.description_produit}
          </Text>
          <View style={styles.grilleInformations}>
            <View style={styles.information}>
              <Text style={styles.libelleInformation}>Commande</Text>
              <Text style={styles.valeurInformation}>{commande.numero_commande}</Text>
            </View>
            <View style={styles.information}>
              <Text style={styles.libelleInformation}>Montant total</Text>
              <Text style={styles.valeurInformation}>{commande.montant_total_usd.toFixed(2)} USD</Text>
            </View>
            <View style={styles.information}>
              <Text style={styles.libelleInformation}>Poids estimé</Text>
              <Text style={styles.valeurInformation}>{commande.poids_estime_kg} kg</Text>
            </View>
            <View style={styles.information}>
              <Text style={styles.libelleInformation}>Livraison estimée</Text>
              <Text style={styles.valeurInformation}>{formaterDate(commande.date_livraison_estimee)}</Text>
            </View>
          </View>
          <View style={styles.barreProgression}>
            <View style={[styles.progression, { width: `${commande.etape_actuelle * 10}%` }]} />
          </View>
          <Text style={styles.texteProgression}>Etape {commande.etape_actuelle} sur 10</Text>
        </View>

        <Text style={styles.titreSection}>Parcours du colis</Text>
        <CarteSuivi
          suivi={suivi}
          hauteur={240}
          montrerBoutonPleinEcran
          onPleinEcran={() => navigation.navigate('CartePleinEcran', { suivi, numeroTracking: commande.numero_tracking })}
        />

        <Text style={styles.titreSection}>Etapes du suivi</Text>
        <View style={styles.carte}>
          <TimelineSuivi suivi={suivi} etapeActuelle={commande.etape_actuelle} />
        </View>

        <SectionChat
          messages={messages}
          onEnvoyer={envoyerMessage}
          envoiEnCours={envoiEnCours}
          erreurChat={erreurChat}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export function EcranCartePleinEcran({ route }) {
  const { suivi, numeroTracking } = route.params ?? { suivi: [], numeroTracking: '' }
  return (
    <SafeAreaView style={styles.conteneurPleinEcran} edges={['top']}>
      <View style={styles.entetePleinEcran}>
        <Text style={styles.titrePleinEcran} numberOfLines={1}>
          {numeroTracking}
        </Text>
      </View>
      <CarteEtendue suivi={suivi} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 16, gap: 12, paddingBottom: 40 },
  conteneurEtat: { flex: 1, backgroundColor: COULEURS.fond, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  texteEtat: { color: COULEURS.texteSecondaire, fontSize: 15 },
  texteErreurEtat: { color: COULEURS.danger, fontSize: 15, textAlign: 'center' },
  boutonReessayer: { backgroundColor: COULEURS.primaire, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  texteBoutonReessayer: { color: '#ffffff', fontWeight: '700' },
  carteEntete: { backgroundColor: COULEURS.carte, borderRadius: 16, padding: 16, gap: 10 },
  ligneEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  numeroTracking: { fontWeight: '800', color: COULEURS.texte, fontSize: 15, flexShrink: 1 },
  badgeStatut: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  texteBadge: { fontSize: 11, fontWeight: '700' },
  descriptionCommande: { color: COULEURS.texteSecondaire, fontSize: 13 },
  grilleInformations: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  information: { flexBasis: '48%', flexGrow: 1 },
  libelleInformation: { fontSize: 11, color: COULEURS.texteSecondaire, textTransform: 'uppercase' },
  valeurInformation: { fontSize: 14, color: COULEURS.texte, fontWeight: '600', marginTop: 2 },
  barreProgression: { height: 8, backgroundColor: COULEURS.bordure, borderRadius: 4, overflow: 'hidden', marginTop: 4 },
  progression: { height: 8, backgroundColor: COULEURS.primaire, borderRadius: 4 },
  texteProgression: { fontSize: 12, color: COULEURS.texteSecondaire, textAlign: 'center' },
  titreSection: { fontSize: 16, fontWeight: '700', color: COULEURS.texte, marginTop: 6 },
  carte: { backgroundColor: COULEURS.carte, borderRadius: 14, padding: 14 },
  ligneTimeline: { flexDirection: 'row' },
  colonneJonction: { alignItems: 'center', width: 36 },
  cercleEtape: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  numeroEtape: { fontSize: 12, fontWeight: '800' },
  jonction: { width: 2, flex: 1, minHeight: 28 },
  contenuEtape: { flex: 1, paddingBottom: 18, paddingLeft: 4 },
  contenuEtapeActive: { backgroundColor: COULEURS.fondClair, borderRadius: 10, padding: 10, marginRight: 4 },
  enteteEtape: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  libelleEtape: { fontSize: 14, fontWeight: '600', color: COULEURS.texteSecondaire, flex: 1 },
  libelleEtapeRealisee: { color: COULEURS.texte },
  badgeActuel: { backgroundColor: COULEURS.primaire, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  texteBadgeActuel: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  lieuEtape: { fontSize: 12, color: COULEURS.texteSecondaire, marginTop: 2 },
  dateEtape: { fontSize: 11, color: COULEURS.texteSecondaire, marginTop: 1 },
  conteneurChat: { backgroundColor: COULEURS.carte, borderRadius: 14, padding: 14, gap: 10 },
  listeMessages: { height: 280, flexGrow: 0 },
  contenuListeMessages: { gap: 8, paddingVertical: 4 },
  chatVide: { textAlign: 'center', color: COULEURS.texteSecondaire, paddingVertical: 20 },
  bulleMessage: { maxWidth: '80%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  bulleClient: { alignSelf: 'flex-end', backgroundColor: COULEURS.primaire },
  bulleAdmin: { alignSelf: 'flex-start', backgroundColor: COULEURS.fond },
  texteBulleClient: { color: '#dbeafe' },
  texteBulleAdmin: { color: COULEURS.texte },
  auteurMessage: { fontSize: 10, fontWeight: '700' },
  contenuMessage: { fontSize: 14 },
  heureMessage: { fontSize: 10, alignSelf: 'flex-end' },
  texteErreurChat: { color: COULEURS.danger, fontSize: 12 },
  ligneSaisie: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  champMessage: {
    flex: 1,
    borderWidth: 1,
    borderColor: COULEURS.bordure,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: COULEURS.texte,
    backgroundColor: '#f8fafc',
    maxHeight: 100
  },
  boutonEnvoyer: { backgroundColor: COULEURS.primaire, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  boutonDesactive: { opacity: 0.5 },
  texteEnvoyer: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  conteneurPleinEcran: { flex: 1, backgroundColor: '#0b1a38' },
  entetePleinEcran: { padding: 14, paddingBottom: 10 },
  titrePleinEcran: { color: '#ffffff', fontWeight: '800', fontSize: 16, textAlign: 'center' },
  cartePleinEcran: { flex: 1 }
})
