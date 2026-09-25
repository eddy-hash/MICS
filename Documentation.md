# NaedCredit — Documentation

Loan management platform for microfinance institutions in Tanzania.
This document covers how the system is built, how a request moves through it, the full API surface, and how to run and operate it day to day.

**Repo:** https://github.com/eddy-hash/MICS

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [How a request is handled](#2-how-a-request-is-handled)
3. [Auth & sessions](#3-auth--sessions)
4. [Roles & permissions (RBAC)](#4-roles--permissions-rbac)
5. [Loan lifecycle](#5-loan-lifecycle)
6. [Notifications, audit log, rate limiting](#6-notifications-audit-log-rate-limiting)
7. [API reference](#7-api-reference)
8. [Data model](#8-data-model)
9. [Design system](#9-design-system)
10. [Running it locally](#10-running-it-locally)
11. [Everyday usage, by role](#11-everyday-usage-by-role)
12. [Troubleshooting](#12-troubleshooting)
13. [Roadmap](#13-roadmap)

---

## 1. Architecture overview

NaedCredit is two applications talking to each other:

```
┌─────────────┐        HttpOnly cookies        ┌──────────────┐        JWT (Bearer)        ┌──────────────┐
│   Browser   │ ─────────────────────────────► │  Next.js BFF │ ─────────────────────────► │ Spring Boot  │
│  (no JWT)   │ ◄───────────────────────────── │   :3000      │ ◄───────────────────────── │   :8080      │
└─────────────┘                                 └──────────────┘                             └──────┬───────┘
                                                                                                     │
                                                                                       ┌─────────────┼─────────────┐
                                                                                       ▼                           ▼
                                                                                 ┌──────────┐               ┌──────────┐
                                                                                 │PostgreSQL│               │  Redis   │
                                                                                 │  :32768  │               │  :6379   │
                                                                                 └──────────┘               └──────────┘
```

**Backend** (`services/`) — Kotlin 2.3, Spring Boot 4.1, PostgreSQL 18 (Flyway-migrated), Redis, JJWT (HS512), Spring Security 7, BCrypt cost 12, HikariCP.

**Frontend** (`web/`) — Next.js 16 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS v4, framer-motion, recharts, react-hot-toast, jsPDF.

**The core architectural decision is the BFF (Backend-for-Frontend) pattern**: the browser never sees or stores a JWT. Next.js API routes under `/api/*` sit between the browser and Spring Boot, and the token lives only in an HttpOnly, SameSite=Strict cookie set by the BFF. This closes off the two most common ways a token leaks from a web app — XSS reading `localStorage`, and a token sitting in JS memory that a browser extension can inspect.

| Service | Where it runs | Port | Required? |
|---|---|---|---|
| PostgreSQL | Docker (`services-postgres-1`) | 32768 → 5432 | Yes — backend won't boot without it |
| Redis | Native install | 6379 | No — falls back to in-memory rate limiting if down |
| Backend | Spring Boot JVM | 8080 | Yes |
| Frontend | Next.js dev server | 3000 | Yes |

---

## 2. How a request is handled

Every browser action follows the same path, using `PUT /api/loans/{id}/approve` as an example:

1. **Browser** sends `fetch('/api/loans/123/approve', { method: 'PUT', credentials: 'include' })`. No token is attached manually — the `loan-access` cookie goes automatically.
2. **Next.js middleware** (`proxy.ts`) intercepts the request before it reaches any route handler. It checks the route against the protected-route list and rejects unauthenticated requests with a redirect to `/login` before any backend call is made.
3. **The BFF route handler** reads the `loan-access` HttpOnly cookie, and forwards the request to Spring Boot at `http://localhost:8080/api/loans/123/approve` with `Authorization: Bearer <token>` — this is the only place the raw JWT exists outside the cookie itself.
4. **Spring Security** validates the JWT signature and expiry, then `@PreAuthorize("hasAuthority('LOAN_APPROVE')")` on the controller method checks the specific permission carried inside the token.
5. **The state machine** in the loan service checks the loan's current status. `APPROVED` is only a legal transition from `UNDER_REVIEW`; anything else returns `409 Conflict` rather than silently applying the change.
6. **Side effects fire inside the same transaction**: an entry is appended to `loan_status_history` (immutable — no updates or deletes), a notification is created for the loanee, and an audit log row is written with the actor, IP, user agent, and a JSON snapshot of what changed.
7. **The response flows back** through Spring Boot → BFF → browser. If the access token was expired, the BFF's refresh logic (below) handles it transparently before the caller sees anything.

### Access token expiry and refresh

Access tokens are short-lived. When one expires mid-session:

1. The BFF gets a `401` from Spring Boot.
2. It uses the `loan-refresh` cookie to call `POST /auth/refresh` on the backend.
3. Refresh tokens rotate on every use — the old one is invalidated the moment a new one is issued. If a refresh token is presented twice (a sign it was stolen and replayed), the backend treats this as reuse, and revokes the entire session family rather than issuing a new token.
4. The BFF sets new cookies and retries the original request once, transparently to the browser.

---

## 3. Auth & sessions

- **Cookies**: `loan-access` and `loan-refresh`, both HttpOnly, `SameSite=Strict`, scoped to the app's domain. JavaScript in the browser cannot read either one.
- **Password storage**: BCrypt, cost factor 12.
- **Password change**: a three-step wizard (verify current → set new with a strength meter → confirmation), available to every role from Profile.
- **Two ways to authenticate against the system**, useful to know when testing:

| | Browser / BFF (`:3000`) | Backend direct (`:8080`) |
|---|---|---|
| Auth mechanism | HttpOnly cookies | `Authorization: Bearer <token>` header |
| Login response | `{"ok": true}`, tokens in `Set-Cookie` | `{"access_token": "..."}` |
| When to use | Anything meant to behave like the real app | Server-to-server calls, scripted tests |

```bash
# Cookie-based (BFF) — behaves exactly like the browser
curl -s -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nc.tz","password":"Admin@123"}'
curl -s -b cookies.txt http://localhost:3000/api/auth/me

# Token-based (direct backend) — for scripted / server-to-server tests
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nc.tz","password":"Admin@123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
curl -s http://localhost:8080/api/me -H "Authorization: Bearer $TOKEN"
```

---

## 4. Roles & permissions (RBAC)

Three roles ship by default: **LOANEE**, **OFFICER**, **ADMINISTRATOR**. Underneath them are 17 granular permissions stored in the `role_permissions` table — the roles are just named bundles of permissions, and the bundles are editable at runtime from **Roles & Permissions** in the admin sidebar, no redeploy required.

- The JWT carries both the coarse `ROLE_*` claim and the specific permission list, so a controller can check either `hasRole()` for broad gating or `hasAuthority('LOAN_DISBURSE')` for a precise check.
- **Changing a role's permissions immediately revokes every active session for users holding that role.** This is deliberate: a permission downgrade should take effect at once, not whenever each user's token happens to expire.
- Typical split:
  - **LOANEE** — apply for a loan, view own applications, cancel a pending one.
  - **OFFICER** — review and approve/reject loans. Cannot disburse.
  - **ADMINISTRATOR** — everything, plus disbursement, user management, RBAC editing, and the audit log.

---

## 5. Loan lifecycle

```
PENDING ──► UNDER_REVIEW ──► APPROVED ──► DISBURSED ──► REPAID
   │              │                                        
   ▼              ▼                                        
CANCELLED     REJECTED                                     
```

- Enforced **server-side** by a state machine — the frontend can only ever trigger a legal transition, but the guarantee lives in the backend regardless of what the client sends. An illegal transition (e.g. disbursing a `PENDING` loan) returns `409 Conflict`.
- **One active loan per user** — a loanee cannot submit a second application while one is already in flight.
- Every transition writes an **immutable** row to `loan_status_history`; nothing is ever updated or deleted from that table, so the full history of a loan is always reconstructable.

---

## 6. Notifications, audit log, rate limiting

**Notifications** — auto-created on every loan status change, delivered to a per-user inbox with an unread count in the navbar bell. Supports mark-as-read, mark-all-read, and delete.

**Audit log** — every sensitive action (not just loan transitions — RBAC edits, user status changes, password resets) is recorded with actor, IP address, user agent, and a JSON metadata blob describing what changed. Viewable and filterable from the admin sidebar, exportable to CSV.

**Rate limiting** — 5 failed login attempts per IP+email pair within 15 minutes triggers a `429` with a retry-after message. Backed by Redis so the limit is shared correctly across multiple backend instances; if Redis is unreachable, the backend falls back to in-memory limiting rather than failing open.

---

## 7. API reference

All routes below are BFF routes (`http://localhost:3000/api/...`) unless noted. The backend exposes the same paths directly on `:8080` for server-to-server use.

### Auth
```
POST /api/auth/register        { email, password, firstName, lastName, phone? }
POST /api/auth/login           { email, password }
POST /api/auth/refresh         (uses refresh cookie)
POST /api/auth/logout          (clears cookies)
POST /api/auth/forgot-password { email }
POST /api/auth/reset-password  { token, newPassword }
GET  /api/auth/me
```

### Profile
```
GET  /api/me
PUT  /api/me            { firstName, lastName, phone? }
PUT  /api/me/password   { currentPassword, newPassword }
```

### Loans
```
POST /api/loans                { amount, currency, termMonths, interestRate, purpose? }
GET  /api/loans                 (mine, paginated)
GET  /api/loans/pending         (officer / admin)
GET  /api/loans/{id}
PUT  /api/loans/{id}/review     { notes? }
PUT  /api/loans/{id}/approve    { notes? }
PUT  /api/loans/{id}/reject     { reason }
PUT  /api/loans/{id}/disburse   { disbursementRef }
PUT  /api/loans/{id}/repay      { repaymentRef }
PUT  /api/loans/{id}/cancel
```

### Notifications
```
GET    /api/notifications
GET    /api/notifications/unread-count
POST   /api/notifications/{id}/read
POST   /api/notifications/read-all
DELETE /api/notifications/{id}
```

### Admin
```
GET /api/admin/users
PUT /api/admin/users-proxy/{id}/roles    { roles: [] }
PUT /api/admin/users-proxy/{id}/status   { enabled?, locked? }
GET /api/admin/analytics/summary
GET /api/admin/audit                      (filter, paginate)
GET /api/admin/rbac
PUT /api/admin/rbac/{role}                { permissions: [] }
```

### End-to-end example (three roles, one loan)

```bash
curl -s -c loanee.txt  -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"loanee@nc.tz","password":"Loanee123!"}' -o /dev/null
curl -s -c officer.txt -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"officer@nc.tz","password":"Officer123!"}' -o /dev/null
curl -s -c admin.txt   -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@nc.tz","password":"Admin@123"}' -o /dev/null

LOAN_ID=$(curl -s -b loanee.txt -X POST http://localhost:3000/api/loans \
  -H "Content-Type: application/json" \
  -d '{"amount":2000000,"currency":"TZS","termMonths":6,"interestRate":0.15,"purpose":"Working capital"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

curl -s -b officer.txt -X PUT http://localhost:3000/api/loans/$LOAN_ID/approve \
  -H "Content-Type: application/json" -d '{"notes":"Documents verified"}' -o /dev/null

curl -s -b admin.txt -X PUT http://localhost:3000/api/loans/$LOAN_ID/disburse \
  -H "Content-Type: application/json" -d '{"disbursementRef":"MPESA-DEMO-001"}' -o /dev/null

curl -s -b loanee.txt http://localhost:3000/api/notifications
# Expect: LOAN_DISBURSED, LOAN_APPROVED, LOAN_SUBMITTED
```

---

## 8. Data model

Key tables (Flyway migrations V1–V8):

| Table | Purpose |
|---|---|
| `users` | Account, `enabled`/`locked` flags, password hash |
| `role_permissions` | Role → permission mapping, edited at runtime |
| `loans` | One row per application; current `status`, amount, terms |
| `loan_status_history` | Append-only audit trail of every transition |
| `notifications` | Per-user inbox |
| `audit_log` | Actor, IP, user agent, JSON metadata for sensitive actions |

Useful `psql` queries:

```sql
SELECT email, enabled, locked FROM users;
SELECT reference, status, amount FROM loans ORDER BY submitted_at DESC LIMIT 10;
SELECT role, permission FROM role_permissions ORDER BY role, permission;
SELECT action, created_at FROM audit_log ORDER BY created_at DESC LIMIT 20;
SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;
```

---

## 9. Design system

Brand accent is **blue** (`brand-500 #3b82f6`) on a **white/slate** canvas — a full ramp (`brand-50` → `brand-900`) is defined once in `web/src/app/globals.css` under Tailwind v4's `@theme`, so retinting the whole app is a single-file change:

```css
@theme {
  --color-brand-50:  #eff6ff;
  --color-brand-100: #dbeafe;
  --color-brand-200: #bfdbfe;
  --color-brand-300: #93c5fd;
  --color-brand-400: #60a5fa;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;
  --color-brand-800: #1e40af;
  --color-brand-900: #1e3a8a;
}
```

- **Neutrals**: cool-tinted `slate-50` → `slate-950`, used for backgrounds, borders, and body text so blue stays the only saturated color in the interface.
- **Semantic colors** (status only, never decoration): `emerald` = success/approved, `amber` = pending/warning, `rose` = danger/rejected, `violet` = disbursed.
- **Gradients** are restricted to hero banners (`135deg, #2563eb → #3b82f6 → #60a5fa`) — never on buttons, cards, or the sidebar.
- **Typography**: Inter (body), Plus Jakarta Sans (display), system mono for references. Currency renders with `tabular-nums` so amount columns align (`TZS 5,000,000`).
- **Motion**: the shared library at `@/lib/motion` (`FadeIn`, `Slide`, `ScaleIn`, `Stagger`, `Reveal`, `Hover`) respects `prefers-reduced-motion` globally — never animate the same element on both mount and scroll.
- **Accessibility floor**: 4.5:1 text contrast, visible `ring-2 ring-brand-500 ring-offset-2` focus states, `aria-label` on every icon-only button, and status is never conveyed by color alone (always paired with an icon or label).

---

## 10. Running it locally

```bash
# 1. Redis (optional but recommended)
sudo systemctl start redis
redis-cli ping                      # expect: PONG

# 2. Backend — Terminal 1, leave running
cd ~/SaaS/MICS/services
docker compose up -d                # starts Postgres
./mvnw spring-boot:run
# wait for: Started ServicesApplicationKt in X.XXX seconds

# 3. Frontend — Terminal 2, leave running
cd ~/SaaS/MICS/web
npm install
npm run dev
# wait for: ✓ Ready in Xms

# 4. Open http://localhost:3000/login
```

If `~/.bashrc` aliases are set up: `run` / `runs` (start), `nbstop` / `nfstop` (kill), `db` (psql), `unlock` (clear rate limits), `hash 'p'` (BCrypt a password), `setpass email password` (hash + update DB).

### Dev seed accounts

> Seeded by `SeedData.kt` on first boot — development only, never used in production.

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@nc.tz` | `Admin@123` |
| Officer | `officer@nc.tz` | `Officer123!` |
| Loanee | `loanee@nc.tz` | `Loanee123!` |

---

## 11. Everyday usage, by role

**Administrator** — full access. Sidebar: Overview, Notifications, Review Queue, Disbursements, Analytics, Users, Roles & Permissions, Audit Log, Profile.
- Approve a loan: *Review Queue → open loan → Approve*
- Disburse: *Disbursements → open loan → enter M-Pesa ref → Disburse*
- Change a user's role: *Users → toggle role → saves instantly*
- Edit RBAC: *Roles & Permissions → toggle permission → Save* (revokes affected sessions)
- Export the audit trail: *Audit Log → CSV / PDF / Print*

**Officer** — reviews and approves/rejects, cannot disburse. Sidebar: Overview, Notifications, Review Queue, Profile.

**Loanee** — applies, tracks status, cancels while pending. Sidebar: Overview, My Loans, Apply for Loan, Notifications, Profile. Limited to one active loan at a time.

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| Port 8080 in use | `sudo fuser -k 8080/tcp` then restart the backend |
| Port 3000 in use | `pkill -9 -f "next dev"; pkill -9 -f "next-server"` then restart the frontend |
| "Too many failed attempts" | `redis-cli --scan --pattern "login:failures:*" \| xargs -r redis-cli del` (or `unlock`) |
| "Invalid email or password" with correct credentials | Check `enabled`/`locked` in `users`; `UPDATE users SET enabled=TRUE, locked=FALSE WHERE email=...` |
| Postgres container missing | `docker compose up -d` from `services/`, verify with `docker ps --filter name=services-postgres` |
| "Flyway checksum mismatch" | Dev only: `docker compose down -v && docker compose up -d && ./mvnw spring-boot:run` |
| Redis unreachable but app should still boot | `REDIS_ENABLED=false ./mvnw spring-boot:run`, or start Redis |
| Frontend showing stale content | `pkill -9 -f "next dev"; rm -rf .next; npm run dev` |

**Full health check:**

```bash
echo "Postgres:  $(docker exec services-postgres-1 pg_isready -U myuser -d mydatabase 2>/dev/null | grep -q accepting && echo OK || echo DOWN)"
echo "Redis:     $(redis-cli ping 2>/dev/null || echo DOWN)"
echo "Backend:   $(curl -s -o /dev/null -w '%{http_code}' -X POST http://localhost:8080/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@nc.tz","password":"Admin@123"}')"
echo "Frontend:  $(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login)"
# All should read: OK / PONG / 200 / 200
```

**Inspecting Redis directly:**

```bash
redis-cli keys "*"
redis-cli keys "rbac:*"
redis-cli keys "login:failures:*"
redis-cli ttl "login:failures:127.0.0.1|admin@nc.tz"
redis-cli del "login:failures:127.0.0.1|admin@nc.tz"
```

---

## 13. Roadmap

Not yet built, in rough priority order:

- **M-Pesa integration** — Vodacom Tanzania OpenAPI or an aggregator (Selcom, Azampay, Beyonic); disbursement + repayment endpoints with Redis-backed idempotency keys, plus a webhook receiver for async callbacks.
- **Loan amortization schedules** — installment table generated on approval, principal/interest breakdown, outstanding balance tracking, and a daily cron for overdue detection.
- **Nginx reverse proxy** — `naedcredit.local` → Next.js (moved off :3000 to avoid conflict) and `/backend/*` → Spring Boot, without touching the existing POS project on port 80.
- **KYC document upload** — borrower ID, payslip, bank statements.
- **Credit scoring** — CRB Tanzania integration.
- **SMS notifications** — Beem or Africa's Talking.
- **Multi-currency** — beyond TZS.
- **Deployment prep** — Dockerfiles for both services, a production `compose.yaml`, env-based secrets, and a GitHub Actions CI workflow.

New work should match existing conventions: Kotlin data classes with constructor injection, DTOs validated with Jakarta Bean Validation, `@PreAuthorize` on every mutation, BFF proxy routes for anything new the frontend calls, and the shared motion/toast components on the frontend side.

---

*Proprietary — internal use.*
