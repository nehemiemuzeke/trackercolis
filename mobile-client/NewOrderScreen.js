import React, { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import api, {
  CATEGORIES_PRODUIT,
  COULEURS,
  extraireMessageErreur,
  formaterCDF,
  LIBELLES_CATEGORIE
} from './api'

export default function EcranNouvelleCommande({ route, navigation }) {
  const produit = route?.params?.produitPreRempli

  const [formulaire, setFormulaire] = useState({
    description_produit: produit ? produit.nom : '',
    categorie_produit: 'ELECTRONIQUE',
    quantite: '1',
    poids_estime_kg: produit ? String(produit.poids_kg ?? 0.5) : '',
    valeur_declaree_usd: produit ? String(produit.prix_promo_usd ?? produit.prix_usd ?? '') : '',
    adresse_livraison: '',
    ville_livraison: 'Kinshasa',
    notes_client: produit ? `Commande catalogue Réf: ${produit.reference || produit.id}` : ''
  })
  const [erreurs, setErreurs] = useState({})
  const [chargement, setChargement] = useState(false)
  const [erreurGenerale, setErreurGenerale] = useState('')

  function changerChamp(champ, valeur) {
    setFormulaire((precedent) => ({ ...precedent, [champ]: valeur }))
  }

  function valider() {
    const anomalies = {}
    if (formulaire.description_produit.trim().length < 3) {
      anomalies.description_produit = 'Décrivez le produit (3 caractères minimum)'
    }
    const quantite = Number(formulaire.quantite)
    if (!Number.isInteger(quantite) || quantite < 1 || quantite > 1000) {
      anomalies.quantite = 'Quantité entre 1 et 1000'
    }
    const poids = Number(formulaire.poids_estime_kg)
    if (Number.isNaN(poids) || poids < 0.1 || poids > 500) {
      anomalies.poids_estime_kg = 'Poids entre 0,1 et 500 kg'
    }
    const valeur = Number(formulaire.valeur_declaree_usd)
    if (Number.isNaN(valeur) || valeur < 1 || valeur > 100000) {
      anomalies.valeur_declaree_usd = 'Valeur entre 1 et 100 000 USD'
    }
    if (formulaire.adresse_livraison.trim().length < 5) {
      anomalies.adresse_livraison = 'Adresse de livraison requise'
    }
    if (formulaire.ville_livraison.trim().length < 2) {
      anomalies.ville_livraison = 'Ville de livraison requise'
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
      const commande = await api.creerCommande({
        description_produit: formulaire.description_produit.trim(),
        categorie_produit: formulaire.categorie_produit,
        quantite: Number(formulaire.quantite),
        poids_estime_kg: Number(formulaire.poids_estime_kg),
        valeur_declaree_usd: Number(formulaire.valeur_declaree_usd),
        adresse_livraison: formulaire.adresse_livraison.trim(),
        ville_livraison: formulaire.ville_livraison.trim(),
        notes_client: formulaire.notes_client.trim() || undefined
      })
      navigation.replace('Suivi', { commandeId: commande.id })
    } catch (erreur) {
      setErreurGenerale(extraireMessageErreur(erreur))
    } finally {
      setChargement(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.conteneur}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        {/* Encart informatif si l'article provient de la boutique */}
        {produit ? (
          <View style={styles.encartProduit}>
            <Text style={styles.titreEncart}>📦 Produit sélectionné depuis la boutique</Text>
            <Text style={styles.texteEncartNom}>{produit.nom}</Text>
            <Text style={styles.texteEncartRef}>
              Réf : {produit.reference || produit.id}
            </Text>
          </View>
        ) : null}

        <View style={styles.carte}>
          <Text style={styles.libelle}>Description du produit *</Text>
          <TextInput
            style={[styles.champ, erreurs.description_produit ? styles.champErreur : null]}
            value={formulaire.description_produit}
            onChangeText={(v) => changerChamp('description_produit', v)}
            placeholder="Ex: Smartphones Xiaomi Redmi Note 13"
            placeholderTextColor={COULEURS.texteSecondaire}
            multiline
          />
          {erreurs.description_produit ? <Text style={styles.texteErreur}>{erreurs.description_produit}</Text> : null}

          <Text style={styles.libelle}>Catégorie</Text>
          <View style={styles.grilleCategories}>
            {CATEGORIES_PRODUIT.map((categorie) => (
              <TouchableOpacity
                key={categorie}
                style={[
                  styles.puceCategorie,
                  formulaire.categorie_produit === categorie ? styles.puceCategorieActive : null
                ]}
                onPress={() => changerChamp('categorie_produit', categorie)}
              >
                <Text
                  style={[
                    styles.textePuce,
                    formulaire.categorie_produit === categorie ? styles.textePuceActive : null
                  ]}
                >
                  {LIBELLES_CATEGORIE[categorie]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.ligneDeuxChamps}>
            <View style={styles.demiChamp}>
              <Text style={styles.libelle}>Quantité *</Text>
              <TextInput
                style={[styles.champ, erreurs.quantite ? styles.champErreur : null]}
                value={formulaire.quantite}
                onChangeText={(v) => changerChamp('quantite', v)}
                keyboardType="number-pad"
              />
              {erreurs.quantite ? <Text style={styles.texteErreur}>{erreurs.quantite}</Text> : null}
            </View>
            <View style={styles.demiChamp}>
              <Text style={styles.libelle}>Poids estimé (kg) *</Text>
              <TextInput
                style={[styles.champ, erreurs.poids_estime_kg ? styles.champErreur : null]}
                value={formulaire.poids_estime_kg}
                onChangeText={(v) => changerChamp('poids_estime_kg', v)}
                keyboardType="decimal-pad"
              />
              {erreurs.poids_estime_kg ? <Text style={styles.texteErreur}>{erreurs.poids_estime_kg}</Text> : null}
            </View>
          </View>

          <Text style={styles.libelle}>Valeur déclarée (USD) *</Text>
          <TextInput
            style={[styles.champ, erreurs.valeur_declaree_usd ? styles.champErreur : null]}
            value={formulaire.valeur_declaree_usd}
            onChangeText={(v) => changerChamp('valeur_declaree_usd', v)}
            keyboardType="decimal-pad"
          />
          {formulaire.valeur_declaree_usd && !Number.isNaN(Number(formulaire.valeur_declaree_usd)) ? (
            <Text style={styles.texteEquivalentCDF}>
              Soit ≈ {formaterCDF(Number(formulaire.valeur_declaree_usd))}
            </Text>
          ) : null}
          {erreurs.valeur_declaree_usd ? <Text style={styles.texteErreur}>{erreurs.valeur_declaree_usd}</Text> : null}

          <Text style={styles.libelle}>Adresse de livraison à Kinshasa *</Text>
          <TextInput
            style={[styles.champ, erreurs.adresse_livraison ? styles.champErreur : null]}
            value={formulaire.adresse_livraison}
            onChangeText={(v) => changerChamp('adresse_livraison', v)}
            placeholder="Ex: 12, Avenue Kasa-Vubu, Gombe"
            placeholderTextColor={COULEURS.texteSecondaire}
            multiline
          />
          {erreurs.adresse_livraison ? <Text style={styles.texteErreur}>{erreurs.adresse_livraison}</Text> : null}

          <Text style={styles.libelle}>Ville de livraison *</Text>
          <TextInput
            style={[styles.champ, erreurs.ville_livraison ? styles.champErreur : null]}
            value={formulaire.ville_livraison}
            onChangeText={(v) => changerChamp('ville_livraison', v)}
          />
          {erreurs.ville_livraison ? <Text style={styles.texteErreur}>{erreurs.ville_livraison}</Text> : null}

          <Text style={styles.libelle}>Notes pour l'équipe (facultatif)</Text>
          <TextInput
            style={styles.champ}
            value={formulaire.notes_client}
            onChangeText={(v) => changerChamp('notes_client', v)}
            placeholder="Ex: emballage renforcé souhaité"
            placeholderTextColor={COULEURS.texteSecondaire}
            multiline
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
              <Text style={styles.texteBoutonPrincipal}>Créer la commande</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: COULEURS.fond },
  contenu: { padding: 16, paddingBottom: 40 },
  encartProduit: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  titreEncart: { fontSize: 13, fontWeight: '700', color: COULEURS.primaire, marginBottom: 2 },
  texteEncartNom: { fontSize: 15, fontWeight: 'bold', color: COULEURS.texte },
  texteEncartRef: { fontSize: 12, color: COULEURS.texteSecondaire, marginTop: 2 },
  carte: { backgroundColor: COULEURS.carte, borderRadius: 16, padding: 18, gap: 4 },
  libelle: { fontSize: 13, fontWeight: '600', color: COULEURS.texte, marginBottom: 6, marginTop: 10 },
  champ: {
    borderWidth: 1,
    borderColor: COULEURS.bordure,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COULEURS.texte,
    backgroundColor: '#f8fafc'
  },
  texteEquivalentCDF: {
    fontSize: 12,
    color: COULEURS.primaire,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2
  },
  champErreur: { borderColor: COULEURS.danger },
  texteErreur: { color: COULEURS.danger, fontSize: 12, marginTop: 4 },
  texteErreurGenerale: { color: COULEURS.danger, fontSize: 13, textAlign: 'center', marginTop: 10 },
  grilleCategories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  puceCategorie: {
    borderWidth: 1,
    borderColor: COULEURS.bordure,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#f8fafc'
  },
  puceCategorieActive: { backgroundColor: COULEURS.primaire, borderColor: COULEURS.primaire },
  textePuce: { fontSize: 13, color: COULEURS.texteSecondaire, fontWeight: '600' },
  textePuceActive: { color: '#ffffff' },
  ligneDeuxChamps: { flexDirection: 'row', gap: 12 },
  demiChamp: { flex: 1 },
  boutonPrincipal: {
    backgroundColor: COULEURS.primaire,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18
  },
  boutonDesactive: { opacity: 0.6 },
  texteBoutonPrincipal: { color: '#ffffff', fontSize: 16, fontWeight: '700' }
})