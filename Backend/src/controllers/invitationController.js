import { query, getClient } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notify } from "../utils/notify.js";
import { createContractFromAgreement } from "../utils/contracts.js";

/* POST /api/invitations  (media_house)  { campaignId, influencerId, message? } */
export const createInvitation = asyncHandler(async (req, res) => {
  const { campaignId, influencerId, message } = req.body;
  if (!campaignId || !influencerId)
    return res
      .status(400)
      .json({ error: "campaignId and influencerId are required" });
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const c = await client.query(
      "SELECT title FROM campaigns WHERE campaign_id=$1 AND media_house_id=$2",
      [campaignId, req.user.id],
    );
    if (!c.rows[0]) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Campaign not found for your account" });
    }
    const ins = await client.query(
      `INSERT INTO invitations (campaign_id, media_house_id, influencer_id, message)
       VALUES ($1,$2,$3,$4) RETURNING invitation_id`,
      [campaignId, req.user.id, influencerId, message || null],
    );
    const brand = await client.query(
      "SELECT company_name FROM media_houses WHERE media_house_id=$1",
      [req.user.id],
    );
    await notify((t, p) => client.query(t, p), {
      userId: influencerId,
      kind: "application",
      title: "Campaign invitation",
      body: `${brand.rows[0]?.company_name || "A media house"} invited you to "${c.rows[0].title}".`,
      entity: "invitation",
      id: ins.rows[0].invitation_id,
    });
    await client.query("COMMIT");
    res.status(201).json({ id: ins.rows[0].invitation_id });
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505")
      return res
        .status(409)
        .json({ error: "You already invited this creator to that campaign" });
    throw e;
  } finally {
    client.release();
  }
});

/* GET /api/invitations  — role-aware */
export const listInvitations = asyncHandler(async (req, res) => {
  const { role, id } = req.user;
  const base = `
    SELECT i.invitation_id AS id, i.campaign_id AS "campaignId", c.title AS campaign,
           mh.company_name AS brand, iu.full_name AS influencer, i.influencer_id AS "influencerId",
           i.message, i.status, to_char(i.created_at,'YYYY-MM-DD') AS date
    FROM invitations i
    JOIN campaigns c     ON c.campaign_id = i.campaign_id
    JOIN media_houses mh ON mh.media_house_id = i.media_house_id
    JOIN users iu        ON iu.user_id = i.influencer_id`;
  let sql = base + " ORDER BY i.created_at DESC",
    params = [];
  if (role === "influencer") {
    sql = base + " WHERE i.influencer_id=$1 ORDER BY i.created_at DESC";
    params = [id];
  } else if (role === "media_house") {
    sql = base + " WHERE i.media_house_id=$1 ORDER BY i.created_at DESC";
    params = [id];
  }
  const { rows } = await query(sql, params);
  res.json(rows);
});

/* PATCH /api/invitations/:id  (influencer)  { status: accepted|declined } */
export const decideInvitation = asyncHandler(async (req, res) => {
  const status = (req.body.status || "").toLowerCase();
  if (!["accepted", "declined"].includes(status))
    return res
      .status(400)
      .json({ error: "status must be accepted or declined" });
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const upd = await client.query(
      `UPDATE invitations SET status=$1, responded_at=now()
       WHERE invitation_id=$2 AND influencer_id=$3 AND status='pending'
       RETURNING invitation_id, campaign_id, media_house_id, influencer_id`,
      [status, req.params.id, req.user.id],
    );
    if (!upd.rows[0]) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Invitation not found or already answered" });
    }
    const inv = upd.rows[0];
    const c = await client.query(
      "SELECT title, budget FROM campaigns WHERE campaign_id=$1",
      [inv.campaign_id],
    );
    const infName = (
      await client.query("SELECT full_name FROM users WHERE user_id=$1", [
        inv.influencer_id,
      ])
    ).rows[0]?.full_name;
    if (status === "accepted") {
      await createContractFromAgreement(client, {
        campaignId: inv.campaign_id,
        influencerId: inv.influencer_id,
        amount: c.rows[0].budget,
      });
    }
    await notify((t, p) => client.query(t, p), {
      userId: inv.media_house_id,
      kind: "application",
      title: `Invitation ${status}`,
      body: `${infName} ${status} your invitation for "${c.rows[0].title}".`,
      entity: "invitation",
      id: inv.invitation_id,
    });
    await client.query("COMMIT");
    res.json({ id: inv.invitation_id, status });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
