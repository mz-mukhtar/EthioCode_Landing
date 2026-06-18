import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// ── POST /api/admin/login ─────────────────────────────────────────────────
// Compares submitted password against ADMIN_PASSWORD env var
// Returns signed JWT (24 h expiry)
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      console.error('[admin/login] ADMIN_PASSWORD env var not set!');
      return res.status(500).json({ error: 'Server misconfiguration.' });
    }

    // Support both plain-text and bcrypt-hashed passwords in the env var
    let match = false;
    if (adminPassword.startsWith('$2')) {
      // bcrypt hash stored in env
      match = await bcrypt.compare(password, adminPassword);
    } else {
      // plain text comparison (acceptable for simple single-admin setup)
      match = password === adminPassword;
    }

    if (!match) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ success: true, token });
  } catch (err) {
    console.error('[POST /api/admin/login]', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ── GET /api/admin/settings ───────────────────────────────────────────────
// Protected — returns AI config (NEVER returns the raw api_key)
router.get('/settings', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, ai_provider, ai_model, ai_base_url,
              (ai_api_key IS NOT NULL AND ai_api_key <> '') AS has_api_key,
              updated_at
       FROM admin_settings WHERE id = 1`
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Settings not found.' });
    }

    return res.json({ success: true, settings: rows[0] });
  } catch (err) {
    console.error('[GET /api/admin/settings]', err.message);
    return res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

// ── PUT /api/admin/settings ───────────────────────────────────────────────
// Protected — update AI provider, key, model, or base URL
router.put('/settings', requireAuth, async (req, res) => {
  try {
    const { ai_provider, ai_api_key, ai_base_url, ai_model } = req.body;

    const allowedProviders = ['anthropic', 'openai', 'gemini', 'local'];
    if (ai_provider && !allowedProviders.includes(ai_provider)) {
      return res.status(400).json({ error: 'Invalid AI provider.' });
    }

    // Build dynamic UPDATE — only update fields that were actually sent
    const fields = [];
    const values = [];
    let idx = 1;

    if (ai_provider !== undefined) { fields.push(`ai_provider = $${idx++}`); values.push(ai_provider); }
    if (ai_api_key  !== undefined) { fields.push(`ai_api_key  = $${idx++}`); values.push(ai_api_key || null); }
    if (ai_base_url !== undefined) { fields.push(`ai_base_url = $${idx++}`); values.push(ai_base_url || null); }
    if (ai_model    !== undefined) { fields.push(`ai_model    = $${idx++}`); values.push(ai_model || null); }

    if (!fields.length) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(1); // WHERE id = 1

    await pool.query(
      `UPDATE admin_settings SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    );

    return res.json({ success: true, message: 'Settings saved.' });
  } catch (err) {
    console.error('[PUT /api/admin/settings]', err.message);
    return res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// ── GET /api/admin/export-csv ─────────────────────────────────────────────
// Protected — convenience route that redirects to the individual CSV exports
router.get('/export-csv', requireAuth, async (req, res) => {
  const { table } = req.query;
  if (table === 'leads') return res.redirect('/api/leads?format=csv');
  if (table === 'demo')  return res.redirect('/api/demo-requests?format=csv');
  return res.status(400).json({ error: 'Specify ?table=leads or ?table=demo' });
});

export default router;
