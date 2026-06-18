# EthioCode — Master Build Plan + Ai Agent Super Prompt

---

## PART 1: FOLDER STRUCTURE

Hand Ai Agent this exact folder layout. Put your assets in the right places before running the prompt.

```
ethiocode/
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── frontend/
│   ├── index.html              ← main landing page
│   ├── admin.html              ← admin dashboard
│   └── assets/
│       └── logo.png            ← your logo file
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── index.js
    ├── routes/
    │   ├── leads.js
    │   ├── demo.js
    │   ├── admin.js
    │   └── ai.js
    ├── middleware/
    │   └── auth.js
    └── db/
        ├── init.sql
        └── pool.js
```

**Before giving Ai Agent the prompt:**
- Drop your logo into `frontend/assets/logo.png`
- Fill in `.env.example` values you already know (admin password, DB name, etc.)

---

## PART 2: STEP-BY-STEP BUILD PLAN

### Phase 1 — Project Scaffold + Docker
1. Create `docker-compose.yml` with three services: `frontend` (nginx), `backend` (node), `postgres`
2. Create `nginx/nginx.conf` — serves frontend static files, proxies `/api/*` to backend
3. Create `backend/Dockerfile` — Node 20 Alpine
4. Create `.env.example` with all required variables
5. Create `backend/db/init.sql` — creates all tables on first boot

### Phase 2 — Backend (Express + PostgreSQL)
6. `backend/index.js` — Express app, CORS, JSON body parser, route mounting
7. `backend/db/pool.js` — pg Pool connected to Postgres via env vars
8. `backend/db/init.sql` — four tables: `leads`, `demo_requests`, `admin_settings`, `admin_sessions`
9. `backend/routes/leads.js` — POST /api/leads, GET /api/leads (admin)
10. `backend/routes/demo.js` — POST /api/demo-requests, GET /api/demo-requests (admin), PATCH /api/demo-requests/:id/sent (admin)
11. `backend/routes/admin.js` — POST /api/admin/login, GET/PUT /api/admin/settings, GET /api/admin/export-csv
12. `backend/routes/ai.js` — POST /api/ai/chat — reads provider + key from DB, proxies to OpenAI / Anthropic / Gemini / local
13. `backend/middleware/auth.js` — JWT-based admin auth middleware

### Phase 3 — Landing Page Frontend
14. `frontend/index.html` — full single-file landing page (HTML + CSS + JS)

**Sections in order:**
- Navbar (logo, EN/AM toggle, nav links, sticky CTA)
- Hero (video-style animated background — see design spec below)
- Problem section
- Solution section
- IDE Demo (embedded, interactive)
- Features grid
- How It Works (students + schools toggle)
- For Schools + pricing tiers
- Request Demo App section
- Early access form
- Footer

15. `frontend/admin.html` — admin dashboard (password gate → dashboard)

### Phase 4 — IDE Demo (the centerpiece)
16. Load Monaco Editor from CDN
17. Load Pyodide from CDN for real in-browser Python execution
18. Build 4-tab IDE panel: Code | Terminal | AI Tutor | Web Preview
19. Code tab: Monaco editor, Python syntax, run button
20. Terminal tab: Python output + simulated Linux commands (ls, pwd, echo, clear, help)
21. AI Tutor tab: calls `/api/ai/chat` with error context, streams response
22. Web Preview tab: iframe srcdoc with live HTML/CSS/JS preview
23. Preload a starter Python project in the editor

### Phase 5 — Admin Dashboard
24. Login form → POST /api/admin/login → store JWT in localStorage
25. Dashboard tabs: Leads | Demo Requests | Settings
26. Leads table: name, email, role, school, date, export CSV button
27. Demo Requests table: name, email, date
28. Settings tab: dropdown to select AI provider (Anthropic / OpenAI / Gemini / Local), API key input + save, base URL field for local model

---

## PART 3: DATABASE SCHEMA

