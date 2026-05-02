# GymPro — Product Requirements Document

## Original Problem Statement (verbatim)
Build **GymPro** — a complete, production-ready Gym Management SaaS web application for Indian gym owners. Real product to be sold at ₹499–₹2999/month. Build everything fully functional, no placeholders, no "coming soon", no dummy buttons. Every feature must work end-to-end.

## Tech Stack (chosen by user)
- **Frontend:** React 19 + Tailwind + shadcn/ui + Recharts + @dnd-kit + jsPDF
- **Backend:** FastAPI + MongoDB (motor)
- **Auth:** JWT Bearer tokens (custom email/password, bcrypt)
- **Storage:** MongoDB (multi-tenant via `gym_id` scoping)

## User Personas
1. **Gym owner (primary)** — small-to-mid gym in India, manages 50–500 members, wants Hindi/Hinglish UI, WhatsApp follow-ups, simple billing.
2. **Front-desk staff** — marks attendance, records payments, handles walk-in leads.
3. **Trainer** — assigned to members, reviews schedule (read-only future).

## Core Requirements (static)
- Multi-tenant scoped by gym_id
- Indian formatting (₹, dd MMM yyyy)
- Hindi/Hinglish microcopy
- WhatsApp wa.me deep links for receipts/reminders
- Demo login pre-seeded on every backend startup
- Light + dark mode
- Mobile responsive (bottom tab bar < 1024px)

## What's Been Implemented (Feb 2026, v1.0)

### Backend (`/app/backend/server.py`)
- Auth: `POST /api/auth/register` (creates gym + owner + 4 default plans), `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
- Gym profile: `GET/PUT /api/gym`
- Plans CRUD: `/api/plans`
- Members CRUD with auto `GYM-YYYY-NNN`: `/api/members`
- Attendance: `GET/POST/DELETE /api/attendance` (idempotent per member+date)
- Payments: `/api/payments` with auto `INV-YYYY-NNNN` and auto-extends member expiry on PAID
- Leads CRUD + `PATCH /api/leads/{id}/status` for Kanban DnD
- Trainers / Expenses / Classes CRUD
- `GET /api/dashboard/stats` aggregates KPIs + 4 charts + activity feed
- Seeding on startup: FitZone Gym demo + 45 members (30 active, 8 expired, 5 frozen, 5 expiring), 5 trainers, 8 leads, 4 plans, ~75 payments, 30 days attendance, 4 classes, 3 months expenses

### Frontend
- Routing with protected `/app/*` routes + token in localStorage
- Layout: 240px sidebar + sticky header (notifications bell with auto-loaded reminders, dark/light toggle, user dropdown), mobile bottom tab bar
- **Landing** (Hero, stats, problems, features, pricing 3-tier, testimonials, FAQ, final CTA, footer)
- **Login** with demo button auto-fill + show/hide password
- **Register** 3-step wizard (Gym Info → Plans → Password)
- **Dashboard** (4 KPI cards, 4 charts: revenue bar, plan donut, new members line, week attendance bar; expiring table; activity feed)
- **Members** list + filters + search + CSV export + delete confirm + mobile cards
- **Member form** (Add/Edit) — auto fee/expiry from plan, photo upload (base64)
- **Member detail** — header card, 6 tabs (Overview, Attendance heatmap, Payments with PDF, Workout placeholder, Diet placeholder, Body Stats with BMI)
- **Attendance** Mark grid (toggle, flash green animation) + Reports tab
- **Payments** list + filters + slide-in drawer + jsPDF invoice + WhatsApp receipt
- **Leads CRM** Kanban with @dnd-kit drag-drop across 5 columns + add modal + convert to member
- **Trainers** card grid + add/edit + active toggle + delete
- **Schedules** weekly grid (Mon–Sun × 5AM–10PM) + colored class blocks
- **Expenses** stats + P&L chart (6 months) + category-coded table
- **Reports** 3 tabs (Revenue/Membership/Attendance) with charts + CSV export
- **Settings** 4 tabs (Gym Profile / Plans / Notifications / Account)

### Test Coverage
- 21/21 backend pytest tests passing (`/app/backend/tests/test_gympro_api.py`)
- Frontend smoke + critical flows verified by testing agent

## Backlog / Next Action Items (P1/P2)
- **P1:** Workout plan + Diet plan tabs (currently placeholders) — accordion editor + PDF export
- **P1:** Class capacity/booking + member RSVP
- **P1:** WhatsApp Cloud API integration for actual auto-reminders (currently uses wa.me click-thru)
- **P2:** Body measurement history (chest/waist/hips) + weight chart in Member Detail → Body Stats
- **P2:** Multi-branch / staff role management
- **P2:** Stripe / Razorpay subscription billing for the SaaS itself (Starter/Growth/Pro)
- **P2:** Push notifications, email digests
- **P2:** Bulk import CSV for members
