import { Router } from 'express';
import fetch from 'node-fetch';
import pool from '../db/pool.js';

const router = Router();

// ── System prompt shared by all providers ─────────────────────────────────
const SYSTEM_PROMPT =
  'You are EthioCode AI Tutor — a friendly, encouraging programming tutor for Ethiopian high school students. ' +
  'Help them debug Python and web code. Be clear, concise, and supportive. ' +
  'Explain errors in plain language. If the student seems frustrated, be extra encouraging. ' +
  'Keep responses focused and practical.';

// ── Provider call functions ────────────────────────────────────────────────

async function callAnthropic(key, model, messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

async function callOpenAI(key, model, messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(key, model, messages) {
  const m = model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;

  // Convert OpenAI-style messages to Gemini format
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callLocal(key, model, baseUrl, messages) {
  if (!baseUrl) throw new Error('Base URL is required for local model provider.');

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key || 'local'}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'llama3',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Local model API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── POST /api/ai/chat ─────────────────────────────────────────────────────
// Public (rate-limited upstream in index.js)
// Body: { messages: [{ role: "user"|"assistant", content: "..." }] }
// Reads provider + key from admin_settings, never exposes them to client
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({ error: 'messages array is required.' });
    }

    // Validate message shape
    for (const msg of messages) {
      if (!['user', 'assistant'].includes(msg.role) || typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'Each message must have role (user|assistant) and content (string).' });
      }
    }

    // Fetch AI settings from DB
    const { rows } = await pool.query(
      'SELECT ai_provider, ai_api_key, ai_model, ai_base_url FROM admin_settings WHERE id = 1'
    );

    if (!rows.length || !rows[0].ai_api_key) {
      return res.status(503).json({
        error: 'AI Tutor is not configured yet. Please ask an admin to set an API key.',
      });
    }

    const { ai_provider, ai_api_key, ai_model, ai_base_url } = rows[0];

    let reply;

    switch (ai_provider) {
      case 'anthropic':
        reply = await callAnthropic(ai_api_key, ai_model, messages);
        break;
      case 'openai':
        reply = await callOpenAI(ai_api_key, ai_model, messages);
        break;
      case 'gemini':
        reply = await callGemini(ai_api_key, ai_model, messages);
        break;
      case 'local':
        reply = await callLocal(ai_api_key, ai_model, ai_base_url, messages);
        break;
      default:
        return res.status(500).json({ error: `Unknown AI provider: ${ai_provider}` });
    }

    return res.json({ success: true, reply });
  } catch (err) {
    console.error('[POST /api/ai/chat]', err.message);
    return res.status(500).json({ error: 'AI request failed. Please try again.' });
  }
});

export default router;
