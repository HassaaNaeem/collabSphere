-- ============================================================================
--  CollabSphere — Relational Database Schema (PostgreSQL)
--  Database Systems Project · Phase 2 deliverable
--
--  Design notes
--  ------------
--  * Supertype/subtype: a single `users` table holds shared identity/auth,
--    while `influencers`, `media_houses`, and `admins` are 1:1 specialisations
--    keyed on user_id. A composite FK (user_id, role) guarantees a subtype row
--    can only attach to a user of the matching role.
--  * Normalised to 3NF: no repeating groups, every non-key attribute depends on
--    the whole key, and transitive dependencies are removed (e.g. a contract's
--    media house is reached via its campaign, not duplicated on the contract).
--  * Derived data (avg rating, completed-contract counts, deliverable progress,
--    applicant counts) is NOT stored. It is exposed through VIEWS at the bottom.
--  * All money is NUMERIC(12,2); all timestamps are TIMESTAMPTZ.
--  * Identity PKs use GENERATED ALWAYS AS IDENTITY (modern replacement for SERIAL).
-- ============================================================================

BEGIN;

-- Case-insensitive text for emails / handles
CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
--  0. Clean slate (safe to re-run the whole script)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS
    user_subscriptions, subscription_plans,
    reviews, notifications, messages, conversation_participants, conversations,
    invoices, payments, content_submissions, deliverables, contracts,
    applications, campaign_requirements, campaign_niches, campaigns,
    portfolio_items, audience_demographics, social_media_accounts,
    influencer_niches, niches, platforms,
    admins, media_houses, influencers, users
    CASCADE;

DROP TYPE IF EXISTS
    user_role, account_status, campaign_status, application_status,
    contract_status, deliverable_status, submission_status,
    payment_type, payment_status, invoice_status, subscription_status,
    notification_type, media_type CASCADE;

-- ---------------------------------------------------------------------------
--  1. Enumerated domains
-- ---------------------------------------------------------------------------
CREATE TYPE user_role          AS ENUM ('influencer', 'media_house', 'admin');
CREATE TYPE account_status     AS ENUM ('pending', 'active', 'suspended', 'deactivated');
CREATE TYPE campaign_status    AS ENUM ('draft', 'open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn');
CREATE TYPE contract_status    AS ENUM ('active', 'in_progress', 'completed', 'cancelled', 'disputed');
CREATE TYPE deliverable_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');
CREATE TYPE submission_status  AS ENUM ('pending', 'approved', 'changes_requested', 'rejected');
CREATE TYPE payment_type       AS ENUM ('escrow_funding', 'release', 'refund');
CREATE TYPE payment_status     AS ENUM ('pending', 'held', 'released', 'refunded', 'failed');
CREATE TYPE invoice_status     AS ENUM ('draft', 'sent', 'paid', 'overdue', 'void');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'cancelled', 'expired');
CREATE TYPE notification_type  AS ENUM ('application', 'contract', 'payment', 'message', 'review', 'system');
CREATE TYPE media_type         AS ENUM ('image', 'video', 'reel', 'story', 'post', 'short', 'thread', 'other');

-- ===========================================================================
--  2. Identity & roles (supertype + subtypes)
-- ===========================================================================

