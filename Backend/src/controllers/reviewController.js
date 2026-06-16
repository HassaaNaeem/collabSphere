import { query } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* GET /api/reviews  (?userId= about one user; ?all=1 lets an admin include hidden) */
export const listReviews = asyncHandler(async (req, res) => {
  const userId = req.query.userId || null;
  const includeHidden = req.query.all === "1" && req.user?.role === "admin";
  const { rows } = await query(
    `SELECT r.review_id AS id, ru.full_name AS "from", eu.full_name AS "to",
            r.rating, r.comment, r.is_hidden AS hidden, to_char(r.created_at,'YYYY-MM-DD') AS date
     FROM reviews r
     JOIN users ru ON ru.user_id = r.reviewer_id
     JOIN users eu ON eu.user_id = r.reviewee_id
     WHERE ($1::bigint IS NULL OR r.reviewee_id = $1)
       AND ($2::boolean OR r.is_hidden = false)
     ORDER BY r.created_at DESC`,
    [userId, includeHidden],
  );
  res.json(rows);
});

/* PATCH /api/reviews/:id  (admin)  Body { hidden: true|false } */
export const setReviewHidden = asyncHandler(async (req, res) => {
  const hidden = req.body.hidden === true;
  const { rows } = await query(
    `UPDATE reviews SET is_hidden = $1 WHERE review_id = $2
     RETURNING review_id AS id, is_hidden AS hidden`,
    [hidden, req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ error: "Review not found" });
  res.json(rows[0]);
});
