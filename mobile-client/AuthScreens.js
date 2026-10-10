import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { api, COULEURS, extraireMessageErreur, stockageSession } from './api'
import { stockageDurable } from './stockageDurable'

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGEX_TELEPHONE = /^\+?[0-9]{8,15}$/

function Champ({ label, valeur, changerValeur, options, erreur }) {
  return (
    <View style={styles.groupeChamp}>
      <Text style={styles.libelle}>{label}</Text>
      <TextInput
        style={[styles.champ, erreur ? styles.champErreur : null]}
        value={valeur}
        onChangeText={changerValeur}
        placeholderTextColor={COULEURS.texteSecondaire}
        {...options}
      />
      {erreur ? <Text style={styles.texteErreur}>{erreur}</Text> : null}
    </View>
  )
}

export function EcranConnexion({ seConnecter }) {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [seSouvenir, setSeSouvenir] = useState(false)
  const [erreurs, setErreurs] = useState({})
  const [chargement, setChargement] = useState(false)
  const [erreurGenerale, setErreurGenerale] = useState('')

  // Charger automatiquement les identifiants si déjà enregistrés
  useEffect(() => {
    async function chargerIdentifiants() {
      try {
        const identifiants = await stockageDurable.lire('colis_rdc.identifiants')
        if (identifiants) {
          const { emailSauve, motDePasseSauve } = JSON.parse(identifiants)
          setEmail(emailSauve || '')
          setMotDePasse(motDePasseSauve || '')
          setSeSouvenir(true)
        }
      } catch {
        // En cas d'erreur de lecture du stockage, ignorer
      }
    }
    void chargerIdentifiants()
  }, [])

  async function soumettre() {
    const anomalies = {}
    if (!REGEX_EMAIL.test(email)) {
      anomalies.email = 'Adresse email invalide'
    }
    if (motDePasse.length < 1) {
      anomalies.motDePasse = 'Mot de passe requis'
    }

    setErreurs(anomalies)
    if (Object.keys(anomalies).length > 0) {
      return
    }

    setChargement(true)
    setErreurGenerale('')
    try {
      if (seSouvenir) {
        await stockageDurable.ecrire(
          'colis_rdc.identifiants',
          JSON.stringify({
            emailSauve: email.trim().toLowerCase(),
            motDePasseSauve: motDePasse
          })
        )
      } else {
        await stockageDurable.supprimer('colis_rdc.identifiants')
      }

      const resultat = await api.connexion({ email: email.trim().toLowerCase(), mot_de_passe: motDePasse })
      await stockageSession.enregistrerJetons(resultat.jeton_acces, resultat.jeton_rafraichissement)
      await stockageSession.enregistrerUtilisateur(resultat.utilisateur)
      seConnecter(resultat.utilisateur, resultat.jeton_acces)
    } catch (erreur) {
      setErreurGenerale(extraireMessageErreur(erreur))
    } finally {
      setChargement(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <Text style={styles.titre}>Colis RDC</Text>
        <Text style={styles.sousTitre}>Suivez vos colis entre la RDC et la Chine</Text>
        <View style={styles.carte}>
          <Champ
            label="Adresse email"
            valeur={email}
            changerValeur={setEmail}
            erreur={erreurs.email}
            options={{ keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false }}
          />
          <Champ
            label="Mot de passe"
            valeur={motDePasse}
            changerValeur={setMotDePasse}
            erreur={erreurs.motDePasse}
            options={{ secureTextEntry: true }}
          />

          {/* Case à cocher : Se souvenir de moi */}
          <TouchableOpacity
            style={styles.ligneSeSouvenir}
            onPress={() => setSeSouvenir(!seSouvenir)}
            activeOpacity={0.7}
          >
            <View style={[styles.caseCochee, seSouvenir ? styles.caseCocheeActive : null]}>
              {seSouvenir ? <Text style={styles.iconeCoche}>✓</Text> : null}
            </View>
            <Text style={styles.texteSeSouvenir}>Se souvenir de moi</Text>
          </TouchableOpacity>

          {erreurGenerale ? <Text style={styles.texteErreurGenerale}>{erreurGenerale}</Text> : null}
          <TouchableOpacity
            style={[styles.boutonPrincipal, chargement ? styles.boutonDesactive : null]}
            onPress={soumettre}
            disabled={chargement}
          >
            {chargement ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.texteBoutonPrincipal}>Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export function EcranInscription({ seConnecter }) {
  const [formulaire, setFormulaire] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: 'Kinshasa',
    mot_de_passe: '',
    confirmation: ''
  })
  const [erreurs, setErreurs] = useState({})
  const [chargement, setChargement] = useState(false)
  const [erreurGenerale, setErreurGenerale] = useState('')

  function changerChamp(champ, valeur) {
    setFormulaire((precedent) => ({ ...precedent, [champ]: valeur }))
  }

  function valider() {
    const anomalies = {}
    if (formulaire.prenom.trim().length < 2) {
      anomalies.prenom = 'Prénom requis (2 caractères minimum)'
    }
    if (formulaire.nom.trim().length < 2) {
      anomalies.nom = 'Nom requis (2 caractères minimum)'
    }
    if (!REGEX_EMAIL.test(formulaire.email)) {
      anomalies.email = 'Adresse email invalide'
    }
    if (!REGEX_TELEPHONE.test(formulaire.telephone)) {
      anomalies.telephone = 'Numéro de téléphone invalide (ex: +243810000000)'
    }
    if (formulaire.adresse.trim().length < 5) {
      anomalies.adresse = 'Adresse de livraison requise'
    }
    if (
      formulaire.mot_de_passe.length < 8 ||
      !/[A-Za-z]/.test(formulaire.mot_de_passe) ||
      !/[0-9]/.test(formulaire.mot_de_passe)
    ) {
      anomalies.mot_de_passe = '8 caractères minimum, avec au moins une lettre et un chiffre'
    }
    if (formulaire.confirmation !== formulaire.mot_de_passe) {
      anomalies.confirmation = 'Les mots de passe ne correspondent pas'
    }
    return anomalies
  }

  async function soumettre() {
    const anomalies = valider()
    setErreurs(anomalies)
    if (Object.keys(anomalies).length > 0) {
      return
    }
    setChargement(true)
    setErreurGenerale('')
    try {
      const donnees = {
        prenom: formulaire.prenom.trim(),
        nom: formulaire.nom.trim(),
        email: formulaire.email.trim().toLowerCase(),
        telephone: formulaire.telephone.trim(),
        adresse: formulaire.adresse.trim(),
        ville: formulaire.ville.trim(),
        pays: 'RD Congo',
        mot_de_passe: formulaire.mot_de_passe
      }
      const resultat = await api.inscription(donnees)
      await stockageSession.enregistrerJetons(resultat.jeton_acces, resultat.jeton_rafraichissement)
      await stockageSession.enregistrerUtilisateur(resultat.utilisateur)
      seConnecter(resultat.utilisateur, resultat.jeton_acces)
    } catch (erreur) {
      setErreurGenerale(extraireMessageErreur(erreur))
    } finally {
      setChargement(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        <Text style={styles.titre}>Créer un compte</Text>
        <Text style={styles.sousTitre}>Commandez et suivez vos colis en temps réel</Text>
        <View style={styles.carte}>
          <Champ label="Prénom" valeur={formulaire.prenom} changerValeur={(v) => changerChamp('prenom', v)} erreur={erreurs.prenom} />
          <Champ label="Nom" valeur={formulaire.nom} changerValeur={(v) => changerChamp('nom', v)} erreur={erreurs.nom} />
          <Champ
            label="Adresse email"
            valeur={formulaire.email}
            changerValeur={(v) => changerChamp('email', v)}
            erreur={erreurs.email}
            options={{ keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false }}
          />
          <Champ
            label="Téléphone"
            valeur={formulaire.telephone}
            changerValeur={(v) => changerChamp('telephone', v)}
            erreur={erreurs.telephone}
            options={{ keyboardType: 'phone-pad' }}
          />
          <Champ label="Adresse de livraison" valeur={formulaire.adresse} changerValeur={(v) => changerChamp('adresse', v)} erreur={erreurs.adresse} />
          <Champ label="Ville" valeur={formulaire.ville} changerValeur={(v) => changerChamp('ville', v)} erreur={erreurs.ville} />
          <Champ
            label="Mot de passe"
            valeur={formulaire.mot_de_passe}
            changerValeur={(v) => changerChamp('mot_de_passe', v)}
            erreur={erreurs.mot_de_passe}
            options={{ secureTextEntry: true }}
          />
          <Champ
            label="Confirmer le mot de passe"
            valeur={formulaire.confirmation}
            changerValeur={(v) => changerChamp('confirmation', v)}
            erreur={erreurs.confirmation}
            options={{ secureTextEntry: true }}
          />
          {erreurGenerale ? <Text style={styles.texteErreurGenerale}>{erreurGenerale}</Text> : null}
          <TouchableOpacity
            style={[styles.boutonPrincipal, chargement ? styles.boutonDesactive : null]}
            onPress={soumettre}
            disabled={chargement}
          >
            {chargement ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.texteBoutonPrincipal}>Créer mon compte</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: COULEURS.primaire },
  contenu: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  titre: { fontSize: 32, fontWeight: '700', color: '#ffffff', textAlign: 'center' },
  sousTitre: { fontSize: 15, color: '#bfdbfe', textAlign: 'center', marginBottom: 24, marginTop: 6 },
  carte: { backgroundColor: COULEURS.carte, borderRadius: 16, padding: 20, gap: 4 },
  groupeChamp: { marginBottom: 12 },
  libelle: { fontSize: 13, fontWeight: '600', color: COULEURS.texte, marginBottom: 6 },
  champ: {
    borderWidth: 1,
    borderColor: COULEURS.bordure,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COULEURS.texte,
    backgroundColor: '#f8fafc'
  },
  champErreur: { borderColor: COULEURS.danger },
  texteErreur: { color: COULEURS.danger, fontSize: 12, marginTop: 4 },
  texteErreurGenerale: { color: COULEURS.danger, fontSize: 13, marginBottom: 8, textAlign: 'center' },
  ligneSeSouvenir: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 4,
    gap: 8
  },
  caseCochee: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COULEURS.primaire,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  caseCocheeActive: {
    backgroundColor: COULEURS.primaire
  },
  iconeCoche: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  texteSeSouvenir: {
    color: COULEURS.texteSecondaire,
    fontSize: 14
  },
  boutonPrincipal: {
    backgroundColor: COULEURS.primaire,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  boutonDesactive: { opacity: 0.6 },
  texteBoutonPrincipal: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
})