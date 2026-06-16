import { query, getClient } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notify } from "../utils/notify.js";
import { createContractFromAgreement } from "../utils/contracts.js";

/* GET /api/applications  (auth, role-aware) */
export const listApplications = asyncHandler(async (req, res) => {
  const { role, id } = req.user;
  const base = `
    SELECT a.application_id AS id, a.campaign_id AS "campaignId", c.title AS campaign,
           u.full_name AS influencer, a.influencer_id AS "influencerId",
           a.quoted_rate::float AS quote, a.cover_message AS message,
           a.status, to_char(a.applied_at,'YYYY-MM-DD') AS date
    FROM applications a
    JOIN campaigns c   ON c.campaign_id = a.campaign_id
    JOIN influencers i ON i.influencer_id = a.influencer_id
    JOIN users u       ON u.user_id = i.influencer_id`;
  let sql = base + " ORDER BY a.applied_at DESC",
    params = [];
  if (role === "influencer") {
    sql = base + " WHERE a.influencer_id=$1 ORDER BY a.applied_at DESC";
    params = [id];
  } else if (role === "media_house") {
    sql = base + " WHERE c.media_house_id=$1 ORDER BY a.applied_at DESC";
    params = [id];
  }
  const { rows } = await query(sql, params);
  res.json(rows);
});

/* POST /api/applications  (influencer)  { campaignId, quote?, message? } */
export const createApplication = asyncHandler(async (req, res) => {
  const { campaignId, quote, message } = req.body;
  if (!campaignId)
    return res.status(400).json({ error: "campaignId is required" });
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const camp = await client.query(
      "SELECT status FROM campaigns WHERE campaign_id=$1",
      [campaignId],
    );
    if (!camp.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Campaign not found" });
    }
    if (camp.rows[0].status !== "open") {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({ error: "This campaign is no longer accepting applications" });
    }
    const ins = await client.query(
      `INSERT INTO applications (campaign_id, influencer_id, quoted_rate, cover_message)
       VALUES ($1,$2,$3,$4) RETURNING application_id`,
      [campaignId, req.user.id, quote || null, message || null],
    );
    const meta = await client.query(
      `SELECT c.title, c.media_house_id, u.full_name AS influencer
       FROM campaigns c, users u WHERE c.campaign_id=$1 AND u.user_id=$2`,
      [campaignId, req.user.id],
    );
    if (meta.rows[0]) {
      await notify((t, p) => client.query(t, p), {
        userId: meta.rows[0].media_house_id,
        kind: "application",
        title: "New application",
        body: `${meta.rows[0].influencer} applied to "${meta.rows[0].title}".`,
        entity: "application",
        id: ins.rows[0].application_id,
      });
    }
    await client.query("COMMIT");
    res.status(201).json({ id: ins.rows[0].application_id });
  } catch (e) {
    await client.query("ROLLBACK");
    if (e.code === "23505")
      return res
        .status(409)
        .json({ error: "You have already applied to this campaign" });
    throw e;
  } finally {
    client.release();
  }
});

/* PATCH /api/applications/:id  (media_house)  { status }  — accept creates a contract + escrow */
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const status = (req.body.status || "").toLowerCase();
  const allowed = [
    "pending",
    "shortlisted",
    "accepted",
    "rejected",
    "withdrawn",
  ];
  if (!allowed.includes(status))
    return res
      .status(400)
      .json({ error: `status must be one of ${allowed.join(", ")}` });
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const upd = await client.query(
      `UPDATE applications a SET status=$1::application_status
       FROM campaigns c
       WHERE a.application_id=$2 AND a.campaign_id=c.campaign_id AND c.media_house_id=$3
       RETURNING a.application_id, a.campaign_id, a.influencer_id, a.quoted_rate, c.title, c.budget`,
      [status, req.params.id, req.user.id],
    );
    if (!upd.rows[0]) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Application not found for your campaigns" });
    }
    const a = upd.rows[0];
    if (status === "accepted") {
      const amount = a.quoted_rate != null ? a.quoted_rate : a.budget;
      await createContractFromAgreement(client, {
        campaignId: a.campaign_id,
        influencerId: a.influencer_id,
        applicationId: a.application_id,
        amount,
      });
    }
    const note =
      status === "accepted"
        ? "was accepted — a contract has been created"
        : status === "rejected"
          ? "was not selected this time"
          : `is now ${status}`;
    await notify((t, p) => client.query(t, p), {
      userId: a.influencer_id,
      kind: "application",
      title: "Application update",
      body: `Your application for "${a.title}" ${note}.`,
      entity: "application",
      id: a.application_id,
    });
    await client.query("COMMIT");
    res.json({ id: a.application_id, status });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
