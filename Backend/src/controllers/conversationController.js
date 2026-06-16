import { query, getClient } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notify } from "../utils/notify.js";

/* Find an existing 1:1 (exactly-two-participant) conversation between two users. */
async function findDirect(run, a, b) {
  const { rows } = await run(
    `SELECT cp1.conversation_id AS id
     FROM conversation_participants cp1
     JOIN conversation_participants cp2 ON cp2.conversation_id = cp1.conversation_id
     WHERE cp1.user_id = $1 AND cp2.user_id = $2
       AND (SELECT count(*) FROM conversation_participants x
            WHERE x.conversation_id = cp1.conversation_id) = 2
     LIMIT 1`,
    [a, b],
  );
  return rows[0]?.id || null;
}

async function getOrCreateDirect(client, a, b) {
  const existing = await findDirect((t, p) => client.query(t, p), a, b);
  if (existing) return existing;
  const conv = await client.query(
    "INSERT INTO conversations (subject) VALUES (NULL) RETURNING conversation_id",
  );
  const cid = conv.rows[0].conversation_id;
  await client.query(
    `INSERT INTO conversation_participants (conversation_id, user_id)
     VALUES ($1,$2),($1,$3) ON CONFLICT DO NOTHING`,
    [cid, a, b],
  );
  return cid;
}

/* POST /api/conversations  — start (or fetch) a chat with the counterpart.
   media_house body: { influencerId }   influencer body: { mediaHouseId } */
