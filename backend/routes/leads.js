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
        // Wrap in quotes if value contains comma, newline, or quote
        return /[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(',')
    ),
  ];
  return lines.join('\n');
}

// ── POST /api/leads ────────────────────────────────────────────────────────
// Public — submit an early-access / waitlist signup
router.post('/', async (req, res) => {
  try {
    const { name, email, role, school_name, language } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const allowedRoles = ['student', 'teacher', 'school_admin', 'parent', 'other'];
    const cleanRole = allowedRoles.includes(role) ? role : null;

    await pool.query(
      `INSERT INTO leads (name, email, role, school_name, language)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [name.trim(), email.trim().toLowerCase(), cleanRole, school_name?.trim() || null, language || 'en']
    );

    return res.status(201).json({ success: true, message: 'Added to waitlist.' });
  } catch (err) {
    console.error('[POST /api/leads]', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── GET /api/leads ─────────────────────────────────────────────────────────
// Protected — returns all leads; supports ?format=csv and ?role= filter
router.get('/', requireAuth, async (req, res) => {
  try {
    const { format, role } = req.query;

    let query = 'SELECT id, name, email, role, school_name, language, created_at FROM leads';
    const params = [];

    const allowedRoles = ['student', 'teacher', 'school_admin', 'parent', 'other'];
    if (role && allowedRoles.includes(role)) {
      query += ' WHERE role = $1';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);

    if (format === 'csv') {
      const csv = rowsToCsv(rows);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ethiocode_leads.csv"');
      return res.send(csv);
    }

    return res.json({ success: true, count: rows.length, leads: rows });
  } catch (err) {
    console.error('[GET /api/leads]', err.message);
    return res.status(500).json({ error: 'Failed to fetch leads.' });
  }
});

export default router;
