import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* GET /api/admin/stats */
export const getStats = asyncHandler(async (req, res) => {
  const { rows } = await query(`
    SELECT
      (SELECT count(*) FROM users)::int                                   AS "totalUsers",
      (SELECT count(*) FROM influencers)::int                             AS influencers,
      (SELECT count(*) FROM media_houses)::int                            AS brands,
      (SELECT count(*) FROM users WHERE is_verified = false)::int         AS "pendingVerifications",
      (SELECT count(*) FROM campaigns WHERE status IN ('open','in_progress'))::int AS "activeCampaigns",
      (SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='released')::float AS "platformRevenue",
      (SELECT count(*) FROM contracts WHERE status='disputed')::int       AS "disputesOpen"
  `);
  res.json(rows[0]);
});

/* GET /api/admin/verifications  -> accounts awaiting verification */
export const getVerificationQueue = asyncHandler(async (req, res) => {
  const { rows } = await query(`
    SELECT u.user_id AS id, u.full_name AS name,
           CASE u.role WHEN 'influencer' THEN 'Influencer'
                       WHEN 'media_house' THEN 'Media House'
                       ELSE 'Admin' END AS type,
           to_char(u.created_at,'YYYY-MM-DD') AS submitted,
           (SELECT MAX(followers_count) FROM social_media_accounts s
            WHERE s.influencer_id = u.user_id) AS followers
    FROM users u
    WHERE u.is_verified = false
    ORDER BY u.created_at ASC`);
  res.json(rows);
});

/* PATCH /api/admin/verifications/:userId  Body: { approve: true|false } */
export const decideVerification = asyncHandler(async (req, res) => {
  const approve = req.body.approve !== false;
  const { rows } = await query(
    `UPDATE users SET is_verified = $1,
            status = CASE WHEN $1 THEN 'active'::account_status ELSE status END
     WHERE user_id = $2 RETURNING user_id, full_name, is_verified`,
    [approve, req.params.userId],
  );
  if (!rows[0]) return res.status(404).json({ error: "User not found" });
  res.json(rows[0]);
});

/* GET /api/admin/users  — manageable accounts (no admins) */
export const listUsers = asyncHandler(async (req, res) => {
  const { rows } = await query(`
    SELECT u.user_id AS id, u.full_name AS name, u.email,
           CASE u.role WHEN 'influencer' THEN 'Influencer'
                       WHEN 'media_house' THEN 'Media House' ELSE 'Admin' END AS type,
           u.role, u.is_verified AS verified, to_char(u.created_at,'YYYY-MM-DD') AS joined
    FROM users u WHERE u.role <> 'admin' ORDER BY u.created_at DESC`);
  res.json(rows);
});

/* DELETE /api/admin/users/:userId  — remove an influencer or media house */
export const deleteUser = asyncHandler(async (req, res) => {
  const chk = await query("SELECT role FROM users WHERE user_id=$1", [
    req.params.userId,
  ]);
  if (!chk.rows[0]) return res.status(404).json({ error: "User not found" });
  if (chk.rows[0].role === "admin")
    return res.status(403).json({ error: "Cannot delete an admin account" });
  await query("DELETE FROM users WHERE user_id=$1", [req.params.userId]);
  res.json({ ok: true, id: Number(req.params.userId) });
});
