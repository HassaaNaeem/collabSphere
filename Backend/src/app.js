import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'

import apiRoutes from './routes/index.js'
import { notFound, errorHandler } from './middleware/error.js'

dotenv.config()

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())
app.use(morgan('dev'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'collabsphere-api' }))

// All feature routes live under /api
app.use('/api', apiRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
