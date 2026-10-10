import type { Response } from 'express'
import { schemaListeNotifications, schemaParamsNotificationId } from '../dto/notification.dto'
import type { DemandeAuthentifiee } from '../middlewares/authentifier'
import { notificationService } from '../services/notification.service'
import { asyncHandler } from '../utils/async-handler'
import { valider } from '../utils/validation'

export const listerNotifications = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const filtres = valider(schemaListeNotifications, requete.query)
  const resultat = await notificationService.lister(requete.user.id, filtres)
  reponse.status(200).json(resultat)
})

export const marquerNotificationLue = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { id } = valider(schemaParamsNotificationId, requete.params)
  const donnees = await notificationService.marquerLue(requete.user.id, id)
  reponse.status(200).json({ donnees })
})

export const marquerToutesNotificationsLues = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const donnees = await notificationService.marquerToutLues(requete.user.id)
  reponse.status(200).json({ donnees })
})
