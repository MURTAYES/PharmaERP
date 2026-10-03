<!-- GSD:project-start source:PROJECT.md -->

## Project

**PharmaERP**

A web-based retail pharmacy management system for a single pharmacy to manage medicine inventory by batch (with expiry tracking), sell medicines in pieces/strips/boxes, issue sequential invoices with thermal receipt printing, and provide the owner with analytics and reports. Two roles — Owner and Pharmacist — with strict field-level access control (cost/profit hidden from pharmacist at the API level).

**Core Value:** Accurate batch-wise stock with expiry visibility and fast counter billing — every sale traces back to a specific batch, every price override is recorded, and stock can never go negative through concurrent operations.

### Constraints

- **Database**: MongoDB Atlas with replica set — required for multi-document transactions on invoices/stock
- **Concurrency**: Conditional atomic updates ($gte guard on qtySellable) inside transactions to prevent negative stock
- **Performance**: Item search <300ms, invoice creation <1s on normal connection
- **Security**: HTTPS only, bcrypt passwords, JWT with short-lived access + refresh tokens, role checks on every route, rate-limited login, CORS restricted to app origin
- **Internet**: Required — no offline mode; UI shows clear banner and blocks finalizing on connection loss
- **Locale**: Asia/Dhaka timezone, BDT currency, DD/MM/YYYY date format
- **Responsive**: Works on desktop, tablet, phone — billing screen optimized for desktop and tablet
- **Backups**: Atlas free tier (M0) has no automated backups; paid tier or scheduled mongodump required before go-live

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Frontend

| Technology | Version | Confidence | Rationale |
|-----------|---------|------------|-----------|
| React | 19.x | HIGH | Dominant SPA framework; excellent ecosystem for complex UIs (billing screen, dashboards) |
| Vite | 6.x | HIGH | Fastest DX for React; HMR, tree-shaking, ESBuild |
| TypeScript | 5.x | HIGH | Type safety critical for money math, complex data models, API contracts |
| React Router | 7.x | HIGH | Standard routing for React SPAs; nested routes for layout patterns |
| TanStack Query | 5.x | HIGH | Server state management; caching, refetching, optimistic updates for billing |
| decimal.js | 10.x | HIGH | Arbitrary-precision decimal math — critical for pharmacy money handling |
| Zustand | 5.x | MEDIUM | Lightweight client state (cart, held bills, UI state); simpler than Redux |
| React Hook Form | 7.x | HIGH | Performant forms for stock receiving, item master, settings |
| date-fns | 4.x | HIGH | Date formatting/comparison for expiry dates, timezone handling |
| Axios | 1.x | HIGH | HTTP client with interceptors for JWT refresh, error handling |

### Backend

| Technology | Version | Confidence | Rationale |
|-----------|---------|------------|-----------|
| Node.js | 22 LTS | HIGH | Runtime for Express API; strong MongoDB ecosystem |
| Express | 4.x | HIGH | Mature, stable HTTP framework; middleware pattern fits auth/RBAC layers |
| TypeScript | 5.x | HIGH | Type safety for money handling, transaction logic, role-based field stripping |
| Mongoose | 8.x | HIGH | MongoDB ODM; schema validation, Decimal128 support, transaction helpers |
| Zod | 3.x | HIGH | Runtime schema validation; composable, TypeScript-first; better DX than Joi |
| jsonwebtoken | 9.x | HIGH | JWT creation/verification for access + refresh token pattern |
| bcryptjs | 2.x | HIGH | Password hashing; pure JS (no native build issues on Windows) |
| helmet | 8.x | HIGH | Security headers middleware |
| cors | 2.x | HIGH | CORS configuration middleware |
| express-rate-limit | 7.x | HIGH | Rate limiting for login endpoint |
| morgan | 1.x | MEDIUM | HTTP request logging |

### Database

| Technology | Version | Confidence | Rationale |
|-----------|---------|------------|-----------|
| MongoDB Atlas | 7.x | HIGH | Document model fits invoice/batch structures; replica set for transactions; Decimal128 native |
| Mongoose Decimal128 | native | HIGH | Correct money storage; avoid floating-point errors |

### What NOT to Use

| Technology | Reason |
|-----------|--------|
| PostgreSQL | Not wrong, but MongoDB's document model better fits nested invoice lines, batch structures, and the flexible schema the spec describes |
| Redux/MobX | Overkill for 2-3 user pharmacy app; Zustand or even React context suffices |
| Socket.io | Real-time not needed for 2-3 users; polling via TanStack Query invalidation is simpler |
| Next.js | SSR/SSG unnecessary; pure SPA with Vite is simpler and the spec calls for it |
| Tailwind CSS | Not specified; vanilla CSS or CSS modules keep the build simpler |
| Prisma | Designed for SQL; Mongoose is the standard MongoDB ORM |
| Floating-point (Number) | NEVER for money — use Decimal128 in DB, decimal.js in code, string serialization over API |

## Sources

- MERN stack pharmacy POS implementations on GitHub
- MongoDB official documentation on Decimal128 and transactions
- TanStack Query documentation for server state management
- Express.js security best practices (OWASP)

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agents/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
