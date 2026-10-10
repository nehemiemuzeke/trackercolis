function ouvrirStockageNavigateur() {
  try {
    const sonde = 'colis_rdc.probe'
    window.localStorage.setItem(sonde, '1')
    window.localStorage.removeItem(sonde)
    return window.localStorage
  } catch {
    return null
  }
}

const stockageNavigateur = typeof window !== 'undefined' ? ouvrirStockageNavigateur() : null
const memoire = new Map()

export const stockageDurable = {
  async lire(cle) {
    if (stockageNavigateur) {
      return stockageNavigateur.getItem(cle)
    }
    return memoire.has(cle) ? memoire.get(cle) : null
  },
  async ecrire(cle, valeur) {
    if (stockageNavigateur) {
      stockageNavigateur.setItem(cle, valeur)
      return
    }
    memoire.set(cle, valeur)
  },
  async supprimer(cle) {
    if (stockageNavigateur) {
      stockageNavigateur.removeItem(cle)
      return
    }
    memoire.delete(cle)
  }
}