```sql
-- leads: early access signups
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50),           -- student | teacher | school_admin | other
  school_name VARCHAR(255),
  language VARCHAR(10),       -- en | am
  created_at TIMESTAMP DEFAULT NOW()
);

-- demo_requests: people who requested the demo app (you email them the APK link manually)
CREATE TABLE demo_requests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT,               -- optional note from the requester
  sent BOOLEAN DEFAULT FALSE, -- admin marks TRUE after sending the link via email
  created_at TIMESTAMP DEFAULT NOW()
);

-- admin_settings: AI provider config (one row)
CREATE TABLE admin_settings (
  id INT PRIMARY KEY DEFAULT 1,
  ai_provider VARCHAR(50) DEFAULT 'anthropic',  -- anthropic | openai | gemini | local
  ai_api_key TEXT,
  ai_base_url TEXT,           -- for local model endpoint
  ai_model VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- admin_sessions: active JWT sessions
CREATE TABLE admin_sessions (
  id SERIAL PRIMARY KEY,
  token_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

---

## PART 4: ENVIRONMENT VARIABLES

```env
# .env.example

# PostgreSQL
POSTGRES_DB=ethiocode
POSTGRES_USER=ethiocode_user
POSTGRES_PASSWORD=your_strong_password_here
DATABASE_URL=postgresql://ethiocode_user:your_strong_password_here@postgres:5432/ethiocode

# Backend
PORT=3001
JWT_SECRET=your_jwt_secret_here_min_32_chars
ADMIN_PASSWORD=your_admin_password_here

# Frontend (nginx serves on 80)
FRONTEND_PORT=80
```

---

## PART 5: DESIGN SPEC FOR Ai Agent

### Color Palette
```
--blue:        #1657FF   (primary brand)
--blue-dark:   #071B5F   (deep navy, text)
--green:       #16A34A   (success, Ethiopia flag)
--yellow:      #FACC15   (accent, Ethiopia flag)
--red:         #EF4444   (error, Ethiopia flag)
--ink:         #07111F   (body text)
--muted:       #667085   (secondary text)
--bg:          #F7FBFF   (page background)
--panel:       rgba(255,255,255,0.78)  (glass cards)
```

### Typography
- Display/headings: `Inter` (weight 800-900, tight letter-spacing -0.06em to -0.08em)
- Body: `Inter` (weight 400-500, line-height 1.65)
- Code: `SFMono-Regular, Consolas, monospace`

### Hero Section — Video-Style Treatment
The hero must feel like a cinematic intro, NOT a static image. Implement it exactly like this:

- Full-viewport section
- **Background**: looping subtle animated gradient + floating particle orbs (CSS only, no canvas)
- **Left side**: headline text animates in word by word (staggered translateY + opacity)
- **Right side**: the phone mockup from the provided animation code, floating with CSS keyframes
- The phone screen cycles through 3 "scenes" automatically every 4 seconds:
  - Scene 1: Python code being typed line by line (like the provided animation)
  - Scene 2: Terminal output appearing
  - Scene 3: AI tutor chat bubble appearing
- Floating cards drift around the phone (Python runner / AI tutor / Teacher dashboard)
- Ethiopian flag color beams pulse in the background (green, yellow, red, blue)
- The overall effect: feels like watching the app in action, like a product video — but it's pure CSS/JS animation

### IDE Demo Section
- Dark section background (`#07111F`)
- Centered laptop-frame mockup containing the IDE
- Tabs: Code | Terminal | AI Tutor | Web Preview
- Starter code preloaded:
```python
# EthioCode Demo
# Try editing this and clicking Run!

def greet(name):
    return f"Hello, {name}! Welcome to EthioCode."

students = ["Abebe", "Tigist", "Dawit"]
for student in students:
    print(greet(student))
```
- Run button executes via Pyodide
- If there's an error, "Ask AI" button appears automatically
- AI Tutor tab has a chat interface, calls `/api/ai/chat`

### Amharic/English Toggle
- Flag icon buttons top-right of navbar: 🇪🇹 አማርኛ | 🇬🇧 English
- All visible text has `data-en` and `data-am` attributes
- JS toggles between them instantly, no page reload
- Store preference in localStorage

### Key Amharic Translations to Include
```
"Code from anywhere."           → "ከማንኛውም ቦታ ኮድ ጻፍ።"
"Join Early Access"             → "ቀድሞ ይመዝገቡ"
"Try the Demo"                  → "ዴሞ ይሞክሩ"
"The Problem"                   → "ችግሩ"
"Our Solution"                  → "መፍትሄያችን"
"For Schools"                   → "ለትምህርት ቤቶች"
"Request Demo App"              → "ዴሞ መተግበሪያ ጠይቅ"
"Run"                           → "አሂድ"
"Ask AI"                        → "AI ጠይቅ"
"Join the Waitlist"             → "ዝርዝሩ ይቀላቀሉ"
```

