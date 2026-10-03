# Project Research Summary

**Project:** PharmaERP — Retail Pharmacy Management System
**Researched:** 2026-10-03
**Confidence:** HIGH

## Executive Summary

The pharmacy management system sits in a well-understood domain with proven technology patterns. The MERN stack (MongoDB, Express, React, Node.js) with TypeScript is the standard choice for this class of application, validated by numerous open-source and commercial implementations. The system's critical complexity lies not in the technology but in three areas: (1) precise money handling with Decimal128 and no floating-point at any layer, (2) concurrent stock deduction using atomic conditional updates within MongoDB transactions, and (3) strict field-level access control where cost/profit data must never reach pharmacist API responses.

Research confirms that the spec's decisions — soft FEFO enforcement, immutable invoices with returns-only corrections, server-side total recomputation, and snapshot-on-write — align with industry best practices for pharmacy POS systems. The identified tech stack (React/Vite + Express/Mongoose + MongoDB Atlas) provides all necessary primitives: Decimal128, multi-document ACID transactions, text indexes for fast search, and a replica set for transactional integrity.

The primary risks are floating-point money bugs (mitigated by strict Decimal128/decimal.js discipline from day one), race conditions on stock (mitigated by atomic $gte conditional updates), and cost data leaks (mitigated by response serializer middleware with integration tests).

## Key Findings

### Stack
- **MERN + TypeScript is the right choice** — validated by pharmacy POS implementations in production
- **Decimal128 + decimal.js is non-negotiable** — the only safe way to handle pharmacy money math
- **Vite over Next.js** — no SSR needed; pure SPA is simpler and matches the spec
- **Zustand over Redux** — lightweight state management sufficient for 2-3 user app
- **Zod over Joi** — TypeScript-first validation with better DX and type inference

### Features
- All specified features are **table stakes or smart differentiators** — no feature bloat
- FEFO soft enforcement with flagging is a **genuine differentiator** — most systems either hard-enforce or ignore
- Price override reporting and non-FEFO reporting are **uncommon and valuable** for owner oversight
- Supplier return as separate document type is **architecturally clean** — avoids polluting sales data

### Architecture
- **Modular monolith** is correct for 2-3 users — microservices would be over-engineering
- **Atomic conditional update** (`$gte` guard) is the proven pattern for concurrent stock safety
- **Snapshot-on-write** for invoices prevents retroactive data corruption
- **Response serializer middleware** is the secure pattern for role-based field stripping

### Pitfalls
- **Floating-point money** is the #1 risk — must be caught at the model layer, not the UI
- **Race conditions on stock** are the #2 risk — atomic updates + transactions required
- **Invoice counter gaps** are the #3 risk — counter inside transaction is the only correct pattern
- **Timezone bugs in expiry** are subtle — always compare in Asia/Dhaka timezone

## Implications for Roadmap

### Suggested Phase Structure

1. **Foundation** — Auth, users, settings, audit log, counters, project scaffolding
   - Low complexity. Standard patterns. No custom business logic.
   - Sets up the middleware pipeline (auth, roleGuard, serialize, validate).

2. **Inventory Core** — Item master, batches, stock receiving, stock list, alerts, adjustments, movement ledger
   - Medium complexity. Decimal128 handling starts here.
   - Batch deduplication logic and expiry alerting.

3. **Sales & Billing** — Billing screen, FEFO suggestion, price override, discount, charges, payment, invoice, receipt print, hold/resume
   - **Highest complexity phase.** Transaction logic, concurrent stock guards, snapshot-on-write, charge computation.
   - This is where most pitfalls converge. Needs thorough testing.

4. **Returns** — Sales returns with destination buckets, credit note, supplier return invoice
   - Medium complexity. Builds on invoice/batch foundation.
   - Proportional refund calculation is the tricky part.

5. **Owner Analytics** — Dashboard, reports, CSV export, override/non-FEFO reports
   - Read-only aggregation queries. Lower risk.
   - Timezone handling in aggregation pipelines needs care.

6. **Hardening & Launch** — Permissions review, backup setup, load/edge testing, production deploy
   - Integration testing focus. Security audit. Performance validation.

### Research Flags

- **Phase 3 (Sales) needs the most careful implementation** — highest pitfall density
- **Phase 1 (Foundation) has well-documented patterns** — standard auth + RBAC
- **Phase 2 (Inventory) introduces Decimal128** — set the pattern early, enforce everywhere
- **Phase 5 (Reports) requires timezone-aware aggregation** — test with Asia/Dhaka timezone

## Confidence Assessment

| Area | Confidence | Reason |
|------|-----------|--------|
| Stack | HIGH | MERN is proven for pharmacy POS; MongoDB Decimal128 is well-documented |
| Features | HIGH | Spec is comprehensive; all features map to known pharmacy POS patterns |
| Architecture | HIGH | Modular monolith + atomic updates are well-documented patterns |
| Pitfalls | HIGH | Common pharmacy/POS pitfalls are extensively documented in case studies |

## Sources

- MongoDB official documentation on Decimal128, transactions, text indexes
- Express.js security and architecture best practices
- Pharmacy management system feature surveys and comparisons
- JavaScript floating-point arithmetic gotchas (IEEE 754)
- OWASP API security guidelines
- Open-source MERN pharmacy POS implementations on GitHub
