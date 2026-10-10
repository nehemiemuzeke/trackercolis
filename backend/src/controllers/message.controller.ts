import type { Response } from 'express'
import { schemaParamsCommandeId } from '../dto/common.dto'
import { schemaEnvoiMessage, schemaListeMessages } from '../dto/message.dto'
import type { DemandeAuthentifiee } from '../middlewares/authentifier'
import { messageService } from '../services/message.service'
import { asyncHandler } from '../utils/async-handler'
import { valider } from '../utils/validation'

export const listerMessages = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { commandeId } = valider(schemaParamsCommandeId, requete.params)
  const pagination = valider(schemaListeMessages, requete.query)
  const resultat = await messageService.lister(requete.user, commandeId, pagination)
  reponse.status(200).json(resultat)
})

export const envoyerMessage = asyncHandler(async (requete: DemandeAuthentifiee, reponse: Response) => {
  const { commandeId } = valider(schemaParamsCommandeId, requete.params)
  const donnees = valider(schemaEnvoiMessage, requete.body)
  const message = await messageService.envoyer(requete.user, commandeId, donnees)
  reponse.status(201).json({ donnees: message })
})
