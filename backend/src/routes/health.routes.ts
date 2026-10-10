import { Router } from 'express'
import { verifierSante } from '../controllers/health.controller'

const routeur = Router()

routeur.get('/', verifierSante)

export default routeur
