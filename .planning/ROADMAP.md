# Roadmap: PharmaERP

## Overview

PharmaERP is delivered in six structured phases following a robust architecture. We start with the core authentication, RBAC, settings, and audit engine (Phase 1), followed by the complete batch-wise inventory foundation with Decimal128 precision and expiry alerts (Phase 2). Next, we build the high-speed, transaction-safe POS counter billing engine with soft-FEFO enforcement, price overrides, and thermal receipt printing (Phase 3). We then deliver sales returns, bucketed stock restoration, and supplier returns (Phase 4), followed by the owner analytics dashboard, comprehensive reporting suite, and CSV export (Phase 5). Finally, we conduct full-system integration verification, security hardening, and deployment readiness (Phase 6).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Foundation & Access Control** - Project scaffolding, JWT authentication, RBAC with field-stripping serializer, pharmacy settings, and audit log.
- [ ] **Phase 2: Inventory & Stock Management** - Item master, unit conversions, MRP, type-ahead search, batch stock receiving with duplicate merging, stock buckets, adjustments, and expiry/low-stock alerts.
- [ ] **Phase 3: Billing & Point of Sale** - Counter billing screen, FEFO batch suggestion with non-FEFO flagging, price overrides, cart management, hold/resume, discounts, charges, atomic checkout with $gte guard, sequential invoices, and thermal receipt printing.
- [ ] **Phase 4: Returns & Credit Notes** - Sales return flow against invoices with destination bucket routing, proportional refund computation, sequential credit notes, and supplier return invoices.
- [ ] **Phase 5: Analytics & Reporting** - Real-time owner dashboard, sales reports, profit/loss report, price override audit, non-FEFO report, stock valuation, expiry reports, movement ledger, and CSV export.
- [ ] **Phase 6: Hardening, Integration & Deployment** - End-to-end workflow verification, field-leak security audits, concurrency stress testing, backup scripts, and production deployment configuration.

## Phase Details

### Phase 1: Foundation & Access Control
**Goal**: Establish project architecture, database connectivity, secure authentication, role-based access control with server-side field stripping, system settings, and immutable audit logging.
**Depends on**: Nothing (first phase)
**Requirements**: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, SYS-01, SYS-02, SYS-03, SYS-04, SYS-05, SYS-06, SYS-07]
**Success Criteria** (what must be TRUE):
  1. User can authenticate as Owner or Pharmacist, and sessions persist securely across browser refreshes.
  2. Pharmacist API responses never contain cost, purchase price, profit, or valuation fields.
  3. Owner can configure pharmacy profile, receipt settings, global charges, and alert windows.
  4. Sensitive system and auth events are recorded in an append-only audit log.
**Plans**: TBD

Plans:
- [ ] 01-01: Backend scaffolding, MongoDB Atlas connection with replica set support, JWT auth, and role guards
- [ ] 01-02: User management, settings models/routes, response serializer middleware, and audit log engine
- [ ] 01-03: Frontend scaffolding (React/Vite), auth pages, layout shell with responsive navigation, and settings UI

### Phase 2: Inventory & Stock Management
**Goal**: Build the batch-wise inventory management engine with multi-unit conversion, fast search, stock receiving, bucket management, and expiry alerting.
**Depends on**: Phase 1
**Requirements**: [INVT-01, INVT-02, INVT-03, INVT-04, INVT-05, INVT-06, INVT-07, INVT-08, INVT-09, INVT-10, INVT-11, INVT-12]
**Success Criteria** (what must be TRUE):
  1. User can create medicines with unit hierarchies (piece/strip/box) and MRP per piece.
  2. Pharmacist or owner can search medicines via type-ahead in under 300ms.
  3. Stock can be received per batch with duplicate batch merging; pharmacist entry flags cost as missing.
  4. Stock is tracked in three distinct buckets (sellable, damaged, expired) with owner adjustment workflows.
  5. System generates proactive alerts for low stock and batches within 90/60/30 day expiry windows.
**Plans**: TBD

Plans:
- [ ] 02-01: Item master and unit conversion data models, Decimal128 schema handling, and type-ahead search API
- [ ] 02-02: Batch receiving engine with duplicate merging, cost-missing logic, stock buckets, and adjustments
- [ ] 02-03: Stock movement ledger, expiry calculation service, and low-stock/expiry alerting engine
- [ ] 02-04: Inventory UI: item catalog, batch receiving modal, stock adjustment interface, and alert lists

