import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// A single shared connection pool for the whole app.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
});

// Convenience wrapper for one-off parameterised queries.
export const query = (text, params) => pool.query(text, params);

// Grab a client when you need a multi-statement transaction.
export const getClient = () => pool.connect();
