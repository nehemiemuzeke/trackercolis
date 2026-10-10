import { describe, expect, it } from 'vitest'
import {
  ACTION_PAR_CIBLE,
  ETAPES,
  LISTE_STATUTS,
  TRANSITIONS,
  actionsDisponibles,
  transitionDependant,
  transitionVers
} from '../src/domain/workflow'
import { POINTS_TRANSIT, ROUTE_AERIENNE } from '../src/domain/geo'

describe('définition des étapes', () => {
  it('définit exactement 10 étapes numérotées séquentiellement', () => {
    expect(ETAPES).toHaveLength(10)
    expect(ETAPES.map((etape) => etape.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('définit des statuts uniques couvrant la liste complète', () => {
    const statuts = ETAPES.map((etape) => etape.statut)
    expect(new Set(statuts).size).toBe(10)
    expect(statuts).toEqual([...LISTE_STATUTS])
  })

  it('associe des coordonnées GPS à chaque étape sauf la transmission digitale', () => {
    for (const etape of ETAPES) {
      if (etape.statut === 'TRANSMISE_CHINE') {
        expect(etape.latitude).toBeNull()
        expect(etape.longitude).toBeNull()
      } else {
        expect(typeof etape.latitude).toBe('number')
        expect(typeof etape.longitude).toBe('number')
      }
    }
  })

  it('positionne l\'étape de transit sur le premier point du vol', () => {
    const etapeTransit = ETAPES.find((etape) => etape.statut === 'EN_TRANSIT')
    expect(etapeTransit?.latitude).toBe(POINTS_TRANSIT[0].latitude)
    expect(etapeTransit?.longitude).toBe(POINTS_TRANSIT[0].longitude)
  })
})

describe('machine à états', () => {
  it('définit une chaîne complète de 9 transitions depuis COMMANDE_CREEE jusqu\'à LIVRE', () => {
    expect(TRANSITIONS).toHaveLength(9)
    let statutCourant = 'COMMANDE_CREEE'
    for (const transition of TRANSITIONS) {
      expect(transition.statut_source).toBe(statutCourant)
      statutCourant = transition.statut_cible
    }
    expect(statutCourant).toBe('LIVRE')
  })

  it('restreint chaque transition au bon rôle administrateur', () => {
    const rolesAttendus: Record<string, string> = {
      COMMANDE_VALIDEE_RDC: 'ADMIN_RDC',
      TRANSMISE_CHINE: 'ADMIN_RDC',
      ACCEPTEE_CHINE: 'ADMIN_CHINE',
      COLIS_PREPARE: 'ADMIN_CHINE',
      EXPEDIE_CHINE: 'ADMIN_CHINE',
      EN_TRANSIT: 'ADMIN_CHINE',
      ARRIVE_RDC: 'ADMIN_RDC',
      EN_LIVRAISON: 'ADMIN_RDC',
      LIVRE: 'ADMIN_RDC'
    }
    for (const transition of TRANSITIONS) {
      expect(transition.roles_autorises).toHaveLength(1)
      expect(transition.roles_autorises[0]).toBe(rolesAttendus[transition.statut_cible])
    }
  })

  it('retrouve une transition par sa cible et par sa source', () => {
    expect(transitionVers('COMMANDE_VALIDEE_RDC')?.statut_source).toBe('COMMANDE_CREEE')
    expect(transitionDependant('EN_LIVRAISON')?.statut_cible).toBe('LIVRE')
    expect(transitionVers('COMMANDE_CREEE')).toBeUndefined()
    expect(transitionDependant('LIVRE')).toBeUndefined()
  })

  it('associe une action à chaque statut cible de transition', () => {
    for (const transition of TRANSITIONS) {
      expect(ACTION_PAR_CIBLE[transition.statut_cible]).toBeDefined()
      expect(transition.chemin_action).toContain('{id}')
    }
  })

  it('expose l\'action suivante uniquement pour le rôle autorisé', () => {
    const actionsRdc = actionsDisponibles('COMMANDE_CREEE', 'ADMIN_RDC', 'cmd-1')
    expect(actionsRdc).toHaveLength(1)
    expect(actionsRdc[0].action).toBe('valider')
    expect(actionsRdc[0].chemin).toBe('/api/admin-rdc/commandes/cmd-1/valider')

    expect(actionsDisponibles('COMMANDE_CREEE', 'ADMIN_CHINE', 'cmd-1')).toHaveLength(0)
    expect(actionsDisponibles('COMMANDE_CREEE', 'CLIENT', 'cmd-1')).toHaveLength(0)
    expect(actionsDisponibles('LIVRE', 'ADMIN_RDC', 'cmd-1')).toHaveLength(0)
  })
})

describe('route aérienne', () => {
  it('couvre Guangzhou jusqu\'à l\'adresse client en passant par tous les points de transit', () => {
    expect(ROUTE_AERIENNE[0].label).toBe('Guangzhou')
    expect(ROUTE_AERIENNE[ROUTE_AERIENNE.length - 1].label).toBe('Adresse client')
    expect(ROUTE_AERIENNE).toHaveLength(2 + POINTS_TRANSIT.length + 3)
  })

  it('définit 5 points de transit au-dessus des océans et continents', () => {
    expect(POINTS_TRANSIT.map((point) => point.label)).toEqual([
      'Asie du Sud-Est',
      'Océan Indien',
      "Corne de l'Afrique",
      "Afrique de l'Est",
      'Approche RDC'
    ])
  })
})