---

## PART 6: CONTENT — FULL LANDING PAGE COPY

### Hero
**EN headline:** "A Coding Lab in Every Student's Pocket"
**AM headline:** "በእያንዳንዱ ተማሪ ኪስ ውስጥ የኮዲንግ ላብ"
**Subheadline EN:** "EthioCode turns any Android phone into a full Python IDE, web builder, and school coding platform — works offline, built for Ethiopia."

### The Problem
Three cards:
1. **No Computer at Home** — Most students learn programming in school but can't practice at home. No PC means no practice.
2. **Code on Paper** — Without a way to run code, assignments become theoretical. Students memorize syntax instead of building real skills.
3. **Lab Time is Limited** — School computer labs are shared. Students get 1-2 hours per week — not enough to learn by doing.

### The Solution
**"EthioCode gives every student a real coding environment on the phone they already have."**

Four solution pillars:
1. Write and run Python programs
2. Build HTML/CSS/JS websites with live preview
3. Follow teacher-assigned learning paths
4. Submit work, get feedback, track progress

### Why EthioCode
- **Offline-first** — works with no internet. Syncs when connected.
- **Built for Ethiopia** — Amharic support, local context, affordable for schools
- **Not just an IDE** — a full school coding platform with teacher tools
- **AI-assisted** — when stuck, the AI tutor explains the error in plain language

### For Schools — Pricing Tiers
| Plan | Seats | Includes |
|---|---|---|
| Starter | 50 students | Teacher accounts, assignments, submissions |
| Growth | 100 students | + Analytics, learning paths |
| School | 250 students | + Priority support, custom roadmaps |
| Custom | Unlimited | Contact us |

CTA: "Contact us for school pricing →"

### Request Demo App Form Fields
- Full Name
- Email Address
- Message (optional — "Tell us about yourself")
- Submit button: "Request Demo App" / "ዴሞ መተግበሪያ ጠይቅ"

After submit: show "✅ Request received! We'll email you the app link within 24 hours." — no automatic download.

### Early Access Form Fields
- Full Name
- Email Address
- I am a: [Student / Teacher / School Admin / Parent / Other]
- School Name (optional, shown only for Teacher / School Admin)
- Submit button: "Join the Waitlist" / "ዝርዝሩ ይቀላቀሉ"

---

## PART 7: AI PROXY — MULTI-PROVIDER LOGIC

The backend `/api/ai/chat` route must support all four providers. Here is the switching logic:

```javascript
// backend/routes/ai.js
const providers = {
  anthropic: async (key, model, messages) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: 'You are EthioCode AI Tutor. Help students debug Python and web code. Be clear, encouraging, and concise. The student may be a beginner.',
        messages
      })
    });
    const data = await res.json();
    return data.content[0].text;
  },

  openai: async (key, model, messages) => {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || 'gpt-4o-mini', messages: [
        { role: 'system', content: 'You are EthioCode AI Tutor...' },
        ...messages
      ]})
    });
    const data = await res.json();
    return data.choices[0].message.content;
  },

  gemini: async (key, model, messages) => {
    const m = model || 'gemini-2.0-flash';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })) })
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  },

  local: async (key, model, messages, baseUrl) => {
    // OpenAI-compatible local endpoint (Ollama, LM Studio, etc.)
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key || 'local'}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || 'llama3', messages })
    });
    const data = await res.json();
    return data.choices[0].message.content;
  }
};
```

---

## PART 8: THE Ai Agent SUPER PROMPT

---

