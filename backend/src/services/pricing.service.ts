import type { FraisCalcules, TarifsLivraison } from '../domain/types'

function arrondirUsd(valeur: number): number {
  return Math.round(valeur * 100) / 100
}

export function calculerFrais(donnees: { poids_estime_kg: number; valeur_declaree_usd: number }, tarifs: TarifsLivraison): FraisCalcules {
  const fraisServiceUsd = arrondirUsd(tarifs.frais_service_base_usd + donnees.poids_estime_kg * tarifs.frais_service_par_kg_usd)
  const fraisLivraisonUsd = arrondirUsd(tarifs.frais_livraison_base_usd + donnees.poids_estime_kg * tarifs.frais_livraison_par_kg_usd)
  const montantTotalUsd = arrondirUsd(donnees.valeur_declaree_usd + fraisServiceUsd + fraisLivraisonUsd)
  return {
    frais_service_usd: fraisServiceUsd,
    frais_livraison_usd: fraisLivraisonUsd,
    montant_total_usd: montantTotalUsd
  }
}
