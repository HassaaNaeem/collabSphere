// Inserts a notification. `run` is either the pool `query` fn or a tx client's bound query.
export async function notify(
  run,
  { userId, kind = "system", title, body = null, entity = null, id = null },
) {
  await run(
    `INSERT INTO notifications (user_id, kind, title, body, related_entity, related_id)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [userId, kind, title, body, entity, id],
  );
}
