import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* GET /api/payments  — role-aware: influencer (own), media_house (their campaigns), admin (all) */
export const listPayments = asyncHandler(async (req, res) => {
  const { role, id } = req.user;
  const sql = `
    SELECT p.payment_id AS id, p.amount::float AS amount, p.payment_kind AS kind, p.status,
           c.title AS campaign,
           CASE WHEN $2='media_house' THEN inf.full_name ELSE mh.company_name END AS counterpart,
           to_char(p.initiated_at,'YYYY-MM-DD') AS date,
           to_char(p.completed_at,'YYYY-MM-DD') AS "completedAt"
    FROM payments p
    JOIN contracts ct    ON ct.contract_id = p.contract_id
    JOIN campaigns c     ON c.campaign_id = ct.campaign_id
    JOIN media_houses mh ON mh.media_house_id = c.media_house_id
    JOIN users inf       ON inf.user_id = ct.influencer_id
    WHERE ($1::bigint IS NULL
        OR ($2='influencer'  AND ct.influencer_id = $1)
        OR ($2='media_house' AND c.media_house_id = $1))
    ORDER BY p.initiated_at DESC`;
  const { rows } = await query(sql, [role === "admin" ? null : id, role]);
  res.json(rows);
});
