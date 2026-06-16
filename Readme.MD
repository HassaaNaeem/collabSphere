# CollabSphere

**An influencer–media house collaboration marketplace.**

CollabSphere connects social-media **influencers** with **media houses (brands)** and manages the entire collaboration lifecycle in one place — discovery, applications/invitations, contracts, content deliverables, escrow-based payments, private messaging, and reviews — with a **Super Admin** for verification and moderation.

Built as a Database Systems course project: a normalized PostgreSQL schema with a Node.js/Express REST API and a React (Vite) front end.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the app](#running-the-app)
- [Demo accounts](#demo-accounts)
- [Core workflow](#core-workflow)
- [API overview](#api-overview)
- [Database](#database)
- [Diagrams](#diagrams)
- [Troubleshooting](#troubleshooting)
- [Future work](#future-work)

---

## Tech stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Database | PostgreSQL (pgAdmin) — ~26 tables, enums, views        |
| Backend  | Node.js, Express, `pg`, JWT, bcryptjs                  |
| Frontend | React + Vite, React Router, React Query, Framer Motion |
| Auth     | JSON Web Tokens (role-based)                           |

---

## Features

- **Role-based accounts & auth** — Influencer, Media House, and Super-Admin roles with JWT login; new accounts require Super-Admin verification before they can transact.
- **Campaign marketplace & discovery** — Brands post campaigns; influencers browse _open_ campaigns by niche, platform, and keyword; brands search creators by reach and rating.
- **Applications & invitations** — Influencers apply to open campaigns; brands invite specific creators. Either side accepting forms an engagement.
- **Contracts, deliverables & escrow** — Accepting an application/invitation automatically creates a contract, funds an escrow payment, and generates the required deliverables. The campaign moves to _in progress_.
- **Deliverable submission & review** — Influencers submit content links; brands approve, request changes, or reject. Approving all deliverables completes the campaign and releases the escrow payment.
- **Private messaging** — One-to-one chat between a brand and an influencer, visible only to those two parties; the Super Admin has read-only oversight.
- **Notifications** — In-app alerts for applications, invitations, submissions, reviews, and payments.
- **Reviews & ratings** — Parties rate each other after a completed contract; ratings are computed via SQL views.
- **Super-Admin controls** — Account verification, review moderation, and management of users and campaigns.

---

## Architecture

```
React (Vite) SPA  ──HTTP/JSON──>  Express REST API  ──SQL──>  PostgreSQL
  localhost:5173                    localhost:4000              localhost:5432
```

- The API is layered into **routes → controllers → middleware**, backed by a shared **connection pool**.
- Multi-step operations (e.g. accepting an application) run inside **transactions** so the contract, escrow payment, and deliverables commit atomically.
- Derived data (ratings, contract progress, spend) lives in **views**, keeping the schema normalized (3NF).
- Security: parameterized queries (no SQL injection), bcrypt password hashing, JWT auth with role authorization.

---

## Project structure

```
Collab Sphere/
├── Backend/
│   ├── src/
│   │   ├── config/db.js          # pg pool + query()/getClient()
│   │   ├── middleware/           # auth (authenticate, authorize, requireApproved), error handler
│   │   ├── utils/                # asyncHandler, notify, contract engine
│   │   ├── controllers/          # one file per resource (SQL lives here)
│   │   ├── routes/               # one router per resource + index.js
│   │   ├── app.js                # express app + middleware
│   │   └── server.js             # entry point (listens on :4000)
│   ├── migrations/               # 001, 002, 003 — incremental schema changes
│   ├── db/seed.js                # demo data (npm run seed)
│   ├── .env                      # NOT committed — see .env.example
│   └── package.json
└── Frontend/
    ├── src/
    │   ├── services/api.js        # API client (token + role mapping)
    │   ├── context/               # Auth & Theme
    │   ├── components/            # ui primitives, layout, auth
    │   ├── pages/                 # Landing, Campaigns, Influencers, Contracts, Messages, dashboards, admin
    │   └── router/                # routes
    ├── .env                       # VITE_API_URL
    └── package.json
```

---

## Prerequisites

- **Node.js** 18+ (project developed on Node 22)
- **PostgreSQL** 14+ with **pgAdmin**
- npm

---

## Setup

### 1. Database

In pgAdmin, create a database named **`collabsphere`**, then run (in order) using the Query Tool:

1. `Backend/db/collabsphere_schema.sql` _(or wherever your schema file lives)_ — creates all tables, enums, views, and seed lookups.
2. `Backend/migrations/001_phase2_batch1.sql`
3. `Backend/migrations/002_phase2_batch2.sql`
4. `Backend/migrations/003_phase2_chat.sql`

> Migrations are incremental schema changes; run each once, in order. They use `IF NOT EXISTS`, so re-running is harmless.

### 2. Backend

```bash
cd Backend
npm install
cp .env.example .env      # then edit .env with your values
npm run seed              # loads demo accounts, campaigns, contracts, etc.
```

**`Backend/.env`** (copy from `.env.example`):

```ini
# Server
PORT=
CLIENT_ORIGIN=

# PostgreSQL
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=

# Seed
SEED_PASSWORD=
ADMIN_INVITE_CODE=
```

### 3. Frontend

```bash
cd Frontend
npm install
```

**`Frontend/.env`**:

```ini
VITE_API_URL=http://localhost:4000/api
```

---

## Running the app

Open two terminals:

```bash
# Terminal 1 — API
cd Backend && npm run dev      # http://localhost:4000

# Terminal 2 — web app
cd Frontend && npm run dev     # http://localhost:5173
```

Open **http://localhost:5173** and log in with a demo account.

---

## Demo accounts

All demo passwords are **`Password123`**.

| Role        | Email                                                     | Verified |
| ----------- | --------------------------------------------------------- | -------- |
| Super Admin | `admin@collabsphere.com`                                  | —        |
| Media House | `volt@collab.dev` / `atelier@collab.dev`                  | ✅       |
| Media House | `northbound@collab.dev`                                   | ❌       |
| Influencer  | `maya@collab.dev` / `dev@collab.dev` / `sofia@collab.dev` | ✅       |
| Influencer  | `lena@collab.dev` / `theo@collab.dev` / `noah@collab.dev` | ❌       |

- The admin login page is **not** linked from the landing page — go directly to `/login/admin`.
- Gated actions (apply, invite, post campaign) require a **verified** account, so use the verified ones above.
- New admin signups require the invite code `CS-ADMIN-2026`.

---

## Core workflow

1. **Influencer** applies to an open campaign (or a **brand** invites a creator).
2. **Brand** accepts → a contract is created, escrow is funded (held), deliverables are generated, and the campaign moves to _in progress_.
3. **Influencer** submits content links for each deliverable.
4. **Brand** reviews each submission (approve / request changes / reject).
5. When all deliverables are approved → contract & campaign are **completed** and the escrow payment is **released**.
6. Either party can **message** the other privately; the **Super Admin** can verify accounts, moderate reviews, and view any conversation read-only.

---

## API overview

Base URL: `http://localhost:4000/api`

| Area                 | Endpoints                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                 | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`                                                                                 |
| Campaigns            | `GET /campaigns`, `GET /campaigns/mine`, `GET /campaigns/:id`, `POST /campaigns`, `PATCH /campaigns/:id`                                |
| Influencers / Brands | `GET /influencers`, `GET /influencers/:id`, `GET /brands`                                                                               |
| Applications         | `GET /applications`, `POST /applications`, `PATCH /applications/:id`                                                                    |
| Invitations          | `GET /invitations`, `POST /invitations`, `PATCH /invitations/:id`                                                                       |
| Contracts            | `GET /contracts`                                                                                                                        |
| Deliverables         | `GET /deliverables?contractId=`, `GET /deliverables/inbox`, `POST /deliverables/:id/submit`, `PATCH /deliverables/:id/review`           |
| Payments             | `GET /payments`                                                                                                                         |
| Reviews              | `GET /reviews`, `PATCH /reviews/:id`                                                                                                    |
| Notifications        | `GET /notifications`, `PATCH /notifications/read-all`, `PATCH /notifications/:id/read`                                                  |
| Conversations        | `POST /conversations`, `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/messages`                      |
| Admin                | `GET /admin/stats`, `GET /admin/verifications`, `PATCH /admin/verifications/:userId`, `GET /admin/users`, `DELETE /admin/users/:userId` |

Protected routes expect an `Authorization: Bearer <token>` header (the token is returned by login/signup).

---

## Database

- One `users` supertype with `influencers` / `media_houses` / `admins` subtypes sharing the same primary key (1:1 identifying relationship).
- Junction tables for M:N links (`influencer_niches`, `campaign_niches`, `conversation_participants`).
- Views: `v_influencer_ratings`, `v_influencer_stats`, `v_campaign_applicants`, `v_contract_progress`, `v_media_house_stats`.
- Schema lives in the SQL schema file; incremental changes in `Backend/migrations/`.

---

## Diagrams

ER diagram (Chen notation) and Data-Flow Diagrams (Level 0 & Level 1) are included with the project documentation (SVG/PDF).

---

## Troubleshooting

- **`password authentication failed`** when running migrations — pass the Postgres user: `psql -U postgres -d collabsphere -f <file>`, or just use pgAdmin's Query Tool.
- **`relation already exists` / index errors on a migration** — the table is already in the base schema; the migration only adds indexes/columns and is safe to ignore re-runs.
- **Gated action returns 403** — the account isn't verified yet; approve it as the Super Admin, then re-login to refresh the session.
- **CORS error** — make sure `CLIENT_ORIGIN` in `Backend/.env` matches the frontend URL (`http://localhost:5173`).

---

## Future work

Real-time chat (WebSockets), external payment-gateway integration, analytics dashboards, and automated creator-to-campaign matching.

---

_Built for the CSC-204 Database Systems course._