-- Supertype: every account, regardless of role
CREATE TABLE users (
    user_id        BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email          CITEXT       NOT NULL UNIQUE
                                CHECK (email::text ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
    password_hash  TEXT         NOT NULL,
    role           user_role    NOT NULL,
    full_name      VARCHAR(120) NOT NULL,
    phone          VARCHAR(30),
    avatar_url     TEXT,
    country        VARCHAR(80),
    is_verified    BOOLEAN      NOT NULL DEFAULT FALSE,
    status         account_status NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login_at  TIMESTAMPTZ,
    -- needed so subtype tables can reference (user_id, role) and pin the role
    UNIQUE (user_id, role)
);

-- Subtype: Influencer (1:1 with a user whose role = 'influencer')
CREATE TABLE influencers (
    influencer_id  BIGINT PRIMARY KEY,
    role           user_role NOT NULL DEFAULT 'influencer'
                             CHECK (role = 'influencer'),
    handle         CITEXT       NOT NULL UNIQUE,
    bio            TEXT,
    location       VARCHAR(120),
    base_rate      NUMERIC(12,2) CHECK (base_rate >= 0),
    is_available   BOOLEAN      NOT NULL DEFAULT TRUE,
    FOREIGN KEY (influencer_id, role)
        REFERENCES users (user_id, role) ON DELETE CASCADE
);

-- Subtype: Media House / Brand
CREATE TABLE media_houses (
    media_house_id BIGINT PRIMARY KEY,
    role           user_role NOT NULL DEFAULT 'media_house'
                             CHECK (role = 'media_house'),
    company_name   VARCHAR(160) NOT NULL,
    industry       VARCHAR(120),
    website        TEXT,
    description    TEXT,
    company_size   VARCHAR(40),
    FOREIGN KEY (media_house_id, role)
        REFERENCES users (user_id, role) ON DELETE CASCADE
);

-- Subtype: Super Admin
CREATE TABLE admins (
    admin_id        BIGINT PRIMARY KEY,
    role            user_role NOT NULL DEFAULT 'admin'
                              CHECK (role = 'admin'),
    admin_level     SMALLINT NOT NULL DEFAULT 1 CHECK (admin_level BETWEEN 1 AND 3),
    invite_code     VARCHAR(40),
    FOREIGN KEY (admin_id, role)
        REFERENCES users (user_id, role) ON DELETE CASCADE
);

-- ===========================================================================
--  3. Taxonomy / lookups
-- ===========================================================================

CREATE TABLE platforms (
    platform_id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(40) NOT NULL UNIQUE,     -- Instagram, YouTube, TikTok…
    base_url    TEXT
);

CREATE TABLE niches (
    niche_id SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name     VARCHAR(60) NOT NULL UNIQUE         -- Fashion, Tech, Gaming…
);

-- ===========================================================================
--  4. Influencer profile detail
-- ===========================================================================

-- M:N — an influencer works across several niches
CREATE TABLE influencer_niches (
    influencer_id BIGINT NOT NULL REFERENCES influencers (influencer_id) ON DELETE CASCADE,
    niche_id      SMALLINT NOT NULL REFERENCES niches (niche_id) ON DELETE CASCADE,
    PRIMARY KEY (influencer_id, niche_id)
);

-- One row per connected social account (an influencer may have many)
CREATE TABLE social_media_accounts (
    account_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    influencer_id   BIGINT   NOT NULL REFERENCES influencers (influencer_id) ON DELETE CASCADE,
    platform_id     SMALLINT NOT NULL REFERENCES platforms (platform_id),
    handle          VARCHAR(120) NOT NULL,
    profile_url     TEXT,
    followers_count BIGINT  NOT NULL DEFAULT 0 CHECK (followers_count >= 0),
    engagement_rate NUMERIC(5,2) CHECK (engagement_rate BETWEEN 0 AND 100),
    is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
    last_synced_at  TIMESTAMPTZ,
    UNIQUE (influencer_id, platform_id, handle)
);

-- Audience breakdown per social account (age/gender/country slices)
CREATE TABLE audience_demographics (
    demographic_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    account_id     BIGINT NOT NULL REFERENCES social_media_accounts (account_id) ON DELETE CASCADE,
    age_bracket    VARCHAR(20),                  -- '18-24', '25-34'…
    gender         VARCHAR(20),
    country        VARCHAR(80),
    percentage     NUMERIC(5,2) NOT NULL CHECK (percentage BETWEEN 0 AND 100)
);

-- Portfolio / past work samples
CREATE TABLE portfolio_items (
    portfolio_item_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    influencer_id     BIGINT NOT NULL REFERENCES influencers (influencer_id) ON DELETE CASCADE,
    platform_id       SMALLINT REFERENCES platforms (platform_id),
    title             VARCHAR(160) NOT NULL,
    description       TEXT,
    media_url         TEXT NOT NULL,
    media_kind        media_type NOT NULL DEFAULT 'other',
    posted_at         DATE
);

-- ===========================================================================
--  5. Campaigns & applications
-- ===========================================================================

CREATE TABLE campaigns (
    campaign_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    media_house_id     BIGINT NOT NULL REFERENCES media_houses (media_house_id) ON DELETE CASCADE,
    title              VARCHAR(180) NOT NULL,
    brief              TEXT,
    budget             NUMERIC(12,2) NOT NULL CHECK (budget >= 0),
    status             campaign_status NOT NULL DEFAULT 'draft',
    start_date         DATE,
    end_date           DATE,
    application_deadline DATE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- M:N — a campaign targets one or more niches
CREATE TABLE campaign_niches (
    campaign_id BIGINT NOT NULL REFERENCES campaigns (campaign_id) ON DELETE CASCADE,
    niche_id    SMALLINT NOT NULL REFERENCES niches (niche_id) ON DELETE CASCADE,
    PRIMARY KEY (campaign_id, niche_id)
);

-- Required deliverables defined at the campaign level (the "1 Reel, 3 Stories"
-- the frontend shows on a campaign card). When a contract is signed these are
-- copied into per-contract `deliverables` rows for tracking.
CREATE TABLE campaign_requirements (
    requirement_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id    BIGINT NOT NULL REFERENCES campaigns (campaign_id) ON DELETE CASCADE,
    platform_id    SMALLINT REFERENCES platforms (platform_id),
    content_kind   media_type NOT NULL DEFAULT 'post',
    quantity       SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    description    VARCHAR(160)        -- e.g. 'Reel', 'Stories', 'Long-form video'
);

-- An influencer applies to a campaign (at most once)
CREATE TABLE applications (
    application_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id    BIGINT NOT NULL REFERENCES campaigns (campaign_id) ON DELETE CASCADE,
    influencer_id  BIGINT NOT NULL REFERENCES influencers (influencer_id) ON DELETE CASCADE,
    cover_message  TEXT,
    quoted_rate    NUMERIC(12,2) CHECK (quoted_rate >= 0),
    status         application_status NOT NULL DEFAULT 'pending',
    applied_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, influencer_id)
);

-- ===========================================================================
--  6. Contracts → deliverables → submissions
-- ===========================================================================

-- A contract is created when an application is accepted.
-- media_house_id is intentionally NOT stored here (reachable via campaign) — 3NF.
CREATE TABLE contracts (
    contract_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id    BIGINT NOT NULL REFERENCES campaigns (campaign_id),
    influencer_id  BIGINT NOT NULL REFERENCES influencers (influencer_id),
    application_id BIGINT UNIQUE REFERENCES applications (application_id),
    agreed_amount  NUMERIC(12,2) NOT NULL CHECK (agreed_amount >= 0),
    status         contract_status NOT NULL DEFAULT 'active',
    terms          TEXT,
    start_date     DATE,
    end_date       DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, influencer_id),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Required pieces of work under a contract
CREATE TABLE deliverables (
    deliverable_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    contract_id    BIGINT NOT NULL REFERENCES contracts (contract_id) ON DELETE CASCADE,
    platform_id    SMALLINT REFERENCES platforms (platform_id),
    content_kind   media_type NOT NULL DEFAULT 'post',
    quantity       SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    description    TEXT,
    due_date       DATE,
    status         deliverable_status NOT NULL DEFAULT 'pending'
);

-- Actual content submitted against a deliverable (supports revisions)
CREATE TABLE content_submissions (
    submission_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    deliverable_id  BIGINT NOT NULL REFERENCES deliverables (deliverable_id) ON DELETE CASCADE,
    content_url     TEXT NOT NULL,
    caption         TEXT,
    revision_number SMALLINT NOT NULL DEFAULT 1 CHECK (revision_number > 0),
    review_status   submission_status NOT NULL DEFAULT 'pending',
    feedback        TEXT,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (deliverable_id, revision_number)
);

-- ===========================================================================
--  7. Payments & invoices
-- ===========================================================================

CREATE TABLE payments (
    payment_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    contract_id     BIGINT NOT NULL REFERENCES contracts (contract_id) ON DELETE CASCADE,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    payment_kind    payment_type   NOT NULL,
    status          payment_status NOT NULL DEFAULT 'pending',
    payment_method  VARCHAR(40),
    transaction_ref VARCHAR(120) UNIQUE,
    initiated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE invoices (
    invoice_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    contract_id    BIGINT NOT NULL REFERENCES contracts (contract_id) ON DELETE CASCADE,
    payment_id     BIGINT REFERENCES payments (payment_id),
    invoice_number VARCHAR(40) NOT NULL UNIQUE,
    amount         NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    tax            NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    total          NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    status         invoice_status NOT NULL DEFAULT 'draft',
    issued_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date       DATE
);

-- ===========================================================================
--  8. Messaging & notifications
-- ===========================================================================

CREATE TABLE conversations (
    conversation_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject         VARCHAR(180),
    campaign_id     BIGINT REFERENCES campaigns (campaign_id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- M:N — which users are in a conversation
CREATE TABLE conversation_participants (
    conversation_id BIGINT NOT NULL REFERENCES conversations (conversation_id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_read_at    TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    message_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations (conversation_id) ON DELETE CASCADE,
    sender_id       BIGINT NOT NULL REFERENCES users (user_id),
    body            TEXT NOT NULL,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    notification_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    kind            notification_type NOT NULL,
    title           VARCHAR(160) NOT NULL,
    body            TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    -- soft reference to any entity (kind tells you which table)
    related_entity  VARCHAR(40),
    related_id      BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================================================
--  9. Reviews (two-way, after a contract)
-- ===========================================================================

CREATE TABLE reviews (
    review_id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES contracts (contract_id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users (user_id),
    reviewee_id BIGINT NOT NULL REFERENCES users (user_id),
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (reviewer_id <> reviewee_id),
    -- one review per direction per contract
    UNIQUE (contract_id, reviewer_id)
);

-- ===========================================================================
--  10. Subscriptions (monetisation)
-- ===========================================================================

CREATE TABLE subscription_plans (
    plan_id       SMALLINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name          VARCHAR(60) NOT NULL,
    target_role   user_role NOT NULL,
    price_monthly NUMERIC(10,2) NOT NULL CHECK (price_monthly >= 0),
    features      TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (name, target_role)
);

CREATE TABLE user_subscriptions (
    subscription_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    plan_id             SMALLINT NOT NULL REFERENCES subscription_plans (plan_id),
    status              subscription_status NOT NULL DEFAULT 'active',
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_period_end  TIMESTAMPTZ,
    cancelled_at        TIMESTAMPTZ
);

-- ===========================================================================
--  11. Indexes (foreign keys + common filters)
-- ===========================================================================
CREATE INDEX idx_influencer_niches_niche      ON influencer_niches (niche_id);
CREATE INDEX idx_social_accounts_influencer   ON social_media_accounts (influencer_id);
CREATE INDEX idx_social_accounts_platform     ON social_media_accounts (platform_id);
CREATE INDEX idx_demographics_account         ON audience_demographics (account_id);
CREATE INDEX idx_portfolio_influencer         ON portfolio_items (influencer_id);
CREATE INDEX idx_campaigns_media_house        ON campaigns (media_house_id);
CREATE INDEX idx_campaigns_status             ON campaigns (status);
CREATE INDEX idx_campaign_niches_niche        ON campaign_niches (niche_id);
CREATE INDEX idx_campaign_requirements_camp   ON campaign_requirements (campaign_id);
CREATE INDEX idx_applications_campaign        ON applications (campaign_id);
CREATE INDEX idx_applications_influencer      ON applications (influencer_id);
CREATE INDEX idx_applications_status          ON applications (status);
CREATE INDEX idx_contracts_campaign           ON contracts (campaign_id);
CREATE INDEX idx_contracts_influencer         ON contracts (influencer_id);
CREATE INDEX idx_contracts_status             ON contracts (status);
CREATE INDEX idx_deliverables_contract        ON deliverables (contract_id);
CREATE INDEX idx_submissions_deliverable      ON content_submissions (deliverable_id);
CREATE INDEX idx_payments_contract            ON payments (contract_id);
CREATE INDEX idx_invoices_contract            ON invoices (contract_id);
CREATE INDEX idx_messages_conversation        ON messages (conversation_id);
CREATE INDEX idx_messages_sender              ON messages (sender_id);
CREATE INDEX idx_participants_user            ON conversation_participants (user_id);
CREATE INDEX idx_notifications_user_unread    ON notifications (user_id) WHERE is_read = FALSE;
CREATE INDEX idx_reviews_reviewee             ON reviews (reviewee_id);
CREATE INDEX idx_reviews_contract             ON reviews (contract_id);
CREATE INDEX idx_user_subscriptions_user      ON user_subscriptions (user_id);

-- ===========================================================================
--  12. updated_at maintenance trigger
-- ===========================================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated      BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_campaigns_updated  BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contracts_updated  BEFORE UPDATE ON contracts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ===========================================================================
--  13. Views for DERIVED data (kept out of base tables to preserve 3NF)
-- ===========================================================================

-- Average rating + review count per influencer
CREATE OR REPLACE VIEW v_influencer_ratings AS
SELECT i.influencer_id,
       u.full_name,
       ROUND(AVG(r.rating)::numeric, 2) AS avg_rating,
       COUNT(r.review_id)               AS review_count
FROM influencers i
JOIN users u ON u.user_id = i.influencer_id
LEFT JOIN reviews r ON r.reviewee_id = i.influencer_id
GROUP BY i.influencer_id, u.full_name;

-- Completed-contract count + total earnings per influencer
CREATE OR REPLACE VIEW v_influencer_stats AS
SELECT i.influencer_id,
       COUNT(c.contract_id) FILTER (WHERE c.status = 'completed') AS completed_contracts,
       COALESCE(SUM(c.agreed_amount) FILTER (WHERE c.status = 'completed'), 0) AS total_earnings
FROM influencers i
LEFT JOIN contracts c ON c.influencer_id = i.influencer_id
GROUP BY i.influencer_id;

-- Applicant counts per campaign
CREATE OR REPLACE VIEW v_campaign_applicants AS
SELECT c.campaign_id,
       c.title,
       COUNT(a.application_id) AS applicant_count
FROM campaigns c
LEFT JOIN applications a ON a.campaign_id = c.campaign_id
GROUP BY c.campaign_id, c.title;

-- Deliverable progress per contract
CREATE OR REPLACE VIEW v_contract_progress AS
SELECT ct.contract_id,
       COUNT(d.deliverable_id)                                      AS deliverables_total,
       COUNT(d.deliverable_id) FILTER (WHERE d.status = 'approved') AS deliverables_done
FROM contracts ct
LEFT JOIN deliverables d ON d.contract_id = ct.contract_id
GROUP BY ct.contract_id;

-- Media-house dashboard stats (active campaigns, committed budget, real spend).
-- Subqueries are used instead of joins to avoid aggregation fan-out across the
-- campaign → contract → payment chain.
CREATE OR REPLACE VIEW v_media_house_stats AS
SELECT mh.media_house_id,
       mh.company_name,
       (SELECT COUNT(*) FROM campaigns c
          WHERE c.media_house_id = mh.media_house_id)                AS total_campaigns,
       (SELECT COUNT(*) FROM campaigns c
          WHERE c.media_house_id = mh.media_house_id
            AND c.status NOT IN ('completed', 'cancelled'))          AS active_campaigns,
       (SELECT COALESCE(SUM(c.budget), 0) FROM campaigns c
          WHERE c.media_house_id = mh.media_house_id)                AS committed_budget,
       (SELECT COALESCE(SUM(p.amount), 0)
          FROM payments p
          JOIN contracts ct ON ct.contract_id = p.contract_id
          JOIN campaigns  c ON c.campaign_id  = ct.campaign_id
         WHERE c.media_house_id = mh.media_house_id
           AND p.status = 'released')                                AS total_spend
FROM media_houses mh;

-- ===========================================================================
--  14. Seed data for lookups (matches the frontend dummy data)
-- ===========================================================================
INSERT INTO platforms (name) VALUES
    ('Instagram'), ('YouTube'), ('TikTok'), ('X'), ('Facebook');

INSERT INTO niches (name) VALUES
    ('Fashion'), ('Tech'), ('Gaming'), ('Food'), ('Travel'),
    ('Fitness'), ('Beauty'), ('Finance'), ('Lifestyle');

INSERT INTO subscription_plans (name, target_role, price_monthly, features) VALUES
    ('Creator Free',   'influencer',  0,    'Basic profile, apply to campaigns'),
    ('Creator Pro',    'influencer',  19.0, 'Priority listing, analytics, lower fees'),
    ('Brand Starter',  'media_house', 0,    'Post up to 2 campaigns/month'),
    ('Brand Growth',   'media_house', 99.0, 'Unlimited campaigns, advanced search, support');

COMMIT;

-- ============================================================================
--  End of schema. Run with:   psql -d collabsphere -f collabsphere_schema.sql
-- ============================================================================
