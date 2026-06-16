import { query, getClient } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Frontend sends statuses like "In Progress"; the DB enum is "in_progress".
const toEnum = (s) => (s ? s.toLowerCase().replace(/\s+/g, "_") : null);

// Shared campaign query. Pass mediaHouseId to scope to one media house's own campaigns.
async function fetchCampaigns({
  niche,
  status,
  q,
  mediaHouseId,
  openOnly = false,
}) {
  const sql = `
    SELECT c.campaign_id AS id, c.title, c.brief, c.budget::float AS budget,
           c.status, to_char(c.application_deadline,'YYYY-MM-DD') AS deadline,
           mh.company_name AS brand, c.media_house_id AS "brandId",
           COALESCE(va.applicant_count,0)::int AS applicants,
           COALESCE((SELECT array_agg(n.name) FROM campaign_niches cn
                     JOIN niches n ON n.niche_id = cn.niche_id
                     WHERE cn.campaign_id = c.campaign_id), '{}') AS niches,
           COALESCE((SELECT array_agg(cr.quantity || ' ' || cr.content_kind)
                     FROM campaign_requirements cr
                     WHERE cr.campaign_id = c.campaign_id), '{}') AS deliverables
    FROM campaigns c
    JOIN media_houses mh ON mh.media_house_id = c.media_house_id
    LEFT JOIN v_campaign_applicants va ON va.campaign_id = c.campaign_id
    WHERE ($1::campaign_status IS NULL OR c.status = $1)
      AND ($2::text IS NULL OR EXISTS (
            SELECT 1 FROM campaign_niches cn JOIN niches n ON n.niche_id = cn.niche_id
            WHERE cn.campaign_id = c.campaign_id AND n.name ILIKE $2))
      AND ($3::text IS NULL OR c.title ILIKE '%'||$3||'%' OR mh.company_name ILIKE '%'||$3||'%')
      AND ($4::bigint IS NULL OR c.media_house_id = $4)
      AND (NOT $5 OR c.status = 'open')
    ORDER BY c.created_at DESC`;
  const { rows } = await query(sql, [
    status,
    niche,
    q,
    mediaHouseId || null,
    openOnly,
  ]);
  return rows;
}

/* GET /api/campaigns?niche=&status=&q=   (public discovery — all campaigns) */
export const listCampaigns = asyncHandler(async (req, res) => {
  res.json(
    await fetchCampaigns({
      niche: req.query.niche || null,
      status: toEnum(req.query.status),
      q: req.query.q || null,
      mediaHouseId: null,
      openOnly: true,
    }),
  );
});

/* GET /api/campaigns/mine   (media_house — only the caller's own campaigns) */
export const listMyCampaigns = asyncHandler(async (req, res) => {
  res.json(
    await fetchCampaigns({
      niche: req.query.niche || null,
      status: toEnum(req.query.status),
      q: req.query.q || null,
      mediaHouseId: req.user.id,
    }),
  );
});

/* GET /api/campaigns/:id */
export const getCampaign = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT c.*, mh.company_name AS brand
     FROM campaigns c JOIN media_houses mh ON mh.media_house_id = c.media_house_id
     WHERE c.campaign_id = $1`,
    [req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: "Campaign not found" });
  res.json(rows[0]);
});

/* POST /api/campaigns  (media_house) */
export const createCampaign = asyncHandler(async (req, res) => {
  const { title, brief, budget, deadline, status, niche } = req.body;
  if (!title || budget == null)
    return res.status(400).json({ error: "title and budget are required" });

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO campaigns (media_house_id, title, brief, budget, status, application_deadline)
       VALUES ($1,$2,$3,$4,COALESCE($5::campaign_status,'open'),$6) RETURNING *`,
      [
        req.user.id,
        title,
        brief || null,
        budget,
        toEnum(status),
        deadline || null,
      ],
    );
    if (niche) {
      await client.query(
        `INSERT INTO campaign_niches (campaign_id, niche_id)
         SELECT $1, niche_id FROM niches WHERE name = $2 ON CONFLICT DO NOTHING`,
        [rows[0].campaign_id, niche],
      );
    }
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

/* PATCH /api/campaigns/:id  (admin = any campaign, media_house = own) */
export const updateCampaign = asyncHandler(async (req, res) => {
  const { title, brief, budget, deadline, status } = req.body;
  const isAdmin = req.user.role === "admin";
  const { rows } = await query(
    `UPDATE campaigns SET
       title = COALESCE($1, title),
       brief = COALESCE($2, brief),
       budget = COALESCE($3, budget),
       application_deadline = COALESCE($4, application_deadline),
       status = COALESCE($5::campaign_status, status),
       updated_at = now()
     WHERE campaign_id=$6 AND ($7 OR media_house_id=$8)
     RETURNING campaign_id AS id, title, status`,
    [
      title ?? null,
      brief ?? null,
      budget ?? null,
      deadline ?? null,
      toEnum(status),
      req.params.id,
      isAdmin,
      req.user.id,
    ],
  );
  if (!rows[0])
    return res.status(404).json({ error: "Campaign not found or not yours" });
  res.json(rows[0]);
});
