# 🛡️ GeoSec CTF Lab — Geolocation Security Research Platform

A full-stack cybersecurity research and CTF (Capture The Flag) platform documenting browser geolocation permission models, tracking mechanisms, and attack surface analysis.

**For academic and CTF use only.**

---

## 🗂️ Project Structure

```
ctf-geolocation-research/
├── pages/
│   ├── index.tsx              # Main research hub + permission demo
│   ├── admin/
│   │   └── index.tsx          # Admin dashboard
│   ├── api/
│   │   ├── session.ts         # Session upsert API
│   │   ├── log-location.ts    # Location logging API
│   │   ├── submit-flag.ts     # CTF flag submission API
│   │   └── admin/
│   │       └── data.ts        # Admin data API (protected)
│   ├── _app.tsx
│   └── _document.tsx
├── lib/
│   └── supabase.ts            # Supabase client + types
├── styles/
│   └── globals.css            # Cyber aesthetic styles
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full DB schema
├── .env.local.example
├── vercel.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Deployment Guide

### Step 1 — Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to **SQL Editor** in your Supabase dashboard
3. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to create all tables, indexes, and seed CTF flags
5. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → this is your `SUPABASE_SERVICE_ROLE_KEY` (**keep secret!**)

### Step 2 — Deploy to Vercel

**Option A: GitHub + Vercel (Recommended)**

1. Push this project to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: GeoSec CTF Lab"
   git remote add origin https://github.com/yourusername/ctf-geolocation-research.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo

3. In the **Environment Variables** section, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL        = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY       = eyJhbGc...
   ADMIN_SECRET_KEY                = your-strong-random-secret-here
   ```

4. Click **Deploy** — Vercel handles the rest

**Option B: Vercel CLI**

```bash
npm install -g vercel
vercel login
vercel --prod
```

Follow the prompts and add environment variables when asked.

### Step 3 — Verify Deployment

1. Visit your Vercel URL → main research lab should load
2. Visit `/admin` → login with your `ADMIN_SECRET_KEY`
3. Click **REQUEST GEOLOCATION PERMISSION** → allow in browser → data should appear in admin panel
4. Submit a CTF flag to test the submission system

---

## 🔑 Environment Variables Reference

| Variable | Where to Get It | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key | ✅ |
| `ADMIN_SECRET_KEY` | Generate a strong random string yourself | ✅ |

**Generate a strong admin key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🏁 CTF Flags

The following flags are seeded into the database. Participants must discover them through research:

| Flag Name | Points | Category | Discovery Method |
|---|---|---|---|
| `permission_bypass_theory` | 100 | WEB | Read Module 1, understand permission states |
| `cookie_tracking` | 150 | WEB | Inspect browser cookies, study Module 2 |
| `ip_geolocation` | 200 | NETWORK | Analyze Module 3 precision table |
| `consent_model` | 250 | COMPLIANCE | Complete Module 4 ethics analysis |

**Hint:** All flags follow the format `CTF{...}` — read the research modules carefully.

---

## 🗄️ Database Schema

### `research_sessions`
Tracks unique visitors via cookie ID across sessions.
- `cookie_id` — persistent browser cookie
- `visit_count` — number of page visits
- `permission_granted` — whether geolocation was approved
- `ip_address`, `user_agent` — connection metadata

### `location_entries`
Stores each location permission event (grant or deny).
- `latitude`, `longitude`, `accuracy` — GPS data (null if denied)
- `permission_state` — `granted` | `denied` | `unknown`
- Links to `research_sessions` via `session_id`

### `ctf_flags`
CTF challenge flags with point values.
- `flag_value` — the actual flag string (e.g. `CTF{...}`)
- `points`, `category`, `description`

### `flag_submissions`
Logs all flag attempts (correct and incorrect) per session.

### `admin_notes`
Allows admin to annotate sessions for research documentation.

---

## 🔐 Admin Panel

Access at `/admin` with your `ADMIN_SECRET_KEY`.

**Features:**
- Real-time session tracking with auto-refresh (30s)
- Location log table with GPS coordinates and accuracy
- Permission grant/deny ratio visualization
- Flag submission log with correct/incorrect breakdown
- Session history with IP, user agent, visit count

**Security:** The admin API validates the key on every request via `x-admin-key` header. Never expose your `ADMIN_SECRET_KEY` publicly.

---

## 🛡️ Security Architecture

### Cookie System
- 365-day persistent cookie (`ctf_session_id`)
- `SameSite=Lax` to prevent CSRF
- `Secure` flag enforced in production (HTTPS)
- No PII stored directly in cookie value

### API Security
- Service role key only used server-side (never exposed to browser)
- Admin routes protected by secret key header check
- Row Level Security (RLS) enabled on all Supabase tables
- Input validation on all API routes

### Permission Model (Documented, Not Exploited)
- Uses standard `navigator.geolocation.getCurrentPosition()`
- Browser permission prompt is native OS-level — cannot be bypassed via JS
- Blur overlay is CSS-only UI pattern — does not restrict browser functionality
- All location data collected with user's explicit interaction

---

## ⚖️ Legal & Ethical Notice

This platform is designed for:
- ✅ CTF (Capture The Flag) competitions
- ✅ Academic cybersecurity courses
- ✅ Security awareness training
- ✅ Penetration testing education (with authorized targets only)

This platform must NOT be used for:
- ❌ Tracking real users without informed consent
- ❌ Deploying as a covert surveillance tool
- ❌ Any activity violating GDPR, CCPA, or Pakistan PPDP Act 2023

Unauthorized tracking of individuals violates computer fraud laws in most jurisdictions and may result in criminal prosecution.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, custom CSS animations |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) |
| Auth | Cookie-based sessions + admin secret key |
| Deployment | Vercel |
| Fonts | Orbitron (display), JetBrains Mono (code) |

---

## 🐛 Troubleshooting

**"Database error" on location log:**
→ Check that you ran the SQL migration in Supabase
→ Verify all 3 environment variables are set in Vercel

**Admin panel shows 401:**
→ Ensure `ADMIN_SECRET_KEY` in Vercel matches what you type in the login form

**Location not working:**
→ HTTPS is required for geolocation API — ensure your Vercel domain uses HTTPS (it does by default)
→ Check browser hasn't permanently blocked location for the domain

**Build fails on Vercel:**
→ Ensure Node.js version is 18+ in Vercel project settings
→ Check for TypeScript errors locally: `npm run build`