export const startConversation = asyncHandler(async (req, res) => {
  const { role, id } = req.user;
  let other;
  if (role === "media_house") {
    other = req.body.influencerId;
    if (!other)
      return res.status(400).json({ error: "influencerId is required" });
    const chk = await query(
      "SELECT 1 FROM influencers WHERE influencer_id=$1",
      [other],
    );
    if (!chk.rows[0])
      return res.status(404).json({ error: "Influencer not found" });
  } else if (role === "influencer") {
    other = req.body.mediaHouseId;
    if (!other)
      return res.status(400).json({ error: "mediaHouseId is required" });
    const chk = await query(
      "SELECT 1 FROM media_houses WHERE media_house_id=$1",
      [other],
    );
    if (!chk.rows[0])
      return res.status(404).json({ error: "Media house not found" });
  } else {
    return res.status(403).json({ error: "Admins cannot start conversations" });
  }
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const cid = await getOrCreateDirect(client, id, other);
    await client.query("COMMIT");
    res.status(201).json({ id: cid });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

/* GET /api/conversations  — role-aware list with counterpart, last message, unread */
export const listConversations = asyncHandler(async (req, res) => {
  const { role, id } = req.user;
  if (role === "admin") {
    const { rows } = await query(
      `SELECT c.conversation_id AS id,
         (SELECT string_agg(u.full_name, ' <-> ' ORDER BY u.full_name)
          FROM conversation_participants cp JOIN users u ON u.user_id=cp.user_id
          WHERE cp.conversation_id=c.conversation_id) AS name,
         lm.body AS last,
         to_char(COALESCE(lm.sent_at,c.created_at),'YYYY-MM-DD"T"HH24:MI:SS') AS "lastAt",
         0 AS unread
       FROM conversations c
       LEFT JOIN LATERAL (SELECT body, sent_at FROM messages m
                          WHERE m.conversation_id=c.conversation_id
                          ORDER BY sent_at DESC LIMIT 1) lm ON true
       ORDER BY COALESCE(lm.sent_at,c.created_at) DESC`,
    );
    return res.json(rows);
  }
  const { rows } = await query(
    `SELECT c.conversation_id AS id,
       other_u.full_name AS name,
       lm.body AS last,
       to_char(COALESCE(lm.sent_at,c.created_at),'YYYY-MM-DD"T"HH24:MI:SS') AS "lastAt",
       (SELECT count(*) FROM messages m
        WHERE m.conversation_id=c.conversation_id AND m.sender_id<>$1
          AND m.sent_at > COALESCE(me.last_read_at,'epoch'::timestamptz))::int AS unread
     FROM conversations c
     JOIN conversation_participants me ON me.conversation_id=c.conversation_id AND me.user_id=$1
     JOIN conversation_participants op ON op.conversation_id=c.conversation_id AND op.user_id<>$1
     JOIN users other_u ON other_u.user_id=op.user_id
     LEFT JOIN LATERAL (SELECT body, sent_at FROM messages m
                        WHERE m.conversation_id=c.conversation_id
                        ORDER BY sent_at DESC LIMIT 1) lm ON true
     ORDER BY COALESCE(lm.sent_at,c.created_at) DESC`,
    [id],
  );
  res.json(rows);
});

async function isParticipant(cid, uid) {
  const { rows } = await query(
    "SELECT 1 FROM conversation_participants WHERE conversation_id=$1 AND user_id=$2",
    [cid, uid],
  );
  return !!rows[0];
}

/* GET /api/conversations/:id/messages */
export const getMessages = asyncHandler(async (req, res) => {
  const exists = await query(
    "SELECT 1 FROM conversations WHERE conversation_id=$1",
    [req.params.id],
  );
  if (!exists.rows[0])
    return res.status(404).json({ error: "Conversation not found" });
  const isAdmin = req.user.role === "admin";
  if (!isAdmin && !(await isParticipant(req.params.id, req.user.id)))
    return res.status(403).json({ error: "Not your conversation" });
  if (!isAdmin) {
    await query(
      "UPDATE conversation_participants SET last_read_at=now() WHERE conversation_id=$1 AND user_id=$2",
      [req.params.id, req.user.id],
    );
  }
  const { rows } = await query(
    `SELECT m.message_id AS id, m.body, (m.sender_id=$2) AS mine, u.full_name AS sender,
            to_char(m.sent_at,'YYYY-MM-DD"T"HH24:MI:SS') AS at
     FROM messages m JOIN users u ON u.user_id=m.sender_id
     WHERE m.conversation_id=$1 ORDER BY m.sent_at`,
    [req.params.id, req.user.id],
  );
  res.json({ readonly: isAdmin, messages: rows });
});

/* POST /api/conversations/:id/messages  { body } */
export const sendMessage = asyncHandler(async (req, res) => {
  const body = (req.body.body || "").trim();
  if (!body) return res.status(400).json({ error: "Message body is required" });
  if (req.user.role === "admin")
    return res.status(403).json({ error: "Admins can view but not send" });
  const exists = await query(
    "SELECT 1 FROM conversations WHERE conversation_id=$1",
    [req.params.id],
  );
  if (!exists.rows[0])
    return res.status(404).json({ error: "Conversation not found" });
  if (!(await isParticipant(req.params.id, req.user.id)))
    return res.status(403).json({ error: "Not your conversation" });

  const client = await getClient();
  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1,$2,$3)
       RETURNING message_id AS id, to_char(sent_at,'YYYY-MM-DD"T"HH24:MI:SS') AS at`,
      [req.params.id, req.user.id, body],
    );
    const me = (
      await client.query("SELECT full_name FROM users WHERE user_id=$1", [
        req.user.id,
      ])
    ).rows[0]?.full_name;
    const others = await client.query(
      "SELECT user_id FROM conversation_participants WHERE conversation_id=$1 AND user_id<>$2",
      [req.params.id, req.user.id],
    );
    for (const o of others.rows) {
      await notify((t, p) => client.query(t, p), {
        userId: o.user_id,
        kind: "message",
        title: `New message from ${me}`,
        body: body.slice(0, 80),
        entity: "conversation",
        id: Number(req.params.id),
      });
    }
    await client.query("COMMIT");
    res
      .status(201)
      .json({
        id: ins.rows[0].id,
        body,
        mine: true,
        sender: me,
        at: ins.rows[0].at,
      });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
