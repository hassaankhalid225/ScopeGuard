# ScopeGuard — AI Shield for Freelancers

> Stop scope creep. Get paid on time. Turn conversations into smart contracts.

ScopeGuard is a full-stack SaaS that protects freelancers from the three silent
revenue killers — **scope creep**, **late payments**, and **vague agreements** —
built to the product spec in [`Docs/ScopeGuard_Product_Strategy.docx`](./Docs).

It implements the documented **MVP** (and several V2 features) across three AI
pillars:

| Pillar | What it does |
| --- | --- |
| 🛡️ **AI Scope Sentinel** | Paste a client message → AI classifies it as in / out of scope vs your baseline, prices the extra work, and drafts a polite reply. |
| 🧾 **AI Invoice Engine** | Milestones auto-generate invoices, payment links, and an escalating Day-1/7/14/30 reminder cadence. |
| 📄 **AI Contract Generator** | Turn a plain-language brief into a contract (scope, payment, IP-after-payment, kill-switch) the client e-signs in a portal. |

Plus a **dashboard** (revenue, scope-creep score, client risk, earnings saved),
a **client portal** (review & approve scope, sign contracts, approve change
orders, pay invoices) — all without the client ever logging in.

The AI engine is the **Claude API (Anthropic)** using `claude-opus-4-8`. If no
API key is configured the app runs in a deterministic **demo mode** so every
flow still works end-to-end.

---

## Architecture

```
ScopeGuard/
├── backend/     Node.js + Express + TypeScript + Prisma (PostgreSQL)
│               JWT auth · Claude API · Stripe · reminder cron
└── frontend/    Next.js 14 (App Router) + TypeScript + Tailwind CSS
                Dashboard, projects, scope, invoices, contracts, client portal
```

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| AI | Claude API (Anthropic) — `claude-opus-4-8`, adaptive thinking, structured output |
| Auth | JWT access + refresh tokens, bcrypt |
| Payments | Stripe Payment Links + webhook (optional) |
| Email | Resend (optional) for reminders |

> The PRD lists Next.js API routes / NextAuth, but per the requirement the
> **backend and frontend are separate apps**: a standalone Express API and a
> Next.js client that proxies `/api/*` to it.

---

## Quick start

### 0. Prerequisites
- Node.js ≥ 18.18
- PostgreSQL (or run `docker compose up -d` for a local one)

### 1. Database
```bash
docker compose up -d          # starts Postgres on localhost:5432
```

### 2. Backend
```bash
cd backend
cp .env.example .env          # defaults work with the docker Postgres
npm install
npm run prisma:generate
npm run prisma:migrate        # creates the schema (name it e.g. "init")
npm run db:seed               # demo data + login
npm run dev                   # → http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev                   # → http://localhost:3000
```

### 4. Log in
Open http://localhost:3000 and use the seeded account (pre-filled on the login form):

```
email:    demo@scopeguard.io
password: password123
```

---

## Enabling the live integrations

Everything works in **demo mode** out of the box. To go live, set keys in `backend/.env`:

| Feature | Env var | Without it |
| --- | --- | --- |
| Claude AI (scope, contracts, reminders) | `ANTHROPIC_API_KEY` | Heuristic fallback (keyword scope analysis, template contracts) |
| Stripe payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Mock payment link + in-portal "Pay" button |
| Email reminders | `RESEND_API_KEY` | Reminders are logged to the server console |

`GET /api/health` reports which mode each integration is in.

---

## How the core flows work

- **Create a project baseline** → deliverables, revisions, and payment milestones
  (must total 100%). Send it to the client portal for approval.
- **Complete a milestone** → an invoice is auto-generated, a payment link created,
  and it's sent. Overdue invoices flip to `OVERDUE` and accrue reminders.
- **Scope check** → paste a client request; AI returns a verdict, confidence,
  reasoning, suggested reply, and a price for extra work → convert to a **change
  order** the client approves in the portal (which grows the project budget).
- **Generate a contract** → from a brief; client signs it via a tokenized link.

### Payment reminders
The Day-1/7/14/30 reminder engine runs daily (cron in `src/index.ts`). Trigger it
manually any time:
```bash
cd backend && npm run reminders
```

---

## API surface (selected)

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` · `/login` · `/refresh` | Auth |
| `GET/POST` | `/api/clients` | Clients CRUD |
| `GET/POST` | `/api/projects` | Project baselines |
| `POST` | `/api/projects/:id/milestones/:mid/complete` | Complete → auto-invoice |
| `POST` | `/api/projects/:id/scope/analyze` | AI scope analysis |
| `POST` | `/api/projects/:id/change-orders` | Draft change order |
| `GET/POST` | `/api/invoices` | Invoices |
| `POST` | `/api/contracts/generate` | AI contract generation |
| `GET` | `/api/dashboard` | Analytics summary |
| `GET/POST` | `/api/portal/*` | Public, token-based client portal |
| `POST` | `/api/webhooks/stripe` | Stripe payment webhook |

---

## Scripts

**backend**
| Script | Description |
| --- | --- |
| `npm run dev` | Start API with hot reload |
| `npm run build` / `start` | Compile + run production build |
| `npm run prisma:migrate` | Run dev migrations |
| `npm run db:seed` | Seed demo data |
| `npm run reminders` | Run the reminder engine once |
| `npm run typecheck` | Type-check without emitting |

**frontend**
| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `start` | Production build + serve |
| `npm run typecheck` | Type-check |

---

## Production notes
- Set strong `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (`openssl rand -hex 32`).
- Run `npm run prisma:deploy` against your managed Postgres (e.g. Supabase).
- Deploy the **frontend** to Vercel and the **backend** to Render/Railway; point
  the frontend's `BACKEND_URL` at the deployed API.
- AI-generated contracts include a disclaimer — they are drafts, not legal advice.

ScopeGuard — Protect your work. Get paid. Grow free.
# ScopeGuard
