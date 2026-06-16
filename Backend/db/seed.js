/* ------------------------------------------------------------------
   Seed script — populates the database with the same sample data the
   frontend used as dummy data, so every endpoint returns real rows.

   Run AFTER the schema is loaded:   npm run seed
   All demo accounts share the password in SEED_PASSWORD (.env).
   ------------------------------------------------------------------ */
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { pool } from '../src/config/db.js'

dotenv.config()

const PASSWORD = process.env.SEED_PASSWORD || 'Password123'

const mediaHouses = [
  { email: 'atelier@collab.dev', company: 'Atelier Norde', industry: 'Fashion & Lifestyle', verified: true },
  { email: 'volt@collab.dev', company: 'Volt Systems', industry: 'Consumer Tech', verified: true },
  { email: 'northbound@collab.dev', company: 'Northbound Media', industry: 'Digital Media House', verified: false },
]

const influencers = [
  { email: 'maya@collab.dev', name: 'Maya Castellano', handle: '@mayacreates', location: 'Lisbon, PT', niches: ['Fashion', 'Lifestyle'], rate: 2200, verified: true,
    bio: 'Slow fashion & quiet-luxury storytelling.', accounts: [['Instagram', 412000, 4.7], ['TikTok', 980000, 6.1]] },
  { email: 'dev@collab.dev', name: 'Dev Anand', handle: '@devbuilds', location: 'Bengaluru, IN', niches: ['Tech', 'Finance'], rate: 3100, verified: true,
    bio: 'Long-form product breakdowns for hardware & fintech.', accounts: [['YouTube', 720000, 5.4], ['X', 210000, 3.2]] },
  { email: 'lena@collab.dev', name: 'Lena Brandt', handle: '@lenaeats', location: 'Berlin, DE', niches: ['Food', 'Travel'], rate: 1400, verified: false,
    bio: 'Cinematic food & city guides.', accounts: [['Instagram', 156000, 7.9]] },
  { email: 'theo@collab.dev', name: 'Theo Kwesi', handle: '@theoplays', location: 'Accra, GH', niches: ['Gaming', 'Tech'], rate: 2800, verified: true,
    bio: 'Esports recaps & first-look gameplay.', accounts: [['YouTube', 1300000, 4.1], ['TikTok', 540000, 8.2]] },
  { email: 'sofia@collab.dev', name: 'Sofia Marchetti', handle: '@sofiamoves', location: 'Milan, IT', niches: ['Fitness', 'Beauty'], rate: 1900, verified: true,
    bio: 'Mobility, recovery and clean beauty.', accounts: [['Instagram', 298000, 6.6]] },
  { email: 'noah@collab.dev', name: 'Noah Park', handle: '@noahframes', location: 'Seoul, KR', niches: ['Travel', 'Lifestyle'], rate: 1100, verified: false,
    bio: 'Micro-creator with very high engagement.', accounts: [['Instagram', 88000, 9.1], ['YouTube', 120000, 5.0]] },
]

const campaigns = [
  { brand: 'Atelier Norde', title: 'Spring Capsule — Quiet Luxury', niche: 'Fashion', budget: 8000, status: 'open', deadline: '2026-06-20',
    brief: 'Launch our spring capsule with an editorial, understated tone.', reqs: [[1, 'reel'], [3, 'story']] },
  { brand: 'Volt Systems', title: 'Mobile Chip Launch Review', niche: 'Tech', budget: 12000, status: 'in_progress', deadline: '2026-06-12',
    brief: 'Honest deep-dive review of our new mobile SoC.', reqs: [[1, 'video'], [1, 'thread']] },
  { brand: 'Northbound Media', title: 'City Food Crawl Series', niche: 'Food', budget: 4500, status: 'open', deadline: '2026-06-28',
    brief: 'A 4-part food crawl across European capitals.', reqs: [[4, 'reel']] },
  { brand: 'Volt Systems', title: 'Esports Highlights Partnership', niche: 'Gaming', budget: 9500, status: 'open', deadline: '2026-07-04',
    brief: 'Season-long highlight partnership for our tournament.', reqs: [[2, 'video'], [5, 'short']] },
  { brand: 'Atelier Norde', title: 'Recovery Wellness Drop', niche: 'Fitness', budget: 6000, status: 'completed', deadline: '2026-05-30',
    brief: 'Promote our recovery line to a wellness audience.', reqs: [[1, 'reel'], [2, 'story']] },
]

const applications = [
  { campaign: 'Spring Capsule — Quiet Luxury', influencer: 'maya@collab.dev', quote: 2200, status: 'shortlisted', date: '2026-05-28' },
  { campaign: 'City Food Crawl Series', influencer: 'lena@collab.dev', quote: 1400, status: 'accepted', date: '2026-05-25' },
  { campaign: 'Esports Highlights Partnership', influencer: 'theo@collab.dev', quote: 2800, status: 'pending', date: '2026-05-30' },
  { campaign: 'Mobile Chip Launch Review', influencer: 'dev@collab.dev', quote: 3100, status: 'accepted', date: '2026-05-20' },
]

const contracts = [
  { campaign: 'Mobile Chip Launch Review', influencer: 'dev@collab.dev', amount: 3100, status: 'in_progress', start: '2026-05-22', end: '2026-06-12', done: 1, total: 2, pay: 'held' },
  { campaign: 'City Food Crawl Series', influencer: 'lena@collab.dev', amount: 1400, status: 'in_progress', start: '2026-05-26', end: '2026-06-28', done: 2, total: 4, pay: 'held' },
  { campaign: 'Recovery Wellness Drop', influencer: 'sofia@collab.dev', amount: 1900, status: 'completed', start: '2026-05-10', end: '2026-05-30', done: 3, total: 3, pay: 'released' },
]

