import type { SignOptions } from 'jsonwebtoken'
import jwt from 'jsonwebtoken'
import type { Role } from '@prisma/client'
import { env } from '../config/env'
import { NonAuthentifieError } from '../domain/errors'
import type { UtilisateurAuthentifie } from '../domain/types'

interface ChargeUtileJeton {
  sub: string
  role: Role
  type: 'access' | 'refresh'
}

export function genererJetonAcces(utilisateur: UtilisateurAuthentifie): string {
  const options: SignOptions = {
    subject: utilisateur.id,
    expiresIn: env.JWT_ACCESS_EXPIRES as SignOptions['expiresIn']
  }
  return jwt.sign({ role: utilisateur.role, type: 'access' }, env.JWT_ACCESS_SECRET, options)
}

export function genererJetonRafraichissement(utilisateur: UtilisateurAuthentifie): string {
  const options: SignOptions = {
    subject: utilisateur.id,
    expiresIn: env.JWT_REFRESH_EXPIRES as SignOptions['expiresIn']
  }
  return jwt.sign({ role: utilisateur.role, type: 'refresh' }, env.JWT_REFRESH_SECRET, options)
}

function extraireChargeUtile(jeton: string, secret: string, typeAttendu: 'access' | 'refresh'): ChargeUtileJeton {
  let decode: string | object
  try {
    decode = jwt.verify(jeton, secret)
  } catch {
    throw new NonAuthentifieError('Jeton invalide ou expiré')
  }
  if (typeof decode === 'string') {
    throw new NonAuthentifieError('Jeton invalide ou expiré')
  }
  const chargeUtile = decode as Partial<ChargeUtileJeton>
  if (typeof chargeUtile.sub !== 'string' || chargeUtile.type !== typeAttendu) {
    throw new NonAuthentifieError('Jeton invalide ou expiré')
  }
  return chargeUtile as ChargeUtileJeton
}

export function verifierJetonAcces(jeton: string): ChargeUtileJeton {
  return extraireChargeUtile(jeton, env.JWT_ACCESS_SECRET, 'access')
}

export function verifierJetonRafraichissement(jeton: string): ChargeUtileJeton {
  return extraireChargeUtile(jeton, env.JWT_REFRESH_SECRET, 'refresh')
}
