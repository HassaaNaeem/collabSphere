import app from './app.js'
import { pool } from './config/db.js'
import dotenv from 'dotenv'

dotenv.config()

const PORT = process.env.PORT || 4000

async function start() {
  try {
    // Fail fast if the database isn't reachable.
    const { rows } = await pool.query('SELECT NOW() AS now')
    console.log(`✓ Connected to PostgreSQL at ${rows[0].now.toISOString()}`)
    app.listen(PORT, () => console.log(`✓ CollabSphere API running on http://localhost:${PORT}`))
  } catch (err) {
    console.error('✗ Could not connect to the database. Check your .env settings.')
    console.error(err.message)
    process.exit(1)
  }
}

start()
