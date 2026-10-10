import { describe, expect, it } from 'vitest'
import { calculerFrais } from '../src/services/pricing.service'
import type { TarifsLivraison } from '../src/domain/types'

const tarifs: TarifsLivraison = {
  frais_service_base_usd: 10,
  frais_service_par_kg_usd: 2.5,
  frais_livraison_base_usd: 5,
  frais_livraison_par_kg_usd: 1.5
}

describe('calculerFrais', () => {
  it('calcule les frais pour un colis standard', () => {
    const resultat = calculerFrais({ poids_estime_kg: 10, valeur_declaree_usd: 200 }, tarifs)
    expect(resultat.frais_service_usd).toBe(35)
    expect(resultat.frais_livraison_usd).toBe(20)
    expect(resultat.montant_total_usd).toBe(255)
  })

  it('calcule les frais pour un colis léger', () => {
    const resultat = calculerFrais({ poids_estime_kg: 0.5, valeur_declaree_usd: 50 }, tarifs)
    expect(resultat.frais_service_usd).toBe(11.25)
    expect(resultat.frais_livraison_usd).toBe(5.75)
    expect(resultat.montant_total_usd).toBe(67)
  })

  it('arrondit les montants à deux décimales', () => {
    const resultat = calculerFrais({ poids_estime_kg: 3.333, valeur_declaree_usd: 99.999 }, tarifs)
    for (const valeur of [resultat.frais_service_usd, resultat.frais_livraison_usd, resultat.montant_total_usd]) {
      expect(Number(valeur.toFixed(2))).toBe(valeur)
    }
  })

  it('sépare correctement service, livraison et valeur déclarée', () => {
    const resultat = calculerFrais({ poids_estime_kg: 4, valeur_declaree_usd: 100 }, tarifs)
    expect(resultat.frais_service_usd).toBe(20)
    expect(resultat.frais_livraison_usd).toBe(11)
    expect(resultat.montant_total_usd).toBe(resultat.frais_service_usd + resultat.frais_livraison_usd + 100)
  })
})
