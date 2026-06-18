import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function rowsToCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
        return /[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    ),
  ];
  return lines.join('\n');
}

// ── POST /api/demo-requests ────────────────────────────────────────────────
// Public — request the demo APK (admin emails them manually)
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    await pool.query(
      `INSERT INTO demo_requests (name, email, message)
       VALUES ($1, $2, $3)`,
      [name.trim(), email.trim().toLowerCase(), message?.trim() || null]
    );

    return res.status(201).json({
      success: true,
      message: "Request received! We'll email you the app link within 24 hours.",
    });
  } catch (err) {
    console.error('[POST /api/demo-requests]', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── GET /api/demo-requests ────────────────────────────────────────────────
// Protected — list all requests; supports ?format=csv and ?sent= filter
router.get('/', requireAuth, async (req, res) => {
  try {
    const { format, sent } = req.query;

    let query = 'SELECT id, name, email, message, sent, created_at FROM demo_requests';
    const params = [];

    if (sent === 'true' || sent === 'false') {
      query += ' WHERE sent = $1';
      params.push(sent === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);

    if (format === 'csv') {
      const csv = rowsToCsv(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ethiocode_demo_requests.csv"');
      return res.send(csv);
    }

    // Summary stats
    const { rows: stats } = await pool.query(
      `SELECT
         COUNT(*)                          AS total,
         COUNT(*) FILTER (WHERE NOT sent)  AS pending,
         COUNT(*) FILTER (WHERE sent)      AS sent_count
       FROM demo_requests`
    );

    return res.json({
      success: true,
      stats: {
        total:   Number(stats[0].total),
        pending: Number(stats[0].pending),
        sent:    Number(stats[0].sent_count),
      },
      requests: rows,
    });
  } catch (err) {
    console.error('[GET /api/demo-requests]', err.message);
    return res.status(500).json({ error: 'Failed to fetch demo requests.' });
  }
});

// ── PATCH /api/demo-requests/:id/sent ─────────────────────────────────────
// Protected — admin marks a request as "APK sent"
router.patch('/:id/sent', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!Number.isInteger(Number(id))) {
      return res.status(400).json({ error: 'Invalid request ID.' });
    }

    const { rows } = await pool.query(
      `UPDATE demo_requests SET sent = TRUE WHERE id = $1 RETURNING id, name, email, sent`,
      [Number(id)]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    return res.json({ success: true, request: rows[0] });
  } catch (err) {
    console.error('[PATCH /api/demo-requests/:id/sent]', err.message);
    return res.status(500).json({ error: 'Failed to update request.' });
  }
});

export default router;
