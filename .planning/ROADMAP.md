# Roadmap: PharmaERP

## Overview

PharmaERP is delivered in vertical end-to-end MVP slices. Each phase delivers a fully working, user-facing slice of functionality (Database + API + UI + UX) so the pharmacy application is functional and testable from the very first phase. We begin with an authenticated shell and settings management (Phase 1), progress to end-to-end batch-wise inventory and alerts (Phase 2), build the complete high-speed counter POS billing and receipt printing experience (Phase 3), deliver sales and supplier returns (Phase 4), provide the owner analytics and reporting suite (Phase 5), and finalize with security hardening and deployment readiness (Phase 6).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Core Foundation & Auth (End-to-End)** - Working app shell, MongoDB Atlas connection, JWT authentication, RBAC with field-stripping serializer, user management UI, pharmacy settings UI, and audit logging.
- [ ] **Phase 2: Inventory & Stock Management (End-to-End)** - Medicine catalog, unit conversion hierarchies, MRP, type-ahead search, batch stock receiving UI with duplicate merging, stock buckets, manual adjustments, and live expiry/low-stock alerts.
- [ ] **Phase 3: Point of Sale & Billing (End-to-End)** - Counter billing interface, FEFO batch suggestion with non-FEFO flagging, price overrides, cart management, hold/resume bills, discounts, charges, atomic checkout with $gte guard, sequential invoices, and thermal receipt printing.
- [ ] **Phase 4: Returns & Credit Notes (End-to-End)** - Invoice lookup for sales returns, stock bucket destination routing, proportional refund calculations, sequential credit notes, and supplier return invoices.
- [ ] **Phase 5: Analytics & Reporting Suite (End-to-End)** - Real-time owner dashboard, sales reports, profit/loss analysis, price override audit, non-FEFO report, stock valuation, movement ledger, and CSV export.
- [ ] **Phase 6: Hardening, Integration & Deployment** - End-to-end workflow verification, field-leak security audits, concurrency race testing, backup scripts, and production deployment configuration.

## Phase Details

### Phase 1: Core Foundation & Auth (End-to-End)
**Goal**: Deliver a fully working, secure web application shell with user authentication, role-based access control (Owner vs Pharmacist), server-side field stripping, pharmacy profile settings UI, user management UI, and audit logging.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, SYS-01, SYS-02, SYS-03, SYS-04, SYS-05, SYS-06, SYS-07]
**Success Criteria** (what must be TRUE):
  1. Users can log in with username/password, and sessions persist across page refreshes with secure token handling.
  2. Owner can access full admin capabilities, create users, and configure pharmacy profile/receipt/charge settings via the UI.
  3. Pharmacist user interface and API responses completely omit purchase price, cost, profit, and valuation data.
  4. System captures authentication, user changes, and settings modifications in an append-only audit log.
**Plans**: TBD

Plans:
- [ ] 01-01: Fullstack project setup, MongoDB Atlas connection, JWT auth system, and RBAC with field-stripping serializer middleware
- [ ] 01-02: Pharmacy settings, category management, user management APIs, and append-only audit log engine
- [ ] 01-03: Responsive web application shell, login view, user management interface, settings panel, and audit log viewer

### Phase 2: Inventory & Stock Management (End-to-End)
**Goal**: Deliver a complete end-to-end inventory management system where users can create medicines with multi-unit hierarchies, search via type-ahead (<300ms), receive stock by batch with duplicate merging, manage stock buckets, and view real-time expiry/low-stock alerts.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: [INVT-01, INVT-02, INVT-03, INVT-04, INVT-05, INVT-06, INVT-07, INVT-08, INVT-09, INVT-10, INVT-11, INVT-12]
**Success Criteria** (what must be TRUE):
  1. User can manage medicines with unit conversions (piece/strip/box) and MRP per piece through the inventory UI.
  2. Fast type-ahead search returns matching items in <300ms across trade name, generic name, or item code.
  3. User can receive stock per batch; duplicate batches merge cleanly; pharmacist entries auto-flag cost as missing.
  4. Stock is visible across sellable, damaged, and expired buckets, and Owner can execute manual adjustments with mandatory audit reasons.
  5. UI displays visual alert badges and notifications for low-stock items and batches in 90/60/30 day expiry windows.
**Plans**: TBD

Plans:
- [ ] 02-01: Item master and unit conversion data models, Decimal128 schema handling, and type-ahead search API
- [ ] 02-02: Batch stock receiving engine with duplicate merging, cost-missing logic, stock buckets, and adjustment workflow
- [ ] 02-03: Stock movement ledger, expiry calculation service, and low-stock/expiry alerting engine
- [ ] 02-04: End-to-end Inventory UI: item catalog, batch receiving modal, stock adjustment interface, and alert panels

