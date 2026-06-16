import { query } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/* GET /api/influencers?niche=&platform=&q= */
export const listInfluencers = asyncHandler(async (req, res) => {
  const niche = req.query.niche || null
  const platform = req.query.platform || null
  const q = req.query.q || null

  const sql = `
    SELECT i.influencer_id AS id, u.full_name AS name, i.handle, i.location, i.bio,
           i.base_rate::float AS rate, u.is_verified AS verified,
           ROUND(COALESCE(vr.avg_rating,0),1)::float AS rating,
           COALESCE(vs.completed_contracts,0)::int AS completed,
           COALESCE((SELECT array_agg(n.name) FROM influencer_niches inh
                     JOIN niches n ON n.niche_id = inh.niche_id
                     WHERE inh.influencer_id = i.influencer_id), '{}') AS niches,
           COALESCE((SELECT json_agg(json_build_object(
                       'platform', p.name,
                       'followers', s.followers_count,
                       'engagement', s.engagement_rate))
                     FROM social_media_accounts s
                     JOIN platforms p ON p.platform_id = s.platform_id
                     WHERE s.influencer_id = i.influencer_id), '[]') AS accounts
    FROM influencers i
    JOIN users u ON u.user_id = i.influencer_id
    LEFT JOIN v_influencer_ratings vr ON vr.influencer_id = i.influencer_id
    LEFT JOIN v_influencer_stats  vs ON vs.influencer_id = i.influencer_id
    WHERE ($1::text IS NULL OR EXISTS (
            SELECT 1 FROM influencer_niches inh JOIN niches n ON n.niche_id = inh.niche_id
            WHERE inh.influencer_id = i.influencer_id AND n.name ILIKE $1))
      AND ($2::text IS NULL OR EXISTS (
            SELECT 1 FROM social_media_accounts s JOIN platforms p ON p.platform_id = s.platform_id
            WHERE s.influencer_id = i.influencer_id AND p.name ILIKE $2))
      AND ($3::text IS NULL OR u.full_name ILIKE '%'||$3||'%' OR i.handle ILIKE '%'||$3||'%')
    ORDER BY vr.avg_rating DESC NULLS LAST`
  const { rows } = await query(sql, [niche, platform, q])
  res.json(rows)
})

/* GET /api/influencers/:id */
export const getInfluencer = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT i.influencer_id AS id, u.full_name AS name, i.handle, i.bio, i.location,
            i.base_rate::float AS rate, u.is_verified AS verified
     FROM influencers i JOIN users u ON u.user_id = i.influencer_id
     WHERE i.influencer_id = $1`,
    [req.params.id]
  )
  if (!rows[0]) return res.status(404).json({ error: 'Influencer not found' })
  res.json(rows[0])
})
