-- CollabSphere · Phase 2 (Batch 2) migration — run once in pgAdmin.
-- Media house -> influencer invitations to a campaign.
CREATE TABLE IF NOT EXISTS invitations (
    invitation_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id    BIGINT NOT NULL REFERENCES campaigns (campaign_id) ON DELETE CASCADE,
    media_house_id BIGINT NOT NULL REFERENCES media_houses (media_house_id) ON DELETE CASCADE,
    influencer_id  BIGINT NOT NULL REFERENCES influencers (influencer_id) ON DELETE CASCADE,
    message        TEXT,
    status         VARCHAR(12) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','accepted','declined')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at   TIMESTAMPTZ,
    UNIQUE (campaign_id, influencer_id)
);
CREATE INDEX IF NOT EXISTS idx_invitations_influencer  ON invitations (influencer_id);
CREATE INDEX IF NOT EXISTS idx_invitations_media_house ON invitations (media_house_id);
