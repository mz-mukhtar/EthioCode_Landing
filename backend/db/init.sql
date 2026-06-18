-- ─────────────────────────────────────────────────────────────────
-- EthioCode — Database Initialization Script
-- Runs automatically on first boot via backend/index.js
-- ─────────────────────────────────────────────────────────────────

-- ── leads ────────────────────────────────────────────────────────
-- Early access / waitlist signups from the landing page
CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  role        VARCHAR(50),           -- student | teacher | school_admin | parent | other
  school_name VARCHAR(255),
  language    VARCHAR(10),           -- en | am
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Unique index to prevent duplicate email signups
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_idx ON leads (email);

-- ── demo_requests ────────────────────────────────────────────────
-- People who request the demo APK (admin manually emails them)
CREATE TABLE IF NOT EXISTS demo_requests (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  message    TEXT,                  -- optional note from the requester
  sent       BOOLEAN DEFAULT FALSE, -- admin marks TRUE after emailing APK link
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── admin_settings ───────────────────────────────────────────────
-- AI provider configuration (single-row table)
CREATE TABLE IF NOT EXISTS admin_settings (
  id          INT PRIMARY KEY DEFAULT 1,
  ai_provider VARCHAR(50)  DEFAULT 'anthropic',  -- anthropic | openai | gemini | local
  ai_api_key  TEXT,                              -- encrypted in future; keep server-side only
  ai_base_url TEXT,                              -- used for local/Ollama endpoints
  ai_model    VARCHAR(100),                      -- override model name per provider
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Seed the one-and-only settings row so UPDATE never fails
INSERT INTO admin_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── admin_sessions ───────────────────────────────────────────────
-- Active JWT sessions (used for optional server-side revocation)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id         SERIAL PRIMARY KEY,
  token_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
