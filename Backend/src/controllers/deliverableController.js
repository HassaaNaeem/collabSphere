import { query, getClient } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notify } from "../utils/notify.js";

/* GET /api/deliverables?contractId=  — must be a party to the contract */
export const listDeliverables = asyncHandler(async (req, res) => {
  const contractId = req.query.contractId;
  if (!contractId)
    return res.status(400).json({ error: "contractId is required" });
  const { role, id } = req.user;
  const acc = await query(
    `SELECT ct.contract_id FROM contracts ct JOIN campaigns c ON c.campaign_id=ct.campaign_id
     WHERE ct.contract_id=$1 AND ($2='admin'
        OR ($2='influencer'  AND ct.influencer_id=$3)
        OR ($2='media_house' AND c.media_house_id=$3))`,
    [contractId, role, id],
  );
  if (!acc.rows[0]) return res.status(403).json({ error: "Not your contract" });
  const { rows } = await query(
    `SELECT d.deliverable_id AS id, d.content_kind AS kind, d.quantity, d.description, d.status,
            s.content_url AS "submissionUrl", s.caption, s.review_status AS "reviewStatus",
            s.feedback, to_char(s.submitted_at,'YYYY-MM-DD') AS "submittedAt"
     FROM deliverables d
     LEFT JOIN LATERAL (
        SELECT * FROM content_submissions cs WHERE cs.deliverable_id=d.deliverable_id
        ORDER BY revision_number DESC LIMIT 1
     ) s ON true
     WHERE d.contract_id=$1 ORDER BY d.deliverable_id`,
    [contractId],
  );
  res.json(rows);
});

/* POST /api/deliverables/:id/submit  (influencer)  { url, caption? } */
export const submitDeliverable = asyncHandler(async (req, res) => {
  const { url, caption } = req.body;
  if (!url) return res.status(400).json({ error: "url is required" });
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const own = await client.query(
      `SELECT c.media_house_id, c.title
       FROM deliverables d JOIN contracts ct ON ct.contract_id=d.contract_id
       JOIN campaigns c ON c.campaign_id=ct.campaign_id
       WHERE d.deliverable_id=$1 AND ct.influencer_id=$2`,
      [req.params.id, req.user.id],
    );
    if (!own.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Deliverable not found for you" });
    }
    const rev = await client.query(
      "SELECT COALESCE(MAX(revision_number),0)+1 AS n FROM content_submissions WHERE deliverable_id=$1",
      [req.params.id],
    );
    await client.query(
      `INSERT INTO content_submissions (deliverable_id, content_url, caption, revision_number, review_status)
       VALUES ($1,$2,$3,$4,'pending')`,
      [req.params.id, url, caption || null, rev.rows[0].n],
    );
    await client.query(
      "UPDATE deliverables SET status='submitted' WHERE deliverable_id=$1",
      [req.params.id],
    );
    await notify((t, p) => client.query(t, p), {
      userId: own.rows[0].media_house_id,
      kind: "contract",
      title: "Deliverable submitted",
      body: `A deliverable was submitted for "${own.rows[0].title}".`,
      entity: "deliverable",
      id: Number(req.params.id),
    });
    await client.query("COMMIT");
    res.status(201).json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

/* PATCH /api/deliverables/:id/review  (media_house)  { decision: approve|changes|reject, feedback? } */
export const reviewDeliverable = asyncHandler(async (req, res) => {
  const decision = (req.body.decision || "").toLowerCase();
  const map = {
    approve: ["approved", "approved"],
    changes: ["pending", "changes_requested"],
    reject: ["rejected", "rejected"],
  };
  if (!map[decision])
    return res
      .status(400)
      .json({ error: "decision must be approve, changes, or reject" });
  const [delivStatus, subStatus] = map[decision];
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const own = await client.query(
      `SELECT ct.contract_id, ct.influencer_id, c.campaign_id, c.title
       FROM deliverables d JOIN contracts ct ON ct.contract_id=d.contract_id
       JOIN campaigns c ON c.campaign_id=ct.campaign_id
       WHERE d.deliverable_id=$1 AND c.media_house_id=$2`,
      [req.params.id, req.user.id],
    );
    if (!own.rows[0]) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Deliverable not on your campaigns" });
    }
    await client.query(
      `UPDATE content_submissions SET review_status=$1, feedback=$2
       WHERE deliverable_id=$3 AND revision_number=(SELECT MAX(revision_number) FROM content_submissions WHERE deliverable_id=$3)`,
      [subStatus, req.body.feedback || null, req.params.id],
    );
    await client.query(
      "UPDATE deliverables SET status=$1 WHERE deliverable_id=$2",
      [delivStatus, req.params.id],
    );

    let released = false;
    if (decision === "approve") {
      const remain = await client.query(
        "SELECT count(*)::int AS n FROM deliverables WHERE contract_id=$1 AND status<>'approved'",
        [own.rows[0].contract_id],
      );
      if (remain.rows[0].n === 0) {
        await client.query(
          "UPDATE contracts SET status='completed', updated_at=now() WHERE contract_id=$1",
          [own.rows[0].contract_id],
        );
        await client.query(
          "UPDATE payments SET status='released', completed_at=now() WHERE contract_id=$1 AND status='held'",
          [own.rows[0].contract_id],
        );
        // mark the campaign completed once no contracts on it remain open
        await client.query(
          `UPDATE campaigns SET status='completed', updated_at=now()
           WHERE campaign_id=$1
             AND NOT EXISTS (SELECT 1 FROM contracts x
                             WHERE x.campaign_id=$1 AND x.status <> 'completed')`,
          [own.rows[0].campaign_id],
        );
        released = true;
      }
    }
    const body =
      decision === "approve"
        ? released
          ? `All deliverables approved for "${own.rows[0].title}". Payment released.`
          : `A deliverable was approved for "${own.rows[0].title}".`
        : decision === "changes"
          ? `Changes requested on "${own.rows[0].title}": ${req.body.feedback || ""}`
          : `A deliverable was rejected for "${own.rows[0].title}".`;
    await notify((t, p) => client.query(t, p), {
      userId: own.rows[0].influencer_id,
      kind: released ? "payment" : "contract",
      title: released ? "Payment released" : "Deliverable reviewed",
      body,
      entity: "deliverable",
      id: Number(req.params.id),
    });
    await client.query("COMMIT");
    res.json({ id: Number(req.params.id), status: delivStatus, released });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

/* GET /api/deliverables/inbox  (media_house) — every submitted deliverable awaiting review,
   with the creator's submitted link so the brand can act without opening each contract. */
export const reviewQueue = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT d.deliverable_id AS id, d.content_kind AS kind, d.quantity,
            c.title AS campaign, ct.contract_id AS "contractId", u.full_name AS influencer,
            s.content_url AS "submissionUrl", s.caption,
            to_char(s.submitted_at,'YYYY-MM-DD') AS "submittedAt"
     FROM deliverables d
     JOIN contracts ct ON ct.contract_id = d.contract_id
     JOIN campaigns c  ON c.campaign_id = ct.campaign_id
     JOIN users u      ON u.user_id = ct.influencer_id
     LEFT JOIN LATERAL (
        SELECT * FROM content_submissions cs WHERE cs.deliverable_id=d.deliverable_id
        ORDER BY revision_number DESC LIMIT 1
     ) s ON true
     WHERE c.media_house_id = $1 AND d.status = 'submitted'
     ORDER BY s.submitted_at DESC NULLS LAST`,
    [req.user.id],
  );
  res.json(rows);
});