### Phase 3: Point of Sale & Billing (End-to-End)
**Goal**: Deliver a high-speed counter POS billing screen with keyboard/touch optimization, FEFO batch suggestion with non-FEFO flagging, price overrides, cart management, hold/resume, discounts, charges, atomic multi-document checkout transactions, sequential invoices, and thermal receipt printing.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: [POS-01, POS-02, POS-03, POS-04, POS-05, POS-06, POS-07, POS-08, POS-09, POS-10, POS-11, POS-12, POS-13, POS-14, POS-15]
**Success Criteria** (what must be TRUE):
  1. Pharmacist can build a cart rapidly using keyboard shortcuts, unit toggles (piece/strip/box), and autofocus.
  2. System suggests earliest-expiring batch (FEFO) by default; non-FEFO batch selections are permitted but flagged on the line item.
  3. Pharmacist can override unit prices without being blocked, with overrides recorded on the invoice for auditing.
  4. Pharmacist can hold current bill to server and resume any held bill later from any terminal.
  5. Checkout atomically creates an immutable invoice snapshot, increments gap-free counter, and deducts stock using `$gte` guards.
  6. Thermal receipts (58mm/80mm) print cleanly via browser print stylesheet.
**Plans**: TBD

Plans:
- [ ] 03-01: Invoicing data model, atomic counter engine, and server-side pricing/discount/charge calculation service
- [ ] 03-02: Atomic checkout transaction service with `$gte` stock deduction guard and movement ledger recording
- [ ] 03-03: Server-side hold/resume bills API and state management
- [ ] 03-04: High-speed POS billing UI with keyboard shortcuts, FEFO picker, unit converters, and price override inputs
- [ ] 03-05: Payment modal (cash with change calculation, card, MFS, split) and thermal receipt print template (@page CSS)

### Phase 4: Returns & Credit Notes (End-to-End)
**Goal**: Deliver a complete sales return and supplier return workflow allowing item returns against invoices, destination stock bucket routing, proportional refund calculation, sequential credit notes, and supplier return invoices.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: [RET-01, RET-02, RET-03, RET-04, RET-05, RET-06]
**Success Criteria** (what must be TRUE):
  1. User can look up past invoices and process partial or full item returns through a dedicated returns UI.
  2. Returned items are correctly routed to sellable, damaged, or expired stock buckets.
  3. Refunds accurately compute proportional discounts and percentage charges while retaining fixed fees.
  4. System generates sequential credit notes (CN-000001) and updates stock buckets atomically.
  5. Owner can issue supplier return invoices (SRT-000001) to deduct damaged/expired inventory.
**Plans**: TBD

Plans:
- [ ] 04-01: Sales return data models, credit note numbering, proportional refund math, and atomic return transaction service
- [ ] 04-02: Supplier return invoice model and bucket deduction engine (owner only)
- [ ] 04-03: Returns UI: invoice return lookup dialog, bucket selector, credit note view, and supplier return creator

### Phase 5: Analytics & Reporting Suite (End-to-End)
**Goal**: Deliver an executive analytics dashboard for the owner and a comprehensive reporting suite with date filtering and universal CSV export.
**Mode:** mvp
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
**Goal**: Execute comprehensive end-to-end testing, role-leak penetration checks, concurrency race tests, backup/restore routines, and production packaging.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: [All v1 Requirements verified end-to-end]
**Success Criteria** (what must be TRUE):
  1. Automated tests verify zero cost/profit data leaks into pharmacist API responses under all circumstances.
  2. Concurrent billing tests prove stock never goes negative under simultaneous checkout load.
  3. Database backup/restore scripts (`mongodump`/`mongorestore`) are documented and operational.
  4. Production build runs cleanly with all environment variables validated.
**Plans**: TBD

Plans:
- [ ] 06-01: Role-leak security integration test suite and concurrency stress testing
- [ ] 06-02: Automated backup scripts, environment configuration validation, and production build verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Foundation & Auth (End-to-End) | 0/3 | Not started | - |
| 2. Inventory & Stock Management (End-to-End) | 0/4 | Not started | - |
| 3. Point of Sale & Billing (End-to-End) | 0/5 | Not started | - |
| 4. Returns & Credit Notes (End-to-End) | 0/3 | Not started | - |
| 5. Analytics & Reporting Suite (End-to-End) | 0/4 | Not started | - |
| 6. Hardening, Integration & Deployment | 0/2 | Not started | - |
