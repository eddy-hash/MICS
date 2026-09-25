# NaedCredit — Complete Documentation

> A secure, production-shaped loan management platform for microfinance
> institutions in Tanzania. Built with Spring Boot 4 (Kotlin) and Next.js 16.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features by Role](#features-by-role)
4. [Tech Stack](#tech-stack)
5. [Security Model](#security-model)
6. [Data Model](#data-model)
7. [RBAC Permissions Matrix](#rbac-permissions-matrix)
8. [API Reference](#api-reference)
9. [Project Structure](#project-structure)
10. [Development Setup](#development-setup)
11. [Environment Variables](#environment-variables)
12. [Deployment Notes](#deployment-notes)
13. [Roadmap](#roadmap)

## Overview

NaedCredit is a **role-based loan management system** with three actors:
Loanee, Officer, Administrator — working through a complete loan lifecycle.

    PENDING ──► UNDER_REVIEW ──► APPROVED ──► DISBURSED ──► REPAID
       │            │               │
       │            └──► REJECTED   │
       └──► CANCELLED               └──► (invalid transitions blocked)

Every state change is:
- **Enforced server-side** — no client can skip steps
- **Recorded in an immutable history table** — for regulators
- **Emitted as a notification** — to the affected user
- **Written to the audit log** — with actor, IP, and metadata

## Architecture

    ┌────────────────────────────────────────────────┐
    │  Browser                                       │
    │    · Never sees a JWT                          │
    │    · Talks only to same-origin Next.js (BFF)   │
    │    · HttpOnly + SameSite=Strict cookies        │
    └─────────────────────┬──────────────────────────┘
                          │
                          ▼
    ┌────────────────────────────────────────────────┐
    │  Next.js 16 (App Router)  :3000                │
    │    · Server Components render pages            │
    │    · BFF routes proxy to Spring Boot           │
    │    · Cookies stored server-side only           │
    │    · proxy.ts gates routes                     │
    └─────────────────────┬──────────────────────────┘
                          │ Bearer JWT
                          ▼
    ┌────────────────────────────────────────────────┐
    │  Spring Boot 4 + Kotlin  :8080                 │
    │    · Stateless — no sessions                   │
    │    · JwtAuthenticationFilter (HS512)           │
    │    · @PreAuthorize enforces RBAC               │
    │    · Rate limiting on /api/auth/login          │
    └─────┬───────────────────┬──────────────────────┘
          │                   │
          ▼                   ▼
      ┌─────────┐         ┌──────────┐
      │Postgres │         │  Redis   │
      │ :5432   │         │  :6379   │
      │(docker) │         │(native)  │
      └─────────┘         └──────────┘

**Why the BFF?** The browser never holds a JWT. Tokens live only in
`HttpOnly` cookies that JavaScript cannot read. XSS can't steal them.
CSRF can't replay them (SameSite=Strict).

## Features by Role

### Loanee
- Self-registration with password strength enforcement
- Apply for a loan (TZS 100,000 – 500,000,000)
- Live monthly-payment preview while filling the form
- Track application status in real time
- View full status history (timeline)
- Cancel pending applications
- Receive notifications on every status change
- Change password via 3-step wizard

### Officer
- Review queue of pending applications (oldest first)
- Approve with optional notes
- Reject with mandatory reason
- Full applicant history and loan detail

### Administrator
- Everything officers can do
- Disburse approved loans with external reference (M-Pesa code)
- Mark loans as repaid
- Manage user roles (LOANEE / OFFICER / ADMINISTRATOR)
- Enable / disable / lock user accounts
- Edit RBAC permissions matrix at runtime
- View analytics dashboard with charts
- Full audit log with filter and export

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend language | Kotlin | 2.3.21 |
| Backend framework | Spring Boot | 4.1.1 |
| Web server | Tomcat | 11.x |
| Persistence | Spring Data JPA + Hibernate | 7.4.5 |
| Database | PostgreSQL | 18.6 |
| Migrations | Flyway | 12.4.0 |
| Auth | JJWT | 0.12.6 |
| Password hashing | BCrypt | cost 12 |
| Cache | Redis | 8.x |
| Frontend | Next.js | 16.3.6 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4 |
| Animation | framer-motion | latest |
| Charts | recharts | latest |
| Icons | heroicons + react-icons | latest |
| Toasts | react-hot-toast | latest |
| PDF | jspdf + jspdf-autotable | latest |

## Security Model

| Threat | Mitigation | Where |
|---|---|---|
| XSS token theft | HttpOnly cookies | web/src/lib/cookies.ts |
| CSRF | SameSite=Strict + path isolation | Cookie options |
| Session fixation | Refresh-token rotation | TokenService.rotate() |
| Token replay | JTI tracking + reuse detection | TokenService |
| Brute force | 5 attempts / 15 min (Redis) | RedisRateLimiter |
| User enumeration | Identical responses | AuthController |
| Privilege escalation | @PreAuthorize per endpoint | SecurityConfig |
| Illegal state transitions | Server-side state machine | LoanService |
| Weak passwords | 12+ chars, mixed case, digit | RegisterRequest |
| SQL injection | JPA named parameters | All repositories |

### Token lifetimes

| Token | Lifetime | Storage | Rotation |
|---|---|---|---|
| Access | 15 min | `__Host-loan-access` cookie | On refresh |
| Refresh | 7 days | `__Host-loan-refresh` cookie | Every use |

## Data Model

    users (id, email, password_hash, first_name, last_name, phone, enabled, locked, created_at)
      ├─ user_roles (user_id, role)
      ├─ refresh_tokens (jti, user_id, expires_at, revoked, replaced_by, ip_address)
      └─ loans (id, reference, applicant_id, amount, currency, status, ...)

    loans ─► loan_status_history (loan_id, from_status, to_status, changed_by, notes, changed_at)
    audit_log (actor_id, action, resource_type, resource_id, ip_address, metadata, created_at)
    notifications (user_id, type, title, body, read, created_at)
    role_permissions (role, permission)
    password_reset_tokens (token, user_id, expires_at, used)

### Flyway migrations

| Version | Description |
|---|---|
| V1 | Core schema |
| V2 | Password reset tokens |
| V3 | Loan reference sequence |
| V4 | IP address as VARCHAR |
| V5 | Notifications |
| V6 | Audit metadata as TEXT |
| V7 | Role→permission mappings |
| V8 | Strip loanee perms from staff |

## RBAC Permissions Matrix

| Permission | LOANEE | OFFICER | ADMINISTRATOR |
|---|---|---|---|
| `loan:create` | ✅ | ❌ | ❌ |
| `loan:view:own` | ✅ | ❌ | ❌ |
| `loan:view:all` | ❌ | ✅ | ✅ |
| `loan:review` | ❌ | ✅ | ✅ |
| `loan:approve` | ❌ | ✅ | ✅ |
| `loan:reject` | ❌ | ✅ | ✅ |
| `loan:disburse` | ❌ | ❌ | ✅ |
| `loan:repay` | ❌ | ❌ | ✅ |
| `loan:cancel:own` | ✅ | ❌ | ❌ |
| `user:view:all` | ❌ | ❌ | ✅ |
| `user:manage:roles` | ❌ | ❌ | ✅ |
| `user:manage:status` | ❌ | ❌ | ✅ |
| `audit:view` | ❌ | ❌ | ✅ |
| `analytics:view` | ❌ | ❌ | ✅ |
| `notification:view:own` | ✅ | ✅ | ✅ |
| `profile:edit:own` | ✅ | ✅ | ✅ |
| `role:permission:manage` | ❌ | ❌ | ✅ |

Editable at runtime via `/admin/rbac`.

## API Reference

All requests hit the **BFF** on `:3000`, which forwards to Spring Boot on `:8080`.

### Public

| Method | Path |
|---|---|
| POST | /api/auth/register |
| POST | /api/auth/login |
| POST | /api/auth/refresh |
| POST | /api/auth/logout |
| POST | /api/auth/forgot-password |
| POST | /api/auth/reset-password |

### Authenticated

| Method | Path |
|---|---|
| GET | /api/auth/me |
| GET | /api/me |
| PUT | /api/me |
| PUT | /api/me/password |

### Loans

| Method | Path | Permission |
|---|---|---|
| POST | /api/loans | loan:create |
| GET | /api/loans | loan:view:own |
| GET | /api/loans/pending | loan:view:all |
| GET | /api/loans/{id} | own or loan:view:all |
| PUT | /api/loans/{id}/review | loan:review |
| PUT | /api/loans/{id}/approve | loan:approve |
| PUT | /api/loans/{id}/reject | loan:reject |
| PUT | /api/loans/{id}/disburse | loan:disburse |
| PUT | /api/loans/{id}/repay | loan:repay |
| PUT | /api/loans/{id}/cancel | loan:cancel:own |

### Notifications

| Method | Path |
|---|---|
| GET | /api/notifications |
| GET | /api/notifications/unread-count |
| POST | /api/notifications/{id}/read |
| POST | /api/notifications/read-all |
| DELETE | /api/notifications/{id} |

### Admin

| Method | Path | Permission |
|---|---|---|
| GET | /api/admin/users | user:view:all |
| PUT | /api/admin/users/{id}/roles | user:manage:roles |
| PUT | /api/admin/users/{id}/status | user:manage:status |
| GET | /api/admin/analytics/summary | analytics:view |
| GET | /api/admin/audit | audit:view |
| GET | /api/admin/rbac | role:permission:manage |
| PUT | /api/admin/rbac/{role} | role:permission:manage |

## Project Structure

    MICS/
    ├── DOCUMENTATION.md
    ├── README.md
    ├── .gitignore
    ├── services/                     Spring Boot + Kotlin
    │   ├── pom.xml
    │   ├── compose.yaml
    │   └── src/main/
    │       ├── kotlin/LOANS/services/
    │       │   ├── auth/
    │       │   ├── security/
    │       │   ├── user/
    │       │   ├── loan/
    │       │   ├── rbac/
    │       │   ├── notification/
    │       │   ├── audit/
    │       │   ├── admin/
    │       │   ├── common/
    │       │   └── config/
    │       └── resources/
    │           ├── application.yml
    │           └── db/migration/     Flyway V1–V8
    └── web/                          Next.js 16 frontend + BFF
        ├── package.json
        └── src/
            ├── app/
            │   ├── (public)/
            │   ├── (app)/
            │   └── api/              BFF routes
            ├── components/
            │   ├── ui/
            │   ├── domain/
            │   ├── layout/
            │   ├── auth/
            │   └── charts/
            ├── lib/
            │   ├── cookies.ts
            │   ├── api.ts
            │   ├── pdf.ts
            │   ├── csv.ts
            │   ├── motion.ts         animation design system
            │   └── toast.tsx
            ├── context/ThemeContext.tsx
            ├── hooks/use-user.ts
            └── proxy.ts

## Development Setup

### Prerequisites
- Java 17+ (21+ recommended)
- Node.js 18+ (20+ recommended)
- Docker (for Postgres)
- Redis (optional but recommended)
- htpasswd (for hashing dev passwords)

### 1. Clone

    git clone git@github.com:eddy-hash/MICS.git
    cd MICS

### 2. Backend

    cd services
    ./mvnw clean dependency:resolve
    docker compose up -d
    REDIS_ENABLED=true ./mvnw spring-boot:run

Wait for `Started ServicesApplicationKt in X.XXX seconds`.

### 3. Frontend

    cd web
    npm install
    npm run dev

Opens at http://localhost:3000.

### 4. Sign in

| Role | Email | Password |
|---|---|---|
| Administrator | admin@nc.tz | Admin@123 |
| Officer | officer@nc.tz | Officer123! |
| Loanee | loanee@nc.tz | Loanee123! |

Dev seed accounts — change before production.

### Dev helper aliases (~/.bashrc)

    alias run='cd ~/SaaS/MICS/services && ./mvnw spring-boot:run'
    alias runs='cd ~/SaaS/MICS/web && npm run dev'
    alias nbstop='pkill -9 -f "spring-boot"; pkill -9 -f "ServicesApplicationKt"'
    alias nfstop='pkill -9 -f "next dev"; pkill -9 -f "next-server"'
    alias db='docker exec -e PGPASSWORD=secret -it services-postgres-1 psql -U myuser -d mydatabase'

    unlock() {
      redis-cli --scan --pattern "login:failures:*" | xargs -r redis-cli del
      echo "✓ Rate limits cleared"
    }

    hash() {
      htpasswd -bnBC 12 "" "$1" | tr -d ':\n' | sed 's/^[^$]*//'
    }

## Environment Variables

### Backend

| Variable | Default | Purpose |
|---|---|---|
| REDIS_ENABLED | true | Use Redis for shared state |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |
| DEV_TOOLS_ENABLED | false | Expose /api/dev/* |
| SPRING_PROFILES_ACTIVE | default | Spring profile |

### Frontend

| Variable | Default | Purpose |
|---|---|---|
| BACKEND_URL | http://localhost:8080 | BFF target |

## Deployment Notes

Before going live:

1. **Secrets** — move JWT secret and DB password to env/Vault
2. **HTTPS** — terminate TLS at Nginx/ALB, force HSTS
3. **Redis** — requirepass + REDIS_ENABLED=true
4. **Email** — replace LoggingEmailService with SMTP/SendGrid/SES
5. **Backups** — pg_dump nightly, test restore quarterly
6. **Monitoring** — Actuator + Prometheus + structured JSON logs
7. **Frontend** — npm run build && npm run start, NODE_ENV=production

### Production layout

    ┌──────────────────────┐
    │ Nginx / ALB (TLS)    │ :443
    └──────────┬───────────┘
               │
    ┌──────────┴───────────┐
    │                      │
    ▼                      ▼
    Next.js x2         Spring Boot x2
    (Docker)           (Docker)
    │                      │
    └──────────┬───────────┘
               │
    ┌──────────┴───────────┐
    │                      │
    ▼                      ▼
    Postgres (managed)  Redis (managed)

## Roadmap

### Done
- [x] Full auth with BFF pattern
- [x] RBAC with runtime-editable permissions
- [x] Complete loan lifecycle
- [x] Loan status history
- [x] Notifications
- [x] Audit log
- [x] Rate limiting (Redis-backed)
- [x] PDF / CSV / Print exports
- [x] Dark mode infrastructure
- [x] Multi-step password change wizard
- [x] Motion design system

### Next
- [ ] M-Pesa integration
- [ ] Loan amortization schedules
- [ ] Overdue detection
- [ ] Nginx reverse proxy
- [ ] KYC document upload
- [ ] Credit score integration (CRB Tanzania)

### Future
- [ ] Multi-currency support
- [ ] SMS notifications
- [ ] Loan restructuring
- [ ] Statement PDF for borrowers
- [ ] Mobile app (React Native)

---

*Last updated: 2026 — NaedCredit*
