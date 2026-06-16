import { Router } from 'express'
import { listInfluencers, getInfluencer } from '../controllers/influencerController.js'

const router = Router()
router.get('/', listInfluencers)
router.get('/:id', getInfluencer)
export default router
