export const EVENEMENTS_SERVEUR = {
  COMMANDE_MISE_A_JOUR: 'order:updated',
  SUIVI_MIS_A_JOUR: 'tracking:updated',
  NOUVELLE_NOTIFICATION: 'notification:new',
  NOUVEAU_MESSAGE: 'message:new'
} as const

export const EVENEMENTS_CLIENT = {
  REJOINDRE_COMMANDE: 'join:order',
  QUITTER_COMMANDE: 'leave:order',
  ENVOYER_MESSAGE: 'message:send'
} as const

export type EvenementServeur = (typeof EVENEMENTS_SERVEUR)[keyof typeof EVENEMENTS_SERVEUR]
export type EvenementClient = (typeof EVENEMENTS_CLIENT)[keyof typeof EVENEMENTS_CLIENT]
