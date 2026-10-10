import type { Role, StatutCommande, TypeActeur } from '@prisma/client'
import {
  POSITION_ADRESSE_CLIENT,
  POSITION_AEROPORT_BAIYUN,
  POSITION_GUANGZHOU,
  POSITION_KINSHASA_CENTRE,
  POSITION_NDJILI,
  POINTS_TRANSIT
} from './geo'

export interface DefinitionEtape {
  numero: number
  statut: StatutCommande
  label: string
  description: string
  lieu: string
  latitude: number | null
  longitude: number | null
  type_acteur: TypeActeur
}

export const ETAPES: readonly DefinitionEtape[] = [
  {
    numero: 1,
    statut: 'COMMANDE_CREEE',
    label: 'Commande créée',
    description: 'Commande enregistrée par le client depuis Kinshasa',
    lieu: 'Kinshasa',
    latitude: POSITION_KINSHASA_CENTRE.latitude,
    longitude: POSITION_KINSHASA_CENTRE.longitude,
    type_acteur: 'CLIENT'
  },
  {
    numero: 2,
    statut: 'COMMANDE_VALIDEE_RDC',
    label: 'Commande validée par la RDC',
    description: 'Commande vérifiée et validée par l\'équipe RDC',
    lieu: 'Kinshasa',
    latitude: POSITION_KINSHASA_CENTRE.latitude,
    longitude: POSITION_KINSHASA_CENTRE.longitude,
    type_acteur: 'ADMIN_RDC'
  },
  {
    numero: 3,
    statut: 'TRANSMISE_CHINE',
    label: 'Transmise à l\'équipe Chine',
    description: 'Commande transmise à l\'équipe Chine pour traitement',
    lieu: 'Digital',
    latitude: null,
    longitude: null,
    type_acteur: 'ADMIN_RDC'
  },
  {
    numero: 4,
    statut: 'ACCEPTEE_CHINE',
    label: 'Acceptée par la Chine',
    description: 'Commande prise en charge par l\'équipe de Guangzhou',
    lieu: 'Guangzhou',
    latitude: POSITION_GUANGZHOU.latitude,
    longitude: POSITION_GUANGZHOU.longitude,
    type_acteur: 'ADMIN_CHINE'
  },
  {
    numero: 5,
    statut: 'COLIS_PREPARE',
    label: 'Colis préparé',
    description: 'Colis préparé dans l\'entrepôt de Guangzhou',
    lieu: 'Guangzhou',
    latitude: POSITION_GUANGZHOU.latitude,
    longitude: POSITION_GUANGZHOU.longitude,
    type_acteur: 'ADMIN_CHINE'
  },
  {
    numero: 6,
    statut: 'EXPEDIE_CHINE',
    label: 'Expédié de Chine',
    description: 'Colis remis à l\'aéroport international Baiyun',
    lieu: 'Aéroport Baiyun',
    latitude: POSITION_AEROPORT_BAIYUN.latitude,
    longitude: POSITION_AEROPORT_BAIYUN.longitude,
    type_acteur: 'ADMIN_CHINE'
  },
  {
    numero: 7,
    statut: 'EN_TRANSIT',
    label: 'En transit international',
    description: 'Colis en vol international vers Kinshasa',
    lieu: POINTS_TRANSIT[0].label,
    latitude: POINTS_TRANSIT[0].latitude,
    longitude: POINTS_TRANSIT[0].longitude,
    type_acteur: 'SYSTEME'
  },
  {
    numero: 8,
    statut: 'ARRIVE_RDC',
    label: 'Arrivé en RDC',
    description: 'Colis arrivé à l\'aéroport de N\'djili',
    lieu: "Aéroport N'djili",
    latitude: POSITION_NDJILI.latitude,
    longitude: POSITION_NDJILI.longitude,
    type_acteur: 'ADMIN_RDC'
  },
  {
    numero: 9,
    statut: 'EN_LIVRAISON',
    label: 'En livraison',
    description: 'Colis confié à l\'équipe de livraison locale',
    lieu: 'Kinshasa',
    latitude: POSITION_KINSHASA_CENTRE.latitude,
    longitude: POSITION_KINSHASA_CENTRE.longitude,
    type_acteur: 'ADMIN_RDC'
  },
  {
    numero: 10,
    statut: 'LIVRE',
    label: 'Livré',
    description: 'Colis livré à l\'adresse du client',
    lieu: 'Adresse client',
    latitude: POSITION_ADRESSE_CLIENT.latitude,
    longitude: POSITION_ADRESSE_CLIENT.longitude,
    type_acteur: 'ADMIN_RDC'
  }
]

export const ETAPE_INITIALE = ETAPES[0]
export const ETAPE_FINALE = ETAPES[ETAPES.length - 1]

export const LISTE_STATUTS = [
  'COMMANDE_CREEE',
  'COMMANDE_VALIDEE_RDC',
  'TRANSMISE_CHINE',
  'ACCEPTEE_CHINE',
  'COLIS_PREPARE',
  'EXPEDIE_CHINE',
  'EN_TRANSIT',
  'ARRIVE_RDC',
  'EN_LIVRAISON',
  'LIVRE'
] as const

