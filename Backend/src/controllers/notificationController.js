import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT notification_id AS id, kind, title, body, is_read AS read,
            related_entity AS entity, related_id AS "relatedId",
            to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS date
     FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
    [req.user.id],
  );
  res.json(rows);
});

export const markRead = asyncHandler(async (req, res) => {
  await query(
    "UPDATE notifications SET is_read=true WHERE notification_id=$1 AND user_id=$2",
    [req.params.id, req.user.id],
  );
  res.json({ ok: true });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await query(
    "UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false",
    [req.user.id],
  );
  res.json({ ok: true });
});
