import jwt from "jsonwebtoken";
import { query } from "../config/db.js";

// Verifies the Bearer token and attaches { id, role, email, name } to req.user.
export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Restricts a route to one or more roles, e.g. authorize('media_house').
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed for this role" });
    }
    next();
  };
}

// Blocks an action until the Super Admin has verified the account.
// (The token doesn't carry is_verified, so we read it fresh from the DB.)
export function requireApproved(req, res, next) {
  if (req.user?.role === "admin") return next();
  query("SELECT is_verified FROM users WHERE user_id = $1", [req.user.id])
    .then(({ rows }) => {
      if (!rows[0]?.is_verified) {
        return res
          .status(403)
          .json({ error: "Your account is pending Super Admin approval." });
      }
      next();
    })
    .catch(next);
}

// Attaches req.user if a valid token is present, but never rejects when absent.
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      /* ignore */
    }
  }
  next();
}