```
You are building EthioCode — a startup landing page + backend system for a mobile coding education platform aimed at Ethiopian high school students. The platform turns Android phones into full coding environments.

Read every instruction carefully before writing any code.

═══════════════════════════════════════
PROJECT OVERVIEW
═══════════════════════════════════════

EthioCode is a mobile-first, offline-ready coding education platform that gives students a real programming workspace on Android phones, and gives schools/teachers the tools to teach, assign, and track coding practice.

Tagline: "A Coding Lab in Every Student's Pocket"

Target users:
- Ethiopian high school students (no computer at home)
- Teachers who assign and review coding work
- Schools that buy student seat subscriptions

═══════════════════════════════════════
WHAT YOU ARE BUILDING
═══════════════════════════════════════

1. A stunning startup landing page (frontend/index.html) — single HTML file with embedded CSS and JS
2. An admin dashboard (frontend/admin.html) — password-protected, manages leads and AI settings
3. A Node.js/Express backend (backend/) with PostgreSQL
4. Full Docker setup (docker-compose.yml + nginx) for VPS deployment

═══════════════════════════════════════
FOLDER STRUCTURE
═══════════════════════════════════════

ethiocode/
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── frontend/
│   ├── index.html
│   ├── admin.html
│   └── assets/
│       ├── logo.png            ← ALREADY EXISTS, use it
│       ├── video-en.mp4        ← ALREADY EXISTS, use it
│       ├── video-am.mp4        ← ALREADY EXISTS, use it
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── index.js
    ├── routes/
    │   ├── leads.js
    │   ├── demo.js
    │   ├── admin.js
    │   └── ai.js
    ├── middleware/
    │   └── auth.js
    └── db/
        ├── init.sql
        └── pool.js

═══════════════════════════════════════
DESIGN SYSTEM — FOLLOW EXACTLY
═══════════════════════════════════════

Colors:
  --blue:       #1657FF
  --blue-dark:  #071B5F
  --green:      #16A34A   (Ethiopia flag)
  --yellow:     #FACC15   (Ethiopia flag)
  --red:        #EF4444   (Ethiopia flag)
  --ink:        #07111F
  --muted:      #667085
  --bg:         #F7FBFF
  --panel:      rgba(255,255,255,0.78)

Typography:
  Font: Inter (load from Google Fonts)
  Headings: weight 800-900, letter-spacing -0.06em to -0.08em
  Body: weight 400-500, line-height 1.65
  Code: SFMono-Regular, Consolas, monospace

Design language:
  - Glass morphism cards (backdrop-filter: blur)
  - Smooth animations (cubic-bezier(.2,.8,.2,1))
  - Ethiopian flag colors (green/yellow/red) used as accent beams and highlights
  - Dark code editor panels (#07111F background)
  - Rounded corners (border-radius: 24px-42px for cards, 999px for buttons)
  - Box shadows: layered, soft (rgba(7,27,95,0.12-0.28))

═══════════════════════════════════════
LANDING PAGE — SECTION BY SECTION
═══════════════════════════════════════

── NAVBAR ──
- Left: logo.png + "EthioCode" text
- Center: nav links → Features, How It Works, For Schools, Demo, Request App
- Right: language toggle (🇬🇧 EN | 🇪🇹 አማርኛ) + "Get Early Access" pill button (--blue)
- Sticky on scroll, glass background on scroll

── HERO SECTION ──
This is the most important section. It must feel cinematic — like a product video, but built with pure CSS/JS animation. Do NOT use a static image.

Implement exactly:

LEFT SIDE:
- Small eyebrow label: "Mobile Coding Platform for Ethiopian Students"
- Main headline (large, bold, tight): "A Coding Lab in Every Student's Pocket"
- Subheadline: "EthioCode turns any Android phone into a full Python IDE, web builder, and school coding platform — works offline, built for Ethiopia."
- Two CTA buttons: "Try the Demo" (primary, --blue) + "Request Demo App" (secondary, white)
- Three trust badges below buttons: "✓ Offline-first" | "✓ Python + Web" | "✓ AI Tutor"

RIGHT SIDE — THE ANIMATED PHONE STAGE:
Build this exactly as specified. It is a living animation, not a screenshot.

The phone mockup floats with a gentle CSS keyframe (phoneFloat: -2deg to +2deg rotation, 18px vertical movement, 5s infinite).

Inside the phone screen, THREE SCENES cycle automatically every 4000ms with a smooth fade transition:

SCENE 1 — Code Editor:
  Shows Python code appearing line by line (stagger animation, 350ms between lines):
  ```
  class Student:
    def learn(self):
      project = "Website"
      score = 100
      return project, score
  print("Hello Ethiopia 🇪🇹")
  ```
  Syntax highlighted: keywords in #7DD3FC, strings in #FDE68A, functions in #86EFAC, numbers in #FCA5A5

SCENE 2 — Terminal Output:
  Shows animated terminal:
  ```
  $ python main.py
  Hello Ethiopia 🇪🇹
  ✓ Score: 100
  ✓ Project: Website
  ```
  Lines appear one by one, blinking Ai Agent at end

SCENE 3 — AI Tutor:
  Shows a mini chat interface:
  AI message: "I see a missing colon on line 3. Here's how to fix it:"
  Code suggestion appears below with the fix highlighted
  A "Fixed!" green badge animates in

AROUND THE PHONE:
- Three floating glass cards drift slowly (CSS drift animation):
  Card 1 (left): "Python Runner" + green dot "Output ready"
  Card 2 (right): "AI Tutor" + blue dot "Explains errors"
  Card 3 (bottom-left): "Teacher Dashboard" + red dot "24 submissions"
- One CSS orbit ring (dashed border, rotating slowly)
- Ethiopian flag color beams (green→yellow→red gradient lines) pulsing in background
- Small glowing orbs at orbit positions

Background of entire hero:
  radial-gradient(circle at 15% 10%, rgba(22,87,255,0.18), transparent 30%),
  radial-gradient(circle at 85% 20%, rgba(250,204,21,0.25), transparent 28%),
  radial-gradient(circle at 50% 90%, rgba(22,163,74,0.16), transparent 34%),
  #F7FBFF

── THE PROBLEM ──
Section title: "The Problem We're Solving"
Three cards in a row:
  1. Icon 💻 | "No Computer at Home" | "Over 80% of Ethiopian high school students don't have a personal computer. When teachers assign coding homework, students have nowhere to practice."
  2. Icon 📄 | "Code Written on Paper" | "Without a way to run code, programming becomes theoretical. Students memorize syntax instead of developing real problem-solving skills."
  3. Icon ⏱️ | "Lab Time is Scarce" | "School computer labs are shared by hundreds of students. Each student gets just 1–2 hours per week — not nearly enough to learn by doing."

── THE SOLUTION ──
Full-width dark section (#07111F background)
Title: "EthioCode Changes Everything"
Subtitle: "One app. Every tool a student needs to actually learn programming."

Four feature pillars in 2x2 grid:
  1. 🐍 Python IDE — Write, run, and debug Python programs directly on any Android phone
  2. 🌐 Web Builder — Build HTML, CSS, and JavaScript projects with a live preview
  3. 📚 Learning Paths — Follow teacher-assigned roadmaps and complete structured lessons
  4. 🤖 AI Tutor — When you're stuck, the AI explains your error and shows you how to fix it

── IDE DEMO ──
Section title: "Try EthioCode Right Now"
Subtitle: "This is a real Python environment. Write code, run it, ask the AI for help."

Build a full interactive IDE demo:
  Container: dark laptop/monitor frame (CSS only, no images)
  Inside: 4-tab interface

  TAB 1 — CODE:
    Monaco Editor loaded from CDN: https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js
    Language: python
    Theme: vs-dark
    Starter code preloaded:
    ```python
    # EthioCode Demo — Try editing and running this!

    def greet(name):
        return f"Hello, {name}! Welcome to EthioCode 🇪🇹"

    students = ["Abebe", "Tigist", "Dawit"]

    for student in students:
        print(greet(student))
    ```
    Bottom toolbar: "▶ Run" button (green), "Clear" button, file name "main.py"

  TAB 2 — TERMINAL:
    Load Pyodide from: https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js
    When Run is clicked: execute code in Pyodide, show stdout line by line
    Also handle simulated Linux commands:
      ls → shows: main.py  output.txt  README.md
      pwd → /home/student/ethiocode
      echo [text] → prints the text
      clear → clears terminal
      help → shows list of available commands
      python --version → Python 3.11.0 (Pyodide)
    Style: dark terminal (#0A0F1A), green prompt ($), monospace font, blinking Ai Agent

  TAB 3 — AI TUTOR:
    Chat interface with message history
    System message shown: "👋 Hi! I'm your EthioCode AI Tutor. Run your code, and if you get an error, I'll explain it and help you fix it. You can also ask me anything about Python or web development."
    Input box + Send button at bottom
    When an error occurs in the terminal, a button appears: "🤖 Ask AI about this error" — clicking it pre-fills the AI chat with the error context
    AI calls POST /api/ai/chat with the message
    Show a typing indicator while waiting
    Render AI responses with basic markdown (bold, code blocks)

  TAB 4 — WEB PREVIEW:
    Switch editor language to HTML
    Starter HTML:
    ```html
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; background: #071B5F; color: white; text-align: center; padding: 40px; }
        h1 { color: #FACC15; }
        .btn { background: #1657FF; color: white; padding: 12px 24px; border: none; border-radius: 8px; Ai Agent: pointer; font-size: 16px; }
      </style>
    </head>
    <body>
      <h1>🇪🇹 My EthioCode Project</h1>
      <p>Edit this HTML and see your changes instantly!</p>
      <button class="btn" onclick="alert('Hello from EthioCode!')">Click Me</button>
    </body>
    </html>
    ```
    Live preview in iframe (srcdoc), updates as user types (debounced 500ms)

── FEATURES GRID ──
6-card grid:
  1. 📱 Mobile-First — Built for Android phones. No computer needed, ever.
  2. 📶 Offline-First — Full coding environment works without internet. Syncs when connected.
  3. 🏫 School Platform — Teachers create assignments, track submissions, manage students by class.
  4. 🤖 AI-Powered — AI tutor explains errors, guides learning, and suggests fixes in plain language.
  5. 🛤️ Learning Paths — Structured roadmaps from beginner to advanced, with teacher customization.
  6. 🔐 Assignment Integrity — Reduces copy-paste during tests. Teachers can enable integrity mode.

── HOW IT WORKS ──
Toggle between two views: "For Students" | "For Schools"

STUDENTS view — 4 steps:
  1. Download EthioCode on your Android phone
  2. Join your school's class or sign up individually
  3. Write Python and web projects in the mobile IDE
  4. Submit your work to your teacher — or just keep building

SCHOOLS view — 4 steps:
  1. Choose a seat plan (50 / 100 / 250 students)
  2. Create teacher accounts and assign student seats
  3. Teachers build roadmaps, assign homework, run quizzes
  4. Track student progress, review submissions, export reports

── REQUEST DEMO APP ──
Standalone section between "How It Works" and "For Schools".
Background: light blue tint (#EFF6FF)
Title: "Try the App on Your Phone"
Subtitle: "The EthioCode Android app is in active development. Request access and we'll send you the demo APK directly."

Simple centered card with a form:
  - Full Name (text input)
  - Email Address (email input)
  - Short message, optional (textarea, placeholder: "Tell us a little about yourself — student, teacher, school?")
  - Submit button: "Request Demo App" (EN) / "ዴሞ መተግበሪያ ጠይቅ" (AM)

On submit:
  POST /api/demo-requests
  Show success message: "✅ Request received! We'll email you the app link within 24 hours."
  No auto-download, no drive link — you will manually email the APK after reviewing the request in admin.

Note below form: "We review every request and respond within 24 hours."

── FOR SCHOOLS ──
Background: very light blue tint
Title: "Built for Ethiopian Schools"
Subtitle: "Give every student a real coding environment. Give every teacher the tools to teach it."

Pricing table — 4 cards:
  Starter | 50 Students | Teacher accounts + assignments + submissions | "Contact Us"
  Growth | 100 Students | + Analytics + learning paths | "Contact Us"  (highlighted as "Most Popular")
  School | 250 Students | + Priority support + custom roadmaps | "Contact Us"
  Custom | Unlimited | Tailored for your institution | "Get a Quote"

Below pricing: "All plans include offline access, Python + web IDE, student submissions, and AI tutor."
CTA: "Email us: hello@ethiocode.et"

── EARLY ACCESS FORM ──
Centered card, full-width section
Title: "Be Part of the First Wave"
Subtitle: "Join students, teachers, and schools building Ethiopia's coding future."

Form fields:
  - Full Name (text input)
  - Email Address (email input)
  - I am a: (select: Student / Teacher / School Admin / Parent / Other)
  - School Name (text, optional — only show if Teacher or School Admin selected)
  - Submit: "Join the Waitlist" (EN) / "ዝርዝሩ ይቀላቀሉ" (AM)

On submit:
  POST /api/leads with the form data
  Show success state: "🎉 You're on the list! We'll reach out soon."

Note: There is NO demo app download link here. Demo app requests are handled separately
in the "Request Demo App" section above. The admin manually emails the APK to requesters.

── FOOTER ──
  Left: Logo + tagline
  Center: Links (Features, For Schools, Privacy, Contact)
  Right: "Built in Ethiopia 🇪🇹" + contact email

═══════════════════════════════════════
LANGUAGE TOGGLE — IMPLEMENTATION
═══════════════════════════════════════

Every visible text element must have both:
  data-en="English text"
  data-am="Amharic text"

JS toggleLanguage(lang) function:
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.dataset[lang];
  });
  localStorage.setItem('lang', lang);

Load saved preference on page load.

Key translations:
  "Code from anywhere." → "ከማንኛውም ቦታ ኮድ ጻፍ።"
  "Join Early Access" → "ቀድሞ ይመዝገቡ"
  "Try the Demo" → "ዴሞ ይሞክሩ"
  "The Problem" → "ችግሩ"
  "Our Solution" → "መፍትሄያችን"
  "For Schools" → "ለትምህርት ቤቶች"
  "Request Demo App" → "ዴሞ መተግበሪያ ጠይቅ"
  "Run" → "አሂድ"
  "Ask AI" → "AI ጠይቅ"
  "Join the Waitlist" → "ዝርዝሩ ይቀላቀሉ"

═══════════════════════════════════════
BACKEND — FULL SPEC
═══════════════════════════════════════

── docker-compose.yml ──
Three services:
  postgres:
    image: postgres:16-alpine
    env_file: .env
    volumes: postgres_data:/var/lib/postgresql/data
    healthcheck: pg_isready

  backend:
    build: ./backend
    env_file: .env
    depends_on: postgres (healthy)
    ports: 3001 (internal only)

  frontend:
    image: nginx:alpine
    volumes: ./frontend:/usr/share/nginx/html, ./nginx/nginx.conf:/etc/nginx/nginx.conf
    ports: 80:80
    depends_on: backend

── nginx.conf ──
  Serve frontend static files
  Proxy /api/* to http://backend:3001
  Gzip enabled
  Cache static assets

── backend/db/init.sql ──
Create all four tables (leads, demo_requests, admin_settings, admin_sessions)
INSERT default admin_settings row:
  INSERT INTO admin_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

── backend/index.js ──
  Express app
  CORS (allow frontend origin)
  JSON body parser
  Routes: /api/leads, /api/demo, /api/admin, /api/ai
  On startup: run init.sql if tables don't exist

── POST /api/leads ──
  Body: { name, email, role, school_name, language }
  Validate: name and email required, email format
  Insert into leads table
  Return: { success: true, message: "Added to waitlist" }

── GET /api/leads ──
  Protected: requireAuth middleware
  Returns all leads ordered by created_at DESC
  Supports ?format=csv query param → returns CSV file download

── POST /api/demo-requests ──
  Body: { name, email, message (optional) }
  Validate: name and email required
  Insert into demo_requests (sent defaults to FALSE)
  Return: { success: true, message: "Request received! We'll email you the app link shortly." }

── GET /api/demo-requests ──
  Protected: requireAuth middleware
  Returns all requests ordered by created_at DESC
  Includes sent status so admin can track who has been emailed
  Supports ?format=csv query param → CSV download

── PATCH /api/demo-requests/:id/sent ──
  Protected: requireAuth middleware
  Marks a demo request as sent (sent = TRUE)
  Used by admin after manually emailing the APK link

── POST /api/admin/login ──
  Body: { password }
  Compare against ADMIN_PASSWORD env var (bcrypt)
  Return JWT token (expires 24h)

── GET /api/admin/settings ──
  Protected: requireAuth
  Returns: { ai_provider, ai_model } (NO api key in response)

── PUT /api/admin/settings ──
  Protected: requireAuth
  Body: { ai_provider, ai_api_key, ai_base_url, ai_model }
  Updates admin_settings row

── POST /api/ai/chat ──
  Body: { messages: [{role, content}] }
  Reads ai_provider and ai_api_key from admin_settings
  Routes to correct provider (anthropic / openai / gemini / local)
  Returns: { reply: "..." }
  Rate limit: 20 requests per IP per hour

AI provider switching logic (implement all four):
  anthropic → POST https://api.anthropic.com/v1/messages (claude-haiku-4-5-20251001)
  openai → POST https://api.openai.com/v1/chat/completions (gpt-4o-mini)
  gemini → POST https://generativelanguage.googleapis.com/v1beta/... (gemini-2.0-flash)
  local → POST {ai_base_url}/v1/chat/completions (openai-compatible format)

System prompt for all providers:
  "You are EthioCode AI Tutor — a friendly, encouraging programming tutor for Ethiopian high school students. Help them debug Python and web code. Be clear, concise, and supportive. Explain errors in plain language. If the student seems frustrated, be extra encouraging. Keep responses focused and practical."

── backend/middleware/auth.js ──
  Verify JWT from Authorization: Bearer <token> header
  Return 401 if missing or invalid

═══════════════════════════════════════
ADMIN DASHBOARD (admin.html)
═══════════════════════════════════════

Single HTML file with embedded CSS/JS.
Route: /admin.html

On load: check localStorage for JWT token. If missing → show login form.

LOGIN FORM:
  Password input + Login button
  POST /api/admin/login
  Store token in localStorage
  Show dashboard on success

DASHBOARD TABS:
  1. Leads
  2. Demo Requests
  3. Settings

LEADS TAB:
  Stats row: Total leads | Students | Teachers | School Admins
  Table: Name | Email | Role | School | Date | Language
  Export CSV button → GET /api/leads?format=csv
  Search/filter by role

DEMO REQUESTS TAB:
  Table: Name | Email | Message | Date | Status (Pending / Sent)
  "Mark as Sent" button on each Pending row — calls PATCH /api/demo-requests/:id/sent
  Pending rows have a yellow left border so you instantly see who still needs an email
  Stats: X total | X pending | X sent
  Export CSV button

SETTINGS TAB:
  AI Provider dropdown: Anthropic | OpenAI | Gemini | Local Model
  API Key input (password type, masked)
  Model name input (pre-fill based on provider: claude-haiku-4-5-20251001 / gpt-4o-mini / gemini-2.0-flash)
  Base URL input (only shown when "Local Model" selected)
  Save button → PUT /api/admin/settings
  Show last updated timestamp

LOGOUT button in navbar.

═══════════════════════════════════════
TECHNICAL REQUIREMENTS
═══════════════════════════════════════

1. The landing page is a SINGLE HTML FILE — all CSS and JS embedded inline. No build tools, no npm for frontend. Load all libraries from CDN.

2. CDN libraries to use:
   - Monaco Editor: https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js
   - Pyodide: https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js
   - Inter font: https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap

3. The backend uses Node.js 20 with these packages:
   express, pg, bcryptjs, jsonwebtoken, cors, dotenv, express-rate-limit, node-fetch

4. Docker: everything runs with docker-compose up --build

5. All API calls from frontend go to /api/* (relative URLs) — nginx proxies to backend

6. Responsive: works on mobile (375px) and desktop (1440px)

7. The hero animation must respect prefers-reduced-motion

8. Form validation: client-side + server-side

9. Never expose the AI API key to the frontend. All AI calls go through /api/ai/chat backend proxy.

═══════════════════════════════════════
BUILD ORDER
═══════════════════════════════════════

Build in exactly this order:

1. docker-compose.yml
2. .env.example
3. nginx/nginx.conf
4. backend/Dockerfile
5. backend/package.json
6. backend/db/init.sql
7. backend/db/pool.js
8. backend/middleware/auth.js
9. backend/routes/leads.js
10. backend/routes/demo.js
11. backend/routes/admin.js
12. backend/routes/ai.js
13. backend/index.js
14. frontend/index.html (the landing page — most important file)
15. frontend/admin.html (admin dashboard)

After building all files, show me:
- The complete folder structure
- How to run: cp .env.example .env && docker-compose up --build
- Which .env values I must fill in before running

═══════════════════════════════════════
IMPORTANT NOTES FOR Ai Agent
═══════════════════════════════════════

- The hero phone animation is the signature element of this page. Spend extra care on it. It must feel alive.
- The IDE demo must actually run Python via Pyodide. This is the centerpiece feature demo.
- The Amharic language toggle must work on ALL visible text.
- The admin dashboard is for one person only — keep it clean and functional, not fancy.
- All AI API calls must go through the backend. Never put API keys in frontend code.
- The Ethiopian flag colors (green #16A34A, yellow #FACC15, red #EF4444) should appear as accent elements throughout — beams, dots, borders, highlights. This is intentional brand identity.
- Assets (logo, videos) are already in frontend/assets/ — reference them by relative path.
- Make the early access form feel like the most important CTA on the page. It should be impossible to miss.
```

---

## PART 9: QUICK REFERENCE — ENV VALUES TO FILL BEFORE RUNNING

| Variable | What to put |
|---|---|
| `POSTGRES_PASSWORD` | Any strong password |
| `ADMIN_PASSWORD` | Your admin login password |
| `JWT_SECRET` | Random 32+ character string |
| `DATABASE_URL` | Auto-built from other vars — update if needed |

After first boot, go to `/admin.html` → Settings → paste your AI API key and Google Drive APK link.

---

*End of EthioCode Master Plan*
