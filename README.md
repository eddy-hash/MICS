
---

## 🛠 Tech Stack

### Backend
| Component | Version | Purpose |
|-----------|---------|---------|
| Kotlin | 2.x | Language |
| Spring Boot | 4.1.1 | Framework |
| Spring Security | 7.x | Auth + RBAC |
| Spring Data JPA | 4.1.1 | ORM |
| Spring Data Redis | 4.1.1 | Rate limiting, cache |
| PostgreSQL | 15+ | Primary database |
| Flyway | 12.x | Migrations |
| Java | 25 | Runtime |
| Maven | 3.9.16 | Build tool |

### Frontend
| Component | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.3.6 | Framework (App Router) |
| React | 19.x | UI library |
| TypeScript | 5.x | Language |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 12.x | Animations |
| Heroicons | 2.x | Icons |
| react-hot-toast | 2.x | Notifications |
| Recharts | 2.x | Charts |

### Infrastructure
| Component | Purpose |
|-----------|---------|
| Docker + Compose | PostgreSQL container |
| systemd | Redis service |
| Nginx *(optional)* | Reverse proxy |

---

## 🚀 Getting Started

### Prerequisites

- **Java 25** (or 21 LTS)
- **Node.js 20+** / **pnpm** or **npm**
- **Docker** + **Docker Compose**
- **Redis** (`sudo apt install redis-server`)
- **PostgreSQL client** (`psql`)

### One-time Setup

```bash
# Clone
git clone <your-repo-url>
cd MICS

# Backend deps
cd services
./mvnw clean install

# Frontend deps
cd ../web
npm install

# Redis (systemd)
sudo systemctl enable --now redis-server
redis-cli ping                    # → PONG

# PostgreSQL (Docker)
cd ../services
docker compose up -d postgres
docker ps | grep postgres         # verify it's running



app:
  redis:
    enabled: ${REDIS_ENABLED:true}

  jwt:
    secret: ${JWT_SECRET:dev-only-secret-CHANGE-ME-...}
    access-ttl-minutes: 15
    refresh-ttl-days: 7

  security:
    login:
      max-attempts: 5              # failed logins before rate limit
      window-minutes: 15           # sliding window

  cors:
    allowed-origins: "http://localhost:3000,http://127.0.0.1:3000"

  frontend:
    reset-url: "http://localhost:3000/reset-password"

BACKEND_URL=http://localhost:8080

cd services
docker compose up -d postgres

redis-cli ping      # should return PONG
# If not running:
sudo systemctl start redis-server

cd services
./mvnw spring-boot:run


curl -s http://localhost:8080/actuator/health     # if actuator enabled
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nc.tz","password":"WrongPass"}'


MICS/
├── services/                       # Spring Boot backend
│   ├── src/main/kotlin/LOANS/services/
│   │   ├── auth/                   # Login, register, tokens
│   │   │   ├── AuthController.kt
│   │   │   ├── AuthService.kt
│   │   │   └── dto/
│   │   │       ├── LoginRequest.kt
│   │   │       └── RegisterRequest.kt
│   │   ├── loan/                   # Loan lifecycle
│   │   ├── security/               # JWT, rate limiting, RBAC
│   │   │   ├── SecurityConfig.kt
│   │   │   ├── JwtAuthFilter.kt
│   │   │   ├── CustomAuthenticationEntryPoint.kt
│   │   │   ├── RateLimiter.kt          # interface
│   │   │   ├── RedisRateLimiter.kt     # production
│   │   │   └── LoginRateLimiter.kt     # in-memory (dev)
│   │   ├── rbac/                   # Permissions
│   │   │   ├── PermissionService.kt
│   │   │   └── RedisPermissionCache.kt
│   │   ├── common/
│   │   │   └── GlobalExceptionHandler.kt
│   │   ├── admin/                  # Admin endpoints
│   │   ├── notifications/
│   │   └── users/
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/           # Flyway SQL
│   ├── compose.yaml
│   ├── pom.xml
│   └── mvnw
│
└── web/                            # Next.js frontend
    ├── src/
    │   ├── app/
    │   │   ├── (public)/           # Unauthenticated routes
    │   │   │   ├── login/
    │   │   │   ├── register/
    │   │   │   ├── forgot-password/
    │   │   │   └── reset-password/[token]/
    │   │   ├── (app)/              # Authenticated routes
    │   │   │   ├── dashboard/
    │   │   │   ├── loans/
    │   │   │   │   ├── [id]/
    │   │   │   │   └── new/
    │   │   │   ├── officer/
    │   │   │   │   ├── queue/
    │   │   │   │   └── disburse/
    │   │   │   ├── admin/
    │   │   │   │   ├── users/
    │   │   │   │   ├── rbac/
    │   │   │   │   └── audit/
    │   │   │   └── profile/
    │   │   ├── api/                # BFF route handlers (proxy to Spring)
    │   │   │   ├── auth/login/route.ts
    │   │   │   ├── auth/logout/route.ts
    │   │   │   ├── auth/refresh/route.ts
    │   │   │   └── …
    │   │   └── layout.tsx
    │   ├── components/
    │   │   ├── layout/             # Navbar, Sidebar, ProfileMenu, NotificationBell
    │   │   ├── ui/                 # Button, Input, Dropdown, Modal, …
    │   │   ├── auth/               # AuthSlideshow
    │   │   ├── charts/
    │   │   └── domain/             # LoanActionsPanel, MoneyInput, …
    │   ├── context/                # ThemeContext, AuthContext
    │   ├── lib/
    │   │   ├── toast.tsx           # Toast system with dedup
    │   │   ├── cookies.ts          # Cookie helpers
    │   │   ├── permissions.ts      # PERMISSIONS constant
    │   │   └── utils.ts
    │   └── middleware.ts           # Route guard (RBAC)
    ├── next.config.ts              # Rewrites /api/* → :8080
    ├── tailwind.config.*
    ├── postcss.config.*
    └── package.json


1. User submits email + password
        │
        ▼
2. POST /api/auth/login (Next.js BFF)
        │
        ▼
3. BFF forwards to Spring: POST :8080/api/auth/login
        │
        ▼
4. Spring:
   • Rate limiter check (Redis)
   • Validate credentials (BCrypt)
   • Issue access + refresh JWT
        │
        ▼
5. BFF sets httpOnly cookies:
   • access_token  (15 min)
   • refresh_token (7 days)
   • SameSite=Lax, Secure (prod)
        │
        ▼
6. Browser stores cookies; JS can never read tokens
