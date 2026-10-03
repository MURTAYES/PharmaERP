# Walking Skeleton — PharmaERP

**Phase:** 01
**Generated:** 2026-10-03

## Capability Proven End-to-End

An authenticated Owner can log in, view the clinical dashboard shell, manage users, update pharmacy settings, and verify recorded audit log entries through the full-stack React + Express + MongoDB architecture.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend Framework | Node.js + Express + TypeScript | Lightweight, high performance, robust middleware ecosystem |
| Frontend Framework | React 19 + Vite 6 + TypeScript | Instant HMR, declarative UI, strong typing across API contracts |
| Database & ODM | MongoDB Atlas + Mongoose 8 (Decimal128) | Multi-document ACID transactions, native Decimal128 for currency, flexible document model |
| Styling & Theme | Tailwind CSS 3.4 with custom clinical tokens | Exact clinical teal/mint theme, Plus Jakarta Sans & JetBrains Mono typography |
| Auth & Security | JWT (Access + httpOnly Refresh) + bcryptjs + Helmet + Rate Limiter | Stateless authentication with short-lived tokens and brute-force protection |
| Field Stripping | Server-side Response Serializer Middleware | Strips purchase price, cost, and profit fields from Pharmacist responses at API boundary |

## Stack Touched in Phase 1

- [ ] Project scaffold (root scripts, `/server` TypeScript Express app, `/client` Vite React app)
- [ ] Routing — Express `/api/auth`, `/api/users`, `/api/settings`, `/api/audit` + React Router `/login`, `/dashboard`, `/users`, `/settings`, `/audit`
- [ ] Database — MongoDB connection, seed initial Owner user, User & Settings reads/writes, append-only AuditLog
- [ ] UI — Responsive clinical top navbar, login form, user management modal/table, pharmacy settings panel, live audit viewer
- [ ] Deployment — Local full-stack execution (`npm run dev` running server & client concurrently)

## Out of Scope (Deferred to Later Slices)

- Inventory medicine catalog & batch receiving — Phase 2
- POS billing & thermal receipt printing — Phase 3
- Sales returns & supplier return invoices — Phase 4
- Analytics reports & CSV export — Phase 5
- Hardware printer drivers & barcode scanners — v2

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Inventory & Stock Management (End-to-End item master, batches, search, and expiry alerts)
- Phase 3: Point of Sale & Billing (End-to-End counter billing, FEFO suggestions, overrides, and receipts)
- Phase 4: Returns & Credit Notes (End-to-End return routing, refund math, and credit notes)
- Phase 5: Analytics & Reporting Suite (End-to-End owner dashboard KPI aggregations and reports)
- Phase 6: Hardening, Integration & Deployment (End-to-End verification and security audit)
