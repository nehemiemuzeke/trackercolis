import type { Prisma } from '@prisma/client'
import type { UtilisateurAuthentifie } from '../domain/types'
import { versReponseCommande } from '../dto/reponses'
import { LISTE_STATUTS } from '../domain/workflow'
import { depotCommandes } from '../repositories/commande.repository'

export interface StatistiquesTableauDeBord {
  total: number
  en_attente: number
  en_transit: number
  livrees: number
  montant_total_usd: number
  par_statut: Record<string, number>
}

export interface DependancesServiceTableauDeBord {
  depotCommandes: typeof depotCommandes
}

export function creerServiceTableauDeBord(dependances: DependancesServiceTableauDeBord = { depotCommandes }) {
  function porteeParRole(utilisateur: UtilisateurAuthentifie): Prisma.CommandeWhereInput {
    if (utilisateur.role === 'ADMIN_CHINE') {
      return { etape_actuelle: { gte: 3 } }
    }
    return {}
  }

  async function obtenirStatistiques(utilisateur: UtilisateurAuthentifie): Promise<StatistiquesTableauDeBord> {
    const where = porteeParRole(utilisateur)
    const [compteurParStatut, total, montantTotal] = await Promise.all([
      dependances.depotCommandes.compterParStatut(where),
      dependances.depotCommandes.compter(where),
      dependances.depotCommandes.sommerMontantTotal(where)
    ])
    const parStatut: Record<string, number> = {}
    for (const statut of LISTE_STATUTS) {
      parStatut[statut] = compteurParStatut[statut] ?? 0
    }
    return {
      total,
      en_attente:
        parStatut.COMMANDE_CREEE +
        parStatut.COMMANDE_VALIDEE_RDC +
        parStatut.TRANSMISE_CHINE +
        parStatut.ACCEPTEE_CHINE +
        parStatut.COLIS_PREPARE,
      en_transit: parStatut.EXPEDIE_CHINE + parStatut.EN_TRANSIT,
      livrees: parStatut.LIVRE,
      montant_total_usd: Math.round(montantTotal * 100) / 100,
      par_statut: parStatut
    }
  }

  async function listerRecentes(utilisateur: UtilisateurAuthentifie, limit: number) {
    const lignes = await dependances.depotCommandes.listerRecentes(limit, porteeParRole(utilisateur))
    return lignes.map((ligne) => versReponseCommande(ligne, utilisateur.role))
  }

  return { obtenirStatistiques, listerRecentes }
}

export const serviceTableauDeBord = creerServiceTableauDeBord()
