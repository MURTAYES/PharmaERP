# Phase 1: Core Foundation & Auth (End-to-End) - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the fullstack architecture (Node/Express API + React/Vite SPA + MongoDB Atlas with Decimal128 support), secure JWT authentication with bcrypt hashing and rate limiting, role-based authorization (Owner vs Pharmacist) with server-side response serializer to guarantee zero cost/profit data leaks, User Management CRUD interface, Pharmacy Profile & Settings UI, and an append-only audit log engine.

</domain>

<decisions>
## Implementation Decisions

### UI Theme, Layout & Design System
- **D-01 (Design System & Color Tokens):** Implement the exact clinical palette from the provided design prototype:
  - `primary`: `#00685f` (Clinical Deep Teal)
  - `primary-container`: `#008378`
  - `secondary`: `#006b5f`
  - `secondary-container`: `#6df5e1` (Vibrant Mint)
  - `surface`: `#faf8ff` (Light clinical background)
  - `surface-container-lowest`: `#ffffff` (Card & modal background)
  - `on-surface`: `#131b2e` (High contrast text)
  - `on-surface-variant`: `#3d4947`
  - `error`: `#ba1a1a` & `error-container`: `#ffdad6`
- **D-02 (Typography):** Use Google Fonts `Plus Jakarta Sans` for all body, headings, and labels; use `JetBrains Mono` for invoice numbers, batch tags, financial metrics, and code/status chips.
- **D-03 (Icons):** Use Google Material Symbols Outlined (`grid_view`, `medication`, `receipt_long`, `point_of_sale`, `local_shipping`, `query_stats`, `settings`, `badge`, etc.).
- **D-04 (Navigation & Header):** Collapsible left sidebar navigation combined with a fixed, compact top header displaying search, quick actions ("Quick Invoice", "Add Batch"), notification badges, and active user profile badge.

### Pharmacy Settings & Defaults
- **D-05 (Global Charges):** Start with an empty configurable charges list by default, allowing the Owner to add custom percentage (e.g. VAT 5%, Service 2%) or fixed charges anytime with active toggles.
- **D-06 (Expiry Alert Tiers):** Standard 3-tier warning thresholds: 90 days (Green/Notice), 60 days (Yellow/Warning), and 30 days (Red/Critical) plus an Expired status tier. Configurable via Settings UI.
- **D-07 (Receipt Width):** Default to 80mm thermal receipt format with 58mm compact format toggle option in Pharmacy Settings.
- **D-08 (Locale & Currency):** Default currency BDT (`৳` / `BDT`) with standard `DD/MM/YYYY` date format and `Asia/Dhaka` timezone.

### Authentication, RBAC & Field Stripping
- **D-09 (Auth Flow):** JWT access tokens (short-lived, 15m) + refresh tokens (stored securely in httpOnly cookie / secure store) with bcrypt password hashing.
- **D-10 (Seeding):** Automatic database initializer / seed script to create initial Owner account on first startup if no users exist.
- **D-11 (Role-Based Access Control):** Role check on all endpoints (`Owner` vs `Pharmacist`).
- **D-12 (Server-Side Field Serializer):** A dedicated response serializer middleware that automatically strips `purchasePrice`, `purchasePricePerPiece`, `cost`, `profit`, and `stockValuation` fields whenever `req.user.role === 'pharmacist'`.

### Audit Logging Engine
- **D-13 (Audit Log):** Append-only MongoDB audit log collection recording timestamps, user ID, username, action type (`LOGIN`, `PASSWORD_RESET`, `USER_CREATE`, `USER_DEACTIVATE`, `SETTINGS_UPDATE`), IP address, and payload diffs.

### The Agent's Discretion
- Project structure boilerplate layout (`/client` and `/server`).
- Toast notification library selection (e.g., Sonner / custom toast matching theme).
- Loading skeleton designs and error boundary implementations.

</decisions>

<specifics>
## Specific Ideas

- Visual UI directly reflects the provided clinical dashboard template:
  - Ambient mint glow backdrop gradients (`secondary-fixed/30` blur).
  - Floating card shadows (`shadow-[0_8px_30px_rgba(0,104,95,0.06)]`).
  - Stat cards with top-right rounded icons and bottom metadata row in `JetBrains Mono`.
  - Modern pills for status tags (`Paid` in mint `#71f8e4`, `Pending` in `#ffdad6`).
- Fast keyboard accessibility for counter productivity.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specifications & Architecture
- `.planning/PROJECT.md` — Core value, constraints, user roles, permission model, money handling rules
- `.planning/REQUIREMENTS.md` — AUTH-01..05 and SYS-01..07 requirements
- `.planning/research/SUMMARY.md` — Architecture findings, Decimal128 rules, response serializer pattern
- `.planning/research/STACK.md` — Technology stack definitions (Node.js, Express, React, Vite, Tailwind/CSS tokens, Mongoose)
- `.planning/research/ARCHITECTURE.md` — Security architecture, middleware pipeline, folder structure

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Greenfield codebase; Phase 1 establishes the foundational fullstack structure:
  - `/server`: Express app, Mongoose connection, auth middleware, role guard, serializer middleware, audit service
  - `/client`: Vite React app, Tailwind CSS configuration with custom clinical theme tokens, React Router, TanStack Query

### Established Patterns
- Decimal128 storage with decimal strings over JSON API.
- Modular monolith with Express routes/controllers/services/models.
- Response serialization at the middleware boundary.

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 1 scope.
- Subsequent phases (Inventory, POS Billing, Returns, Analytics) are mapped to Phases 2-6 in ROADMAP.md.

</deferred>

---

*Phase: 01-core-foundation-auth-end-to-end*
*Context gathered: 2026-10-03*