const verificationExhaustivite: readonly StatutCommande[] = LISTE_STATUTS
export { verificationExhaustivite as statutsCommandeComplets }

const etapesParStatut = new Map<StatutCommande, DefinitionEtape>(ETAPES.map((etape) => [etape.statut, etape]))

export function etapeParStatut(statut: StatutCommande): DefinitionEtape {
  const etape = etapesParStatut.get(statut)
  if (!etape) {
    throw new Error(`statut_commande_inconnu_${statut}`)
  }
  return etape
}

export interface DefinitionTransition {
  statut_source: StatutCommande
  statut_cible: StatutCommande
  roles_autorises: readonly Role[]
  libelle_action: string
  chemin_action: string
}

export const TRANSITIONS: readonly DefinitionTransition[] = [
  {
    statut_source: 'COMMANDE_CREEE',
    statut_cible: 'COMMANDE_VALIDEE_RDC',
    roles_autorises: ['ADMIN_RDC'],
    libelle_action: 'Valider la commande',
    chemin_action: '/api/admin-rdc/commandes/{id}/valider'
  },
  {
    statut_source: 'COMMANDE_VALIDEE_RDC',
    statut_cible: 'TRANSMISE_CHINE',
    roles_autorises: ['ADMIN_RDC'],
    libelle_action: 'Transmettre en Chine',
    chemin_action: '/api/admin-rdc/commandes/{id}/transmettre'
  },
  {
    statut_source: 'TRANSMISE_CHINE',
    statut_cible: 'ACCEPTEE_CHINE',
    roles_autorises: ['ADMIN_CHINE'],
    libelle_action: 'Accepter la commande',
    chemin_action: '/api/admin-chine/commandes/{id}/accepter'
  },
  {
    statut_source: 'ACCEPTEE_CHINE',
    statut_cible: 'COLIS_PREPARE',
    roles_autorises: ['ADMIN_CHINE'],
    libelle_action: 'Marquer le colis préparé',
    chemin_action: '/api/admin-chine/commandes/{id}/preparer'
  },
  {
    statut_source: 'COLIS_PREPARE',
    statut_cible: 'EXPEDIE_CHINE',
    roles_autorises: ['ADMIN_CHINE'],
    libelle_action: 'Marquer le colis expédié',
    chemin_action: '/api/admin-chine/commandes/{id}/expedier'
  },
  {
    statut_source: 'EXPEDIE_CHINE',
    statut_cible: 'EN_TRANSIT',
    roles_autorises: ['ADMIN_CHINE'],
    libelle_action: 'Lancer le transit international',
    chemin_action: '/api/admin-chine/commandes/{id}/transit'
  },
  {
    statut_source: 'EN_TRANSIT',
    statut_cible: 'ARRIVE_RDC',
    roles_autorises: ['ADMIN_RDC'],
    libelle_action: "Confirmer l'arrivée en RDC",
    chemin_action: '/api/admin-rdc/commandes/{id}/arrivee'
  },
  {
    statut_source: 'ARRIVE_RDC',
    statut_cible: 'EN_LIVRAISON',
    roles_autorises: ['ADMIN_RDC'],
    libelle_action: 'Lancer la livraison',
    chemin_action: '/api/admin-rdc/commandes/{id}/livraison'
  },
  {
    statut_source: 'EN_LIVRAISON',
    statut_cible: 'LIVRE',
    roles_autorises: ['ADMIN_RDC'],
    libelle_action: 'Confirmer la livraison',
    chemin_action: '/api/admin-rdc/commandes/{id}/livrer'
  }
]

export const ACTION_PAR_CIBLE: Record<string, string> = {
  COMMANDE_VALIDEE_RDC: 'valider',
  TRANSMISE_CHINE: 'transmettre',
  ACCEPTEE_CHINE: 'accepter',
  COLIS_PREPARE: 'preparer',
  EXPEDIE_CHINE: 'expedier',
  EN_TRANSIT: 'transit',
  ARRIVE_RDC: 'arrivee',
  EN_LIVRAISON: 'livraison',
  LIVRE: 'livrer'
}

const transitionsParSource = new Map<StatutCommande, DefinitionTransition>(
  TRANSITIONS.map((transition) => [transition.statut_source, transition])
)

const transitionsParCible = new Map<StatutCommande, DefinitionTransition>(
  TRANSITIONS.map((transition) => [transition.statut_cible, transition])
)

export function transitionVers(statutCible: StatutCommande): DefinitionTransition | undefined {
  return transitionsParCible.get(statutCible)
}

export function transitionDependant(statutSource: StatutCommande): DefinitionTransition | undefined {
  return transitionsParSource.get(statutSource)
}

export interface ActionDisponible {
  action: string
  libelle: string
  chemin: string
}

export function actionsDisponibles(statutActuel: StatutCommande, role: Role, commandeId: string): ActionDisponible[] {
  const transition = transitionDependant(statutActuel)
  if (!transition || !transition.roles_autorises.includes(role)) {
    return []
  }
  const action = ACTION_PAR_CIBLE[transition.statut_cible]
  if (!action) {
    return []
  }
  return [
    {
      action,
      libelle: transition.libelle_action,
      chemin: transition.chemin_action.replace('{id}', commandeId)
    }
  ]
}
