import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* GET /api/contracts  (auth)
   influencer  -> their contracts, counterpart = media house
   media_house -> their contracts, counterpart = influencer
   admin       -> all */
export const listContracts = asyncHandler(async (req, res) => {
  const { role, id } = req.user;

  const sql = `
    SELECT ct.contract_id AS id, c.title AS campaign,
           CASE WHEN $2 = 'media_house' THEN inf_u.full_name ELSE mh.company_name END AS counterpart,
           ct.agreed_amount::float AS amount, ct.status,
           to_char(ct.start_date,'YYYY-MM-DD') AS start,
           to_char(ct.end_date,'YYYY-MM-DD')   AS "end",
           COALESCE(vp.deliverables_done,0)::int  AS "deliverablesDone",
           COALESCE(vp.deliverables_total,0)::int AS "deliverablesTotal",
           COALESCE((SELECT count(*) FROM deliverables d
                     WHERE d.contract_id = ct.contract_id AND d.status='submitted'),0)::int AS "deliverablesSubmitted"
    FROM contracts ct
    JOIN campaigns c     ON c.campaign_id = ct.campaign_id
    JOIN media_houses mh ON mh.media_house_id = c.media_house_id
    JOIN users inf_u     ON inf_u.user_id = ct.influencer_id
    LEFT JOIN v_contract_progress vp ON vp.contract_id = ct.contract_id
    WHERE ($1::bigint IS NULL
           OR ($2 = 'influencer'  AND ct.influencer_id = $1)
           OR ($2 = 'media_house' AND c.media_house_id = $1))
    ORDER BY ct.created_at DESC`;

  const scopeId = role === "admin" ? null : id;
  const { rows } = await query(sql, [scopeId, role]);
  res.json(rows);
});
