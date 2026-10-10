import type { Server as ServeurHttp } from 'node:http'
import { Server } from 'socket.io'
import { originesCors } from '../config/env'
import { logger } from '../config/logger'
import { NonAuthentifieError } from '../domain/errors'
import { depotUtilisateurs } from '../repositories/user.repository'
import { verifierJetonAcces } from '../utils/jetons'
import { valider } from '../utils/validation'
import { schemaMessageSocket, schemaRejoindreCommande } from '../dto/message.dto'
import { versUtilisateurAuthentifie } from '../dto/reponses'
import type { UtilisateurAuthentifie } from '../domain/types'
import { EVENEMENTS_CLIENT } from './evenements'
import { definirIo, salleCommande, salleUtilisateur } from './io'
import { commandeService } from '../services/commande.service'
import { messageService } from '../services/message.service'

interface AccuseReception {
  donnees?: unknown
  erreur?: string
}

export function initialiserSocketIo(serveur: ServeurHttp): Server {
  const io = new Server(serveur, {
    cors: { origin: originesCors, credentials: true },
    path: '/socket.io'
  })

  io.use((socket, suivant) => {
    const jeton = socket.handshake.auth?.jeton ?? socket.handshake.auth?.token
    if (typeof jeton !== 'string' || jeton.length === 0) {
      suivant(new NonAuthentifieError("Jeton d'authentification manquant"))
      return
    }
    try {
      const chargeUtile = verifierJetonAcces(jeton)
      void depotUtilisateurs
        .trouverParId(chargeUtile.sub)
        .then((utilisateur) => {
          if (!utilisateur || !utilisateur.est_actif) {
            throw new NonAuthentifieError('Utilisateur introuvable ou désactivé')
          }
          socket.data.utilisateur = versUtilisateurAuthentifie(utilisateur)
          suivant()
        })
        .catch((erreur: unknown) => {
          suivant(erreur instanceof Error ? erreur : new NonAuthentifieError())
        })
    } catch (erreur) {
      suivant(erreur instanceof Error ? erreur : new NonAuthentifieError())
    }
  })

  io.on('connection', (socket) => {
    const utilisateur = socket.data.utilisateur as UtilisateurAuthentifie
    socket.join(salleUtilisateur(utilisateur.id))
    logger.info({ utilisateurId: utilisateur.id, role: utilisateur.role, socketId: socket.id }, 'socket_connecte')

    socket.on(EVENEMENTS_CLIENT.REJOINDRE_COMMANDE, (charge: unknown, accuse?: (resultat: AccuseReception) => void) => {
      try {
        const { commande_id } = valider(schemaRejoindreCommande, charge)
        commandeService.verifierAcces(utilisateur, commande_id)
        socket.join(salleCommande(commande_id))
        accuse?.({ donnees: { commande_id } })
      } catch (erreur) {
        accuse?.({ erreur: erreur instanceof Error ? erreur.message : 'Accès refusé' })
      }
    })

    socket.on(EVENEMENTS_CLIENT.QUITTER_COMMANDE, (commandeId: unknown) => {
      if (typeof commandeId === 'string') {
        socket.leave(salleCommande(commandeId))
      }
    })

    socket.on(
      EVENEMENTS_CLIENT.ENVOYER_MESSAGE,
      async (charge: unknown, accuse?: (resultat: AccuseReception) => void) => {
        try {
          const donnees = valider(schemaMessageSocket, charge)
          const message = await messageService.envoyer(utilisateur, donnees.commande_id, {
            contenu: donnees.contenu,
            piece_jointe: donnees.piece_jointe
          })
          accuse?.({ donnees: message })
        } catch (erreur) {
          accuse?.({ erreur: erreur instanceof Error ? erreur.message : 'Envoi impossible' })
        }
      }
    )

    socket.on('disconnect', (raison) => {
      logger.info({ utilisateurId: utilisateur.id, socketId: socket.id, raison }, 'socket_deconnecte')
    })

    socket.on('error', (erreur) => {
      logger.warn({ utilisateurId: utilisateur.id, err: erreur }, 'erreur_socket')
    })
  })

  definirIo(io)
  return io
}
