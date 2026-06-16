-- CollabSphere · Chat
-- The base schema already defines conversations / conversation_participants / messages.
-- This migration only adds helpful indexes (safe to re-run).
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent ON messages (conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_cparticipants_user        ON conversation_participants (user_id);
