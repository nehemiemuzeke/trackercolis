import * as SecureStore from 'expo-secure-store'

export const stockageDurable = {
  lire(cle) {
    return SecureStore.getItemAsync(cle)
  },
  ecrire(cle, valeur) {
    return SecureStore.setItemAsync(cle, valeur)
  },
  supprimer(cle) {
    return SecureStore.deleteItemAsync(cle)
  }
}
