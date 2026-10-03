# PharmaERP

## What This Is

A web-based retail pharmacy management system for a single pharmacy to manage medicine inventory by batch (with expiry tracking), sell medicines in pieces/strips/boxes, issue sequential invoices with thermal receipt printing, and provide the owner with analytics and reports. Two roles — Owner and Pharmacist — with strict field-level access control (cost/profit hidden from pharmacist at the API level).

## Core Value

Accurate batch-wise stock with expiry visibility and fast counter billing — every sale traces back to a specific batch, every price override is recorded, and stock can never go negative through concurrent operations.

## Business Context

- **Customer**: Single retail pharmacy (owner-operated, 1-2 pharmacists)
- **Revenue model**: Internal tool — reduces stock loss and speeds billing
- **Success metric**: Zero negative-stock incidents; invoice creation under 1 second
- **Strategy notes**: MVP first, later phases add barcode scanning, offline sync, wholesale, mobile app

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] JWT authentication with bcrypt, rate limiting, owner/pharmacist roles
- [ ] Item master with type-ahead search (<300ms), sale units (piece/strip/box), MRP per piece
- [ ] Batch-wise stock receiving with expiry dates, duplicate batch merging, cost-missing flag for pharmacist-received batches
- [ ] Three stock buckets per batch: sellable, damaged, expired
- [ ] FEFO-sorted batch suggestion on billing with soft enforcement and non-FEFO flagging
- [ ] Fast billing screen with keyboard/touch optimization, price overrides (never blocked), hold/resume
- [ ] Immutable sequential invoices (INV-000001) with full snapshots and atomic stock deduction via MongoDB transactions
- [ ] Thermal receipt printing (58mm/80mm) via browser @page CSS
- [ ] Invoice-level percentage discount with global charges (VAT, service charge) applied after discount
- [ ] Sales returns from existing invoice with destination bucket choice (sellable/damaged/expired) and proportional refund calculation
- [ ] Supplier return invoices (SRT-000001) for expired/damaged goods — owner only, separate from sales
- [ ] Stock adjustments (owner only) with mandatory reason and audit logging
- [ ] Expiry alerts (configurable 90/60/30 day windows), low-stock alerts, expired batch alerts
- [ ] Owner dashboard with today's sales, invoice count, cash vs non-cash split, top sellers
- [ ] Reports: sales summary, sales by item, profit, price override, non-FEFO, stock valuation, expiry, low stock, returns, stock movement ledger — all with date range filter and CSV export
- [ ] Pharmacy settings: profile, receipt width, charges, expiry alert windows, categories
- [ ] Immutable audit log for sensitive actions (login, price changes, stock adjustments, settings, user management, supplier returns, cost edits)
- [ ] Server-side field stripping: pharmacist API responses never contain cost/profit/valuation fields
- [ ] Decimal128 for all money fields, decimal strings over API, never JS floats — only grand total rounded to 2dp (half up)

### Out of Scope

- Wholesale and customer credit/dues — complexity deferred to later phase
- Full accounting (ledger, P&L, balance sheet), supplier payables — not needed for MVP pharmacy operations
- Purchase orders and supplier master data — free-text supplier name sufficient for MVP
- Barcode scanning and thermal printer hardware integration — browser print only for MVP
- Offline mode / sync — internet required, clear banner on connection loss
- Multi-branch, multi-language, VAT compliance reports — single pharmacy, single language, no regulatory reporting
- Line-level discounts — invoice-level percentage only for MVP
- Invoice edit/delete — corrections via returns only (immutability guarantee)

## Context

**Domain**: Retail pharmacy in Bangladesh (Asia/Dhaka timezone, BDT currency, DD/MM/YYYY date format)

**Architecture**: React (Vite) SPA → Express API → MongoDB Atlas (replica set for transactions)

