import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query, getClient } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function signToken(user) {
  return jwt.sign(
    {
      id: user.user_id,
      role: user.role,
      email: user.email,
      name: user.full_name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

function publicUser(u) {
  return {
    id: u.user_id,
    role: u.role,
    email: u.email,
    name: u.full_name,
    isVerified: u.is_verified,
  };
}

/* POST /api/auth/signup
   Body: { role, email, password, name|company, niche?, industry?, code? } */
export const signup = asyncHandler(async (req, res) => {
  const { role, email, password } = req.body;
  const validRoles = ["influencer", "media_house", "admin"];
  if (!validRoles.includes(role))
    return res
      .status(400)
      .json({ error: "role must be influencer, media_house or admin" });
  if (!email || !password || password.length < 6)
    return res
      .status(400)
      .json({ error: "email and a 6+ character password are required" });
  if (role === "admin" && req.body.code !== process.env.ADMIN_INVITE_CODE)
    return res.status(403).json({ error: "Invalid admin invite code" });

  const hash = await bcrypt.hash(password, 10);
  const name =
    req.body.name ||
    req.body.company ||
    (role === "admin" ? "Admin" : email.split("@")[0]);

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role, full_name, is_verified, status)
       VALUES ($1,$2,$3,$4,false,'active') RETURNING *`,
      [email, hash, role, name],
    );
    const user = userRes.rows[0];

    if (role === "influencer") {
      const handle = req.body.handle || "@" + email.split("@")[0];
      await client.query(
        `INSERT INTO influencers (influencer_id, handle, base_rate, location) VALUES ($1,$2,$3,$4)`,
        [
          user.user_id,
          handle,
          req.body.rate || null,
          req.body.location || null,
        ],
      );
      if (req.body.niche) {
        await client.query(
          `INSERT INTO influencer_niches (influencer_id, niche_id)
           SELECT $1, niche_id FROM niches WHERE name = $2 ON CONFLICT DO NOTHING`,
          [user.user_id, req.body.niche],
        );
      }
      // optional first social account so the profile shows followers immediately
      if (req.body.followers && req.body.platform) {
        await client.query(
          `INSERT INTO social_media_accounts (influencer_id, platform_id, handle, followers_count)
           SELECT $1, p.platform_id, $2, $3 FROM platforms p WHERE p.name = $4`,
          [user.user_id, handle, Number(req.body.followers), req.body.platform],
        );
      }
    } else if (role === "media_house") {
      await client.query(
        `INSERT INTO media_houses (media_house_id, company_name, industry) VALUES ($1,$2,$3)`,
        [user.user_id, req.body.company || name, req.body.industry || null],
      );
    } else {
      await client.query(`INSERT INTO admins (admin_id) VALUES ($1)`, [
        user.user_id,
      ]);
    }

    await client.query("COMMIT");
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

/* POST /api/auth/login  Body: { email, password, role? } */
export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email and password are required" });

  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (role && user.role !== role)
    return res
      .status(403)
      .json({ error: `This account is not a ${role} account` });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  await query("UPDATE users SET last_login_at = now() WHERE user_id = $1", [
    user.user_id,
  ]);
  res.json({ token: signToken(user), user: publicUser(user) });
});

/* GET /api/auth/me  (auth) */
export const me = asyncHandler(async (req, res) => {
  const { rows } = await query("SELECT * FROM users WHERE user_id = $1", [
    req.user.id,
  ]);
  if (!rows[0]) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(rows[0]) });
});
