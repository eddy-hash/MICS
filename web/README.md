# LoanFlow — Frontend

Next.js 16 UI for the Loan Management System. Consumes the Spring Boot backend
through **BFF routes** under `src/app/api/**` — the browser never sees a JWT.

## Quick start

```bash
npm install
npm run dev
```

Opens on **http://localhost:3000**. Backend must be running on `:8080`.

## Environment

`.env.local`:

```
BACKEND_URL=http://localhost:8080
```

## Architecture

```
Browser ──► Next.js (this app) ──► Spring Boot
          · HttpOnly cookies         · JWT verification
          · Route protection         · RBAC
          · BFF proxies              · Business logic
```

## Security

- HttpOnly cookies — XSS cannot read tokens
- SameSite=Strict — CSRF mitigated
- Refresh-token rotation with reuse detection
- Login rate limiting (backend)
- No user enumeration on register / forgot-password

## Roles

LOANEE · OFFICER · ADMINISTRATOR — enforced server-side via `@PreAuthorize`.
Admins can edit role→permission mappings at `/admin/rbac`.

## Currency

Tanzanian Shilling (TZS). Loan range: 100,000 – 500,000,000 TZS.

## License

Proprietary — internal use.
