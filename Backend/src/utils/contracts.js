/* Turns an accepted application/invitation into a live contract:
   advances the campaign, creates the contract, funds an escrow payment, and
   creates deliverables. Idempotent per (campaign, influencer). */
export async function createContractFromAgreement(
  client,
  { campaignId, influencerId, applicationId = null, amount },
) {
  // Always advance the campaign once someone is engaged (safe to run repeatedly).
  await client.query(
    "UPDATE campaigns SET status='in_progress', updated_at=now() WHERE campaign_id=$1 AND status IN ('draft','open')",
    [campaignId],
  );

  const ins = await client.query(
    `INSERT INTO contracts (campaign_id, influencer_id, application_id, agreed_amount, status, start_date)
     VALUES ($1,$2,$3,$4,'in_progress',CURRENT_DATE)
     ON CONFLICT (campaign_id, influencer_id) DO NOTHING
     RETURNING contract_id`,
    [campaignId, influencerId, applicationId, amount],
  );
  if (!ins.rows[0]) {
    const ex = await client.query(
      "SELECT contract_id FROM contracts WHERE campaign_id=$1 AND influencer_id=$2",
      [campaignId, influencerId],
    );
    return ex.rows[0].contract_id; // already existed — don't double-fund
  }
  const contractId = ins.rows[0].contract_id;

  await client.query(
    `INSERT INTO payments (contract_id, amount, payment_kind, status)
     VALUES ($1,$2,'escrow_funding','held')`,
    [contractId, amount],
  );

  // Copy the campaign's defined requirements into deliverables...
  const made = await client.query(
    `INSERT INTO deliverables (contract_id, platform_id, content_kind, quantity, description, status)
     SELECT $1, cr.platform_id, cr.content_kind, cr.quantity, cr.description, 'pending'
     FROM campaign_requirements cr WHERE cr.campaign_id = $2`,
    [contractId, campaignId],
  );
  // ...or seed one default deliverable when the campaign defined none,
  // so the submit -> review -> release flow always has something to act on.
  if (made.rowCount === 0) {
    await client.query(
      `INSERT INTO deliverables (contract_id, content_kind, quantity, description, status)
       VALUES ($1,'post',1,'Agreed campaign content','pending')`,
      [contractId],
    );
  }
  return contractId;
}
