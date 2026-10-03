# Phase 2: Inventory & Stock Management (End-to-End) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-03
**Phase:** 2-Inventory & Stock Management (End-to-End)
**Areas discussed:** Unit Hierarchy & Pricing Structure, Batch Stock Receiving & Cost-Missing Workflow, Stock Bucket Adjustments & Reason Taxonomy, Expiry & Low-Stock Alerts UI

---

## Unit Hierarchy & Pricing Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Two-tier conversion with strict piece MRP | Base piece with piecesPerStrip and stripsPerBox; derived Strip and Box prices | ✓ |
| Two-tier conversion with custom package overrides | Piece MRP + optional manual override on box/strip MRP | |
| Flat independent unit conversion | Pieces per strip and pieces per box defined independently | |

**User's choice:** "Unit Price: ৳ 2.50 (11 x 12: ৳ 330.00) | Strip Price: ৳ 30.00"
**Notes:** Strict piece MRP with derived packaging rates. 11 strips * 12 pieces = 132 pieces (৳ 330.00).

---

## Batch Stock Receiving & Cost-Missing Workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Merge quantity into existing batch | Merge incoming pieces into matching item+batch+expiry batch record, update/retain cost, record RECEIVE ledger event | ✓ |
| Distinct receiving records | Keep separate receiving lines even if batch number and expiry match | |
| Cost-matching merge only | Merge only if purchase price matches exactly | |

**User's choice:** Merge quantity into existing batch (add pieces), update/retain purchase price (Owner can resolve cost-missing during receiving or editing), and record an explicit 'RECEIVE' movement ledger entry.
**Notes:** Pharmacists can receive stock without entering purchase price (`isCostMissing: true`), owner can update cost later.

---

## Stock Bucket Adjustments & Reason Taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Curated reason dropdown + mandatory detail note | Damaged in Transit, Shelf Spill/Breakage, Physical Count Audit Variance, Customer Return Quarantine, Expired Stock Quarantine, Supplier Return Prep + mandatory detail note | ✓ |
| Open free-text note only | Free-text reason without categories | |
| Predefined dropdown only | Dropdown category only, no custom text | |

**User's choice:** Curated reason dropdown + mandatory detail note for accountability.
**Notes:** Applies to all bucket transfers and stock write-offs.

---

## Expiry & Low-Stock Alerts UI

| Option | Description | Selected |
|--------|-------------|----------|
| Top alert KPI chips as 1-click table filters + MM/YYYY & DD/MM/YYYY expiry input | 1-click filter buttons (Expired, <30d, <60d, <90d, Low Stock) + auto month-end date resolution for MM/YYYY | ✓ |
| Dedicated separate Alerts tab | Separate tab apart from inventory catalog | |
| Row badges only | Badges on rows without summary filter bar | |

**User's choice:** Top alert KPI chips (Expired, <30d, <60d, <90d, Low Stock) as 1-click table filters + support MM/YYYY expiry input (auto-defaulting to month end) and DD/MM/YYYY exact date.
**Notes:** Greatly speeds up rapid expiry identification and batch receiving on the counter.

---

## the agent's Discretion
- Search indexing with text/regex indexes for <300ms type-ahead search.
- Schema modeling for append-only stock movement ledger (`StockMovement`).

## Deferred Ideas
- Barcode scanning & batch label printing (v2).
- Purchase Orders & Supplier Accounts Payable (v2).
