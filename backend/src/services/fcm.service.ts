import firebaseAdmin from 'firebase-admin'
import { env } from '../config/env'
import { logger } from '../config/logger'

let applicationInitialisee = false

function initialiserApplication(): boolean {
  if (applicationInitialisee) {
    return true
  }
  try {
    const credentials = JSON.parse(env.FCM_SERVICE_ACCOUNT_JSON)
    firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(credentials) })
    applicationInitialisee = true
    logger.info('fcm_initialise')
    return true
  } catch (erreur) {
    logger.error({ err: erreur }, 'fcm_initialisation_impossible')
    return false
  }
}

export function envoyerNotificationPush(
  token: string | null | undefined,
  titre: string,
  corps: string,
  donnees: { commande_id: string; type: string }
): void {
  if (!token || token.length === 0) {
    return
  }
  if (env.FCM_SERVICE_ACCOUNT_JSON.length === 0) {
    logger.debug({ commande_id: donnees.commande_id }, 'fcm_non_configure_push_ignore')
    return
  }
  if (!initialiserApplication()) {
    return
  }
  void firebaseAdmin
    .messaging()
    .send({
      token,
      notification: { title: titre, body: corps },
      data: { commande_id: donnees.commande_id, type: donnees.type },
      android: { priority: 'high' }
    })
    .catch((erreur: unknown) => {
      logger.warn({ err: erreur }, 'echec_envoi_fcm')
    })
}
