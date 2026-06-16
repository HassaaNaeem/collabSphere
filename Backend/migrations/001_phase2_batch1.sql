-- CollabSphere · Phase 2 (Batch 1) migration
-- Run this once in pgAdmin against the collabsphere database.

-- Lets the Super Admin hide/keep individual reviews.
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