**Stack decisions**:
- Frontend: React, React Router, TanStack Query, decimal library (e.g. decimal.js), print-specific CSS
- Backend: Node.js + Express, Mongoose, Zod/Joi validation, JWT auth middleware, role guard middleware, response serializer for field stripping
- Database: MongoDB Atlas with replica set (required for multi-document transactions)

**Repo layout**: `/client` (React app), `/server` (Express API with routes/controllers/services/models/middleware)

**Users and concurrency**: 2-3 simultaneous users across Owner and Pharmacist roles on desktop, tablet, and phone browsers

**Key data model decisions**:
- Stock stored in pieces (base unit), sale units define conversion factors
- MRP stored per piece (Decimal128), strip/box prices derived by multiplication
- Invoices are append-only with full snapshots (item name, batch, prices, flags)
- Stock movements are append-only (RECEIVE, SALE, SALE_RETURN, ADJUSTMENT, SUPPLIER_RETURN)
- Counters collection for gap-free sequential numbering (inside transactions)
- Held bills stored server-side per user

**Permission model**:
- Pharmacist cannot see purchase price, cost, or profit — enforced at API layer
- Pharmacist-received batches saved with purchasePricePerPiece = null, flagged "cost missing"
- Profit reports exclude lines with missing cost until owner fills in
- Price overrides by pharmacist are always allowed (never blocked, never warned) but recorded and reported
- Invoices cannot be edited or deleted by either role — corrections via sales returns only

**Money handling rules**:
- Decimal128 in MongoDB, decimal strings over API, never JS floats
- No rounding on unit prices or line totals
- Grand total only: rounded to 2 decimals (round half up)
- Percent charges apply to amount after discount; fixed charges added once per invoice
- Refunds: proportional discount share + proportional percent-charge share; fixed charges not refunded

## Constraints

- **Database**: MongoDB Atlas with replica set — required for multi-document transactions on invoices/stock
- **Concurrency**: Conditional atomic updates ($gte guard on qtySellable) inside transactions to prevent negative stock
- **Performance**: Item search <300ms, invoice creation <1s on normal connection
- **Security**: HTTPS only, bcrypt passwords, JWT with short-lived access + refresh tokens, role checks on every route, rate-limited login, CORS restricted to app origin
- **Internet**: Required — no offline mode; UI shows clear banner and blocks finalizing on connection loss
- **Locale**: Asia/Dhaka timezone, BDT currency, DD/MM/YYYY date format
- **Responsive**: Works on desktop, tablet, phone — billing screen optimized for desktop and tablet
- **Backups**: Atlas free tier (M0) has no automated backups; paid tier or scheduled mongodump required before go-live

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MongoDB over SQL | Document model fits nested invoice/batch structures; Atlas provides replica set for transactions | — Pending |
| Decimal128 for money, never floats | Prevents rounding errors in financial calculations — pharmacy billing requires precision | — Pending |
| Server-side field stripping over UI hiding | Security: pharmacist should never receive cost data, even via API inspection | — Pending |
| Immutable invoices with returns-only corrections | Audit trail integrity — no invoice editing prevents disputes and fraud | — Pending |
| FEFO soft enforcement (suggest but don't block) | Pharmacist needs flexibility at counter — hard blocking slows billing; flagging enables owner oversight | — Pending |
| Price overrides never blocked | Practical pharmacy need — customer negotiation, damaged packaging, etc. — recorded and reported to owner instead | — Pending |
| Invoice-level discount only (no line-level) | Simplifies MVP billing flow; line-level can be added later | — Pending |
| Browser print only (no thermal printer SDK) | Reduces MVP scope; @page CSS with 58/80mm width selection is sufficient for most thermal printers | — Pending |
| Held bills server-side, shared between roles | Any user can resume any held bill — practical for shift handoffs | — Pending |
| Purchase price owner-only with cost-missing flag | Pharmacist can receive stock without seeing cost; owner fills in later; profit reports exclude unfilled lines | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-03 after initialization*
