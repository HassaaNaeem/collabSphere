import { Router } from 'express'
import { listContracts } from '../controllers/contractController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.get('/', authenticate, listContracts)
export default router
