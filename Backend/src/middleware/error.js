// 404 for unmatched routes.
export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` })
}

// Central error handler. Maps a few common PostgreSQL errors to clean responses.
export function errorHandler(err, req, res, _next) {
  // 23505 = unique_violation, 23503 = foreign_key_violation, 23514 = check_violation
  if (err.code === '23505') return res.status(409).json({ error: 'That record already exists', detail: err.detail })
  if (err.code === '23503') return res.status(400).json({ error: 'Referenced record does not exist', detail: err.detail })
  if (err.code === '23514') return res.status(400).json({ error: 'A value failed a validation rule', detail: err.detail })
  if (err.code === '22P02') return res.status(400).json({ error: 'Invalid value for an enum or type' })

  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
}
