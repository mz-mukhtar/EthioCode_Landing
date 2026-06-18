import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import pool from './db/pool.js';
import leadsRouter from './routes/leads.js';
import demoRouter  from './routes/demo.js';
import adminRouter from './routes/admin.js';
import aiRouter    from './routes/ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────

app.use(cors({
  origin: '*', // nginx is the public face; backend only reachable via proxy
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Trust proxy headers set by nginx
app.set('trust proxy', 1);

// ── Global rate limiters ──────────────────────────────────────────────────

// General API limiter: 100 requests / 15 min per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
});

// AI chat limiter: 20 requests / hour per IP (as per spec)
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit reached. Please wait before sending more messages.' },
});

// Submission limiter: prevent form spam (5 per 10 min per IP)
const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many submissions. Please wait a few minutes.' },
});

// ── Routes ────────────────────────────────────────────────────────────────

app.use('/api/leads',         generalLimiter, leadsRouter);
app.use('/api/demo-requests', generalLimiter, demoRouter);
app.use('/api/admin',         generalLimiter, adminRouter);
app.use('/api/ai',            aiLimiter,      aiRouter);

// Apply extra submission throttle on POST-only form endpoints
app.use('/api/leads',         submitLimiter);
app.use('/api/demo-requests', submitLimiter);

// ── Health check ──────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Error handler ─────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── DB Init + Server Start ────────────────────────────────────────────────

async function initDatabase() {
  const sqlPath = join(__dirname, 'db', 'init.sql');
  const sql = await readFile(sqlPath, 'utf8');
  await pool.query(sql);
  console.log('[DB] Schema initialised.');
}

async function start() {
  try {
    await initDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] EthioCode backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