const reviews = [
  { campaign: 'Recovery Wellness Drop', reviewer: 'atelier@collab.dev', reviewee: 'sofia@collab.dev', rating: 5, comment: 'Delivered early and on-brief. Exceptional production quality.', date: '2026-05-31' },
  { campaign: 'Mobile Chip Launch Review', reviewer: 'volt@collab.dev', reviewee: 'dev@collab.dev', rating: 4, comment: 'Thorough and honest. Minor delay on the thread.', date: '2026-05-18' },
]

async function run() {
  const hash = await bcrypt.hash(PASSWORD, 10)
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    await c.query('TRUNCATE users RESTART IDENTITY CASCADE')

    const nicheMap = Object.fromEntries((await c.query('SELECT niche_id, name FROM niches')).rows.map(r => [r.name, r.niche_id]))
    const platMap = Object.fromEntries((await c.query('SELECT platform_id, name FROM platforms')).rows.map(r => [r.name, r.platform_id]))

    const userId = {}     // email -> user_id
    const campaignId = {} // title -> campaign_id

    const addUser = async (email, role, name, verified) => {
      const { rows } = await c.query(
        `INSERT INTO users (email, password_hash, role, full_name, is_verified, status)
         VALUES ($1,$2,$3,$4,$5,'active') RETURNING user_id`,
        [email, hash, role, name, verified]
      )
      userId[email] = rows[0].user_id
      return rows[0].user_id
    }

    // Admin
    await addUser('admin@collabsphere.com', 'admin', 'Platform Admin', true)
    await c.query('INSERT INTO admins (admin_id, admin_level) VALUES ($1, 3)', [userId['admin@collabsphere.com']])

    // Media houses
    for (const m of mediaHouses) {
      const id = await addUser(m.email, 'media_house', m.company, m.verified)
      await c.query('INSERT INTO media_houses (media_house_id, company_name, industry) VALUES ($1,$2,$3)', [id, m.company, m.industry])
    }

    // Influencers
    for (const inf of influencers) {
      const id = await addUser(inf.email, 'influencer', inf.name, inf.verified)
      await c.query('INSERT INTO influencers (influencer_id, handle, bio, location, base_rate) VALUES ($1,$2,$3,$4,$5)',
        [id, inf.handle, inf.bio, inf.location, inf.rate])
      for (const n of inf.niches)
        await c.query('INSERT INTO influencer_niches (influencer_id, niche_id) VALUES ($1,$2)', [id, nicheMap[n]])
      for (const [plat, followers, eng] of inf.accounts)
        await c.query(
          `INSERT INTO social_media_accounts (influencer_id, platform_id, handle, followers_count, engagement_rate, is_verified)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [id, platMap[plat], inf.handle, followers, eng, inf.verified]
        )
    }

    // Campaigns
    for (const cm of campaigns) {
      const { rows } = await c.query(
        `INSERT INTO campaigns (media_house_id, title, brief, budget, status, application_deadline)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING campaign_id`,
        [userId[mediaHouses.find(m => m.company === cm.brand).email], cm.title, cm.brief, cm.budget, cm.status, cm.deadline]
      )
      campaignId[cm.title] = rows[0].campaign_id
      await c.query('INSERT INTO campaign_niches (campaign_id, niche_id) VALUES ($1,$2)', [rows[0].campaign_id, nicheMap[cm.niche]])
      for (const [qty, kind] of cm.reqs)
        await c.query('INSERT INTO campaign_requirements (campaign_id, content_kind, quantity) VALUES ($1,$2,$3)', [rows[0].campaign_id, kind, qty])
    }

    // Applications
    for (const a of applications)
      await c.query(
        `INSERT INTO applications (campaign_id, influencer_id, quoted_rate, status, applied_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [campaignId[a.campaign], userId[a.influencer], a.quote, a.status, a.date]
      )

    // Contracts + deliverables + payments
    for (const ct of contracts) {
      const { rows } = await c.query(
        `INSERT INTO contracts (campaign_id, influencer_id, agreed_amount, status, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING contract_id`,
        [campaignId[ct.campaign], userId[ct.influencer], ct.amount, ct.status, ct.start, ct.end]
      )
      const cid = rows[0].contract_id
      for (let i = 0; i < ct.total; i++)
        await c.query(
          `INSERT INTO deliverables (contract_id, content_kind, status) VALUES ($1,'post',$2)`,
          [cid, i < ct.done ? 'approved' : 'pending']
        )
      await c.query(
        `INSERT INTO payments (contract_id, amount, payment_kind, status)
         VALUES ($1,$2,$3,$4)`,
        [cid, ct.amount, ct.pay === 'released' ? 'release' : 'escrow_funding', ct.pay]
      )
    }

    // Reviews
    for (const r of reviews)
      await c.query(
        `INSERT INTO reviews (contract_id, reviewer_id, reviewee_id, rating, comment, created_at)
         SELECT ct.contract_id, $1, $2, $3, $4, $5
         FROM contracts ct WHERE ct.campaign_id = $6 LIMIT 1`,
        [userId[r.reviewer], userId[r.reviewee], r.rating, r.comment, r.date, campaignId[r.campaign]]
      )

    await c.query('COMMIT')
    console.log(`✓ Seeded: 1 admin, ${mediaHouses.length} media houses, ${influencers.length} influencers, ${campaigns.length} campaigns, ${applications.length} applications, ${contracts.length} contracts, ${reviews.length} reviews`)
    console.log(`  All demo accounts use password: ${PASSWORD}`)
  } catch (err) {
    await c.query('ROLLBACK')
    console.error('✗ Seed failed:', err.message)
    process.exitCode = 1
  } finally {
    c.release()
    await pool.end()
  }
}

run()
