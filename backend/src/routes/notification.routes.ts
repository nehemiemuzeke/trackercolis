import { Router } from 'express'
import {
  listerNotifications,
  marquerNotificationLue,
  marquerToutesNotificationsLues
} from '../controllers/notification.controller'
import { authentifier } from '../middlewares/authentifier'

const routeur = Router()

routeur.use(authentifier)
routeur.get('/', listerNotifications)
routeur.put('/lire-tout', marquerToutesNotificationsLues)
routeur.put('/:id/lu', marquerNotificationLue)

export default routeur
