# PharmaERP

## What This Is

A web-based retail pharmacy management system for a single pharmacy to manage medicine inventory by batch (with expiry tracking), sell medicines in pieces/strips/boxes, issue sequential invoices with thermal receipt printing, and provide the owner and pharmacist with role-tailored real-time operational analytics and reports. Two roles — Owner and Pharmacist — with strict field-level access control (cost/profit hidden from pharmacist at the API level).

## Core Value

Accurate batch-wise stock with expiry visibility and fast counter billing — every sale traces back to a specific batch, every price override is recorded, and stock can never go negative through concurrent operations.

## Business Context

- **Customer**: Single retail pharmacy (owner-operated, 1-2 pharmacists)
- **Revenue model**: Internal operational software — prevents stock loss, ensures FEFO dispensing, speeds counter billing
- **Success metric**: Zero negative-stock incidents; invoice creation < 1s; live dispensing metrics with zero dummy data
- **Strategy notes**: v1.0 MVP shipped; v1.1 delivers live Pharmacist dashboard metrics & operational analytics

## Current Milestone: v1.1 — Pharmacist Live Operational Metrics & Shift Analytics

### Goals
1. Deliver a dedicated backend aggregation pipeline `/api/reports/pharmacist-kpis` computing real-time shift dispensing metrics (invoices billed today, units dispensed by unit type, customer returns processed).
2. Wire up live held-bills drawer with instant one-click resume into the POS cart.
3. Integrate live urgent FEFO batch expiry watchlist and low-stock reorder queues with direct action links.
4. Replace all mock/dummy transactions and stats on the Pharmacist Dashboard with live database aggregation.

## Requirements

### Validated (v1.0 Shipped)
- ✓ JWT authentication with bcrypt, rate limiting, owner/pharmacist roles — v1.0
- ✓ Item master with type-ahead search (<300ms), sale units (piece/strip/box), MRP per piece — v1.0
- ✓ Batch-wise stock receiving with expiry dates, duplicate batch merging, cost-missing flag for pharmacist — v1.0
- ✓ Three stock buckets per batch: sellable, damaged, expired — v1.0
- ✓ FEFO-sorted batch suggestion on billing with soft enforcement and non-FEFO flagging — v1.0
- ✓ Fast billing screen with keyboard/touch optimization, price overrides, hold/resume bills — v1.0
- ✓ Immutable sequential invoices (INV-000001) with full snapshots and atomic stock deduction via MongoDB transactions — v1.0
- ✓ Thermal receipt printing (58mm/80mm) via browser @page CSS — v1.0
- ✓ Invoice-level percentage discount with global charges applied after discount — v1.0
- ✓ Sales returns from existing invoice with destination bucket choice and proportional refund calculation — v1.0
- ✓ Supplier return invoices (SRT-000001) for expired/damaged goods — owner only — v1.0
- ✓ Stock adjustments (owner only) with mandatory reason and audit logging — v1.0
- ✓ Expiry alerts (configurable 90/60/30 day windows), low-stock alerts, expired batch alerts — v1.0
- ✓ Owner dashboard with today's sales, invoice count, cash vs non-cash split, top sellers — v1.0
- ✓ Reporting suite: sales summary, sales by item, profit/loss, price override, non-FEFO, stock valuation, movement ledger — with CSV export — v1.0
- ✓ Pharmacy settings & append-only immutable audit log — v1.0
- ✓ Server-side field stripping: pharmacist API responses never contain cost/profit/valuation fields — v1.0
- ✓ Decimal128 for all money fields, decimal strings over API — v1.0

### Active (v1.1)
- [ ] **PHARM-01**: Backend aggregation endpoint `/api/reports/pharmacist-kpis` calculating live today's dispensed invoice count, total units dispensed (pieces/strips/boxes), and customer returns handled.
- [ ] **PHARM-02**: Live breakdown of dispensed medicines today by dosage form (Tablets, Syrups, Capsules, Injections) from actual invoice line items.
- [ ] **PHARM-03**: Live urgent FEFO batch expiry watchlist fetching critical batches (< 30 days & expired) with shelf location and remaining sellable pieces.
- [ ] **PHARM-04**: Live counter low-stock refill queue displaying medicines with sellable stock below configured reorder thresholds.
- [ ] **PHARM-05**: Real-time counter held-bills drawer showing suspended bills with instant resume into POS billing cart.
- [ ] **PHARM-06**: Live recent counter dispensing activity table streaming the pharmacist's recent invoices with instant thermal receipt print action.

### Out of Scope
- Wholesale customer credit/dues ledger
- Full double-entry general ledger
- Barcode hardware SDK integration (browser print/scan used)
- Offline SQLite sync

---
*Last updated: 2026-10-03 after v1.0 milestone completion*
