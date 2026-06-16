# CollabSphere — Backend (Node + Express + PostgreSQL)

REST API for CollabSphere. Talks to the PostgreSQL database created by
`collabsphere_schema.sql` and serves the React frontend.

## Folder layout
```
Backend/
├── package.json
├── .env.example
├── db/
│   └── seed.js              # sample data (run after the schema)
└── src/
    ├── server.js           # entrypoint (checks DB, starts server)
    ├── app.js              # express app, CORS, routes, errors
    ├── config/db.js        # pg connection pool
    ├── middleware/         # auth (JWT) + error handling
    ├── controllers/        # one file per resource (SQL lives here)
    └── routes/             # URL → controller wiring
```

## Setup
1. Make sure the database exists and the schema is loaded (run
   `collabsphere_schema.sql` in pgAdmin on a database named `collabsphere`).
2. Copy `.env.example` to `.env` and fill in your PostgreSQL password and a
   `JWT_SECRET`.
3. Install and run:
   ```bash
   npm install
   npm run seed     # optional: fills the DB with demo data
   npm run dev      # starts http://localhost:4000
   ```
   You should see `✓ Connected to PostgreSQL` and `✓ CollabSphere API running`.

> **Demo accounts** (after seeding): `maya@collab.dev`, `volt@collab.dev`,
> `admin@collabsphere.com`, etc. — all with password `Password123`.

## API reference
Base URL: `http://localhost:4000/api`

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET  | `/health` | — | service check |
| POST | `/auth/signup` | — | `{ role, email, password, name\|company, niche?, industry?, code? }` |
| POST | `/auth/login` | — | `{ email, password, role? }` → `{ token, user }` |
| GET  | `/auth/me` | Bearer | current user |
| GET  | `/campaigns` | — | `?niche=&status=&q=` |
| GET  | `/campaigns/:id` | — | one campaign |
| POST | `/campaigns` | media_house | create a campaign |
| GET  | `/influencers` | — | `?niche=&platform=&q=` |
| GET  | `/influencers/:id` | — | one influencer |
| GET  | `/applications` | Bearer | role-aware (own / received / all) |
| POST | `/applications` | influencer | `{ campaignId, quote, message? }` |
| PATCH| `/applications/:id` | media_house | `{ status }` |
| GET  | `/contracts` | Bearer | role-aware |
| GET  | `/reviews` | — | `?userId=` optional |
| GET  | `/brands` | — | media houses + stats |
| GET  | `/admin/stats` | admin | platform metrics |
| GET  | `/admin/verifications` | admin | pending accounts |
| PATCH| `/admin/verifications/:userId` | admin | `{ approve: true\|false }` |

Send the token as `Authorization: Bearer <token>` on protected routes.

## Connecting the frontend
The responses are shaped to match the frontend's `src/services/api.js`
(`getCampaigns`, `getInfluencers`, …). To go live, point those functions at
`fetch('http://localhost:4000/api/...')` and wrap them in TanStack Query.

## Design notes
- **Parameterised SQL everywhere** (`$1, $2 …`) — no string concatenation, so
  no SQL injection.
- **One connection pool** shared across requests (`src/config/db.js`).
- **Transactions** for multi-table writes (signup inserts a user + its subtype).
- **Derived data comes from the views** (`v_influencer_ratings`,
  `v_contract_progress`, `v_media_house_stats`, …) rather than recomputed in JS.
- **JWT auth** with role guards (`authorize('media_house')`).