### Phase 3: Billing & Point of Sale
**Goal**: Implement the high-speed counter POS billing screen with FEFO suggestion, non-blocking price overrides, hold/resume, atomic multi-document checkout transactions, sequential invoicing, and thermal receipt printing.
**Depends on**: Phase 2
**Requirements**: [POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, POS-08, POS-09, POS-10, POS-11, POS-12, POS-13, POS-14, POS-15]
**Success Criteria** (what must be TRUE):
  1. Pharmacist can build a cart rapidly using keyboard shortcuts and unit selectors.
  2. System suggests earliest-expiring batch (FEFO) by default; non-FEFO selections are permitted but flagged on the line item.
  3. Pharmacist can override unit prices without being blocked, with overrides recorded for auditing.
  4. Bills can be held to the server and resumed from any active terminal.
  5. Checkout atomically creates an immutable invoice snapshot, increments gap-free counter, and deducts stock using `$gte` guards.
  6. Thermal receipts (58mm/80mm) print cleanly via browser print stylesheet.
**Plans**: TBD

Plans:
- [ ] 03-01: Invoicing data model, atomic counter engine, and server-side pricing/discount/tax calculation service
- [ ] 03-02: Atomic checkout transaction service with `$gte` stock deduction guard and movement ledger recording
- [ ] 03-03: Hold/resume bills API and management service
- [ ] 03-04: High-speed POS billing UI with keyboard shortcuts, FEFO picker, unit converters, and price override inputs
- [ ] 03-05: Payment dialog (cash with change calculation, card, MFS) and thermal receipt print template (@page CSS)

### Phase 4: Returns & Credit Notes
**Goal**: Build the sales return pipeline with destination bucket routing, proportional refund calculations, sequential credit notes, and supplier return invoices.
**Depends on**: Phase 3
**Requirements**: [RET-01, RET-02, RET-03, RET-04, RET-05, RET-06]
**Success Criteria** (what must be TRUE):
  1. User can look up an existing invoice and process partial or full item returns.
  2. Returned items can be routed to sellable, damaged, or expired stock buckets.
  3. Refunds accurately compute proportional discounts and percentage charges while retaining fixed fees.
  4. Sequential credit notes (CN-000001) are generated and stock buckets updated atomically.
  5. Owner can issue supplier return invoices (SRT-000001) to deduct damaged/expired inventory.
**Plans**: TBD

Plans:
- [ ] 04-01: Sales return data models, credit note numbering, proportional refund math, and atomic return transaction service
- [ ] 04-02: Supplier return invoice model and bucket deduction engine (owner only)
- [ ] 04-03: Returns UI: invoice return lookup dialog, bucket selector, credit note view, and supplier return creator

### Phase 5: Analytics & Reporting
**Goal**: Build the real-time owner executive dashboard, comprehensive audit and operational reports, and universal CSV export.
**Depends on**: Phase 4
**Requirements**: [RPT-01, RPT-02, RPT-03, RPT-04, RPT-05, RPT-06, RPT-07, RPT-08, RPT-09, RPT-10, RPT-11, RPT-12]
**Success Criteria** (what must be TRUE):
  1. Owner dashboard displays live sales KPIs, invoice counts, payment method splits, alert tiles, and top items.
  2. Sales summary and sales by item reports accurately filter across date ranges.
  3. Profit & loss report computes revenue minus cost snapshots, excluding uncosted lines.
  4. Owner can audit price overrides and non-FEFO sales with staff attribution.
  5. Stock valuation, expiry, low stock, returns, and movement ledger reports render accurately and export to CSV.
**Plans**: TBD

Plans:
- [ ] 05-01: Timezone-aware aggregation pipelines for dashboard KPIs, sales summaries, and profit/loss calculations
- [ ] 05-02: Specialized audit reports API (price overrides, non-FEFO transactions, stock valuation, movement ledger)
- [ ] 05-03: Owner dashboard UI with interactive metrics, charts, and quick-action cards
- [ ] 05-04: Report center UI with date range pickers, filter controls, data tables, and client-side CSV export

### Phase 6: Hardening, Integration & Deployment
**Goal**: Perform end-to-end cross-phase integration verification, API security audits, concurrency race tests, backup routines, and production packaging.
**Depends on**: Phase 5
**Requirements**: [All v1 Requirements verified end-to-end]
**Success Criteria** (what must be TRUE):
  1. Comprehensive automated tests verify that zero cost/profit data leaks to pharmacist API tokens.
  2. Concurrent billing tests prove stock never goes negative under simultaneous checkout load.
  3. Database backup/restore scripts (`mongodump`/`mongorestore`) are documented and operational.
  4. Production environment builds cleanly with all environment variables validated.
**Plans**: TBD

Plans:
- [ ] 06-01: Role-leak security integration test suite and concurrency stress testing
- [ ] 06-02: Automated backup scripts, environment configuration validation, and production build verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Access Control | 0/3 | Not started | - |
| 2. Inventory & Stock Management | 0/4 | Not started | - |
| 3. Billing & Point of Sale | 0/5 | Not started | - |
| 4. Returns & Credit Notes | 0/3 | Not started | - |
| 5. Analytics & Reporting | 0/4 | Not started | - |
| 6. Hardening, Integration & Deployment | 0/2 | Not started | - |
