import { query } from '../config/db.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/* GET /api/brands  -> media houses with dashboard stats */
export const listBrands = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT mh.media_house_id AS id, mh.company_name AS company, mh.industry,
            u.is_verified AS verified,
            COALESCE(s.active_campaigns,0)::int AS "activeCampaigns",
            COALESCE(s.total_spend,0)::float   AS "totalSpend"
     FROM media_houses mh
     JOIN users u ON u.user_id = mh.media_house_id
     LEFT JOIN v_media_house_stats s ON s.media_house_id = mh.media_house_id
     ORDER BY u.created_at DESC`
  )
  res.json(rows)
})
