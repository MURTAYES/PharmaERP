# Requirements: PharmaERP

**Defined:** 2026-10-03
**Core Value:** Accurate batch-wise stock with expiry visibility and fast counter billing — every sale traces back to a specific batch, every price override is recorded, and stock can never go negative through concurrent operations.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Access Control

- [ ] **AUTH-01**: User can authenticate with username and password using JWT with bcrypt hashing
- [ ] **AUTH-02**: Role-based access control enforces Owner (full administrative access) vs Pharmacist (counter operations only)
- [ ] **AUTH-03**: Rate limiting protects authentication and sensitive API endpoints
- [ ] **AUTH-04**: User session persists across browser refresh with secure token refresh and logout
- [ ] **AUTH-05**: Server-side field serializer strips purchase price, cost, profit, and valuation fields from pharmacist API responses

### Inventory & Stock Management

- [ ] **INVT-01**: User can manage item master (trade name, generic name, category, manufacturer, shelf location, low-stock threshold)
- [ ] **INVT-02**: User can configure unit conversion hierarchy per item (base piece, strips, boxes with pieces-per-unit)
- [ ] **INVT-03**: User can set MRP per piece with derived strip and box prices
- [ ] **INVT-04**: User can search items with type-ahead search (<300ms) by trade name, generic name, or item code
- [ ] **INVT-05**: User can receive stock per batch (batch number, expiry date, quantity in pieces/strips/boxes, purchase price, MRP, supplier name)
- [ ] **INVT-06**: System deduplicates received batches by adding incoming quantity to existing batch matching item, batch number, and expiry
- [ ] **INVT-07**: Pharmacist can receive stock without entering purchase price (batch automatically flagged as cost-missing)
- [ ] **INVT-08**: System tracks three separate stock buckets per batch (sellable, damaged, expired)
- [ ] **INVT-09**: Owner can adjust stock between buckets or write off stock with mandatory reason entry
- [ ] **INVT-10**: System provides expiry tracking and dashboard alerts across configurable windows (90, 60, 30 days) and expired status
- [ ] **INVT-11**: System generates low-stock alerts when total sellable pieces drop below item threshold
- [ ] **INVT-12**: System maintains an append-only stock movement ledger recording all inventory transitions

### Billing & Point of Sale

- [ ] **POS-01**: Pharmacist can use a fast, keyboard/touch-optimized billing interface with autofocus and shortcut keys
- [ ] **POS-02**: System automatically suggests the earliest-expiring batch (FEFO order) when an item is selected
- [ ] **POS-03**: Pharmacist can select a non-FEFO batch without being blocked, automatically flagging the invoice line item
- [ ] **POS-04**: Pharmacist can select sale unit (piece, strip, box) with automatic price and piece-quantity calculation
- [ ] **POS-05**: Pharmacist can override unit price on any line item (never blocked, recorded on invoice and logged)
- [ ] **POS-06**: Pharmacist can manage cart line items (add, edit quantity/unit, remove, instant line subtotal)
- [ ] **POS-07**: Pharmacist can hold current bill to server and resume any held bill later from any terminal
- [ ] **POS-08**: Pharmacist can apply an invoice-level percentage discount
- [ ] **POS-09**: System computes global charges (percentage charges applied after discount, fixed charges applied once per invoice)
- [ ] **POS-10**: Pharmacist can process payment via Cash (with change due calculation), Card, Mobile Payment (bKash/Nagad), or Split Payment
- [ ] **POS-11**: System executes atomic checkout transaction (counter increment, invoice creation, stock deduction with $gte guard, ledger entry)
- [ ] **POS-12**: System generates sequential gap-free invoice numbers (INV-000001) via atomic database counters
- [ ] **POS-13**: System creates an immutable invoice snapshot storing item names, batch numbers, expiry dates, units, prices, and override flags
- [ ] **POS-14**: Pharmacist can print thermal receipts (58mm/80mm) formatted via browser print stylesheet (@page CSS)
- [ ] **POS-15**: All monetary calculations use Decimal128 precision with unrounded intermediate math and 2dp round-half-up grand totals

### Returns & Credit Notes

- [ ] **RET-01**: User can initiate sales return against an existing invoice number with item and batch verification
- [ ] **RET-02**: User can select return quantities and assign returned stock to a specific destination bucket (sellable, damaged, expired)
- [ ] **RET-03**: System calculates proportional refund amounts accounting for original invoice discounts and percentage charges
- [ ] **RET-04**: System atomically executes return (stock bucket increment, return record creation, credit note generation, ledger entry)
- [ ] **RET-05**: System issues sequential credit notes (CN-000001)
- [ ] **RET-06**: Owner can generate supplier return invoices (SRT-000001) for expired/damaged stock, deducting from designated buckets

### Analytics & Reporting

- [ ] **RPT-01**: Owner can view real-time dashboard with sales metrics, invoice count, payment breakdown, alert counts, and top-selling items
- [ ] **RPT-02**: Owner can view sales summary report filterable by date range, payment method, or user
- [ ] **RPT-03**: Owner can view sales by item report showing units sold and revenue
- [ ] **RPT-04**: Owner can view profit and loss report (revenue minus cost snapshot, excluding cost-missing lines until filled)
- [ ] **RPT-05**: Owner can view price override report displaying all modified prices with user attribution and variance
- [ ] **RPT-06**: Owner can view non-FEFO sales report highlighting sales where older stock was bypassed
- [ ] **RPT-07**: Owner can view stock valuation report at cost price and retail price
- [ ] **RPT-08**: Owner can view expiry report grouped by warning windows and expired batches
- [ ] **RPT-09**: Owner can view low stock report listing items below reorder thresholds
- [ ] **RPT-10**: Owner can view returns report summarizing returned items, refund amounts, and destination buckets
- [ ] **RPT-11**: Owner can view stock movement ledger report filterable by item, batch, movement type, and date range
- [ ] **RPT-12**: User can export any tabular report to CSV format

### Settings & System Administration

- [ ] **SYS-01**: Owner can configure pharmacy profile (name, address, phone, receipt header/footer, currency symbol)
- [ ] **SYS-02**: Owner can configure receipt printing settings (58mm vs 80mm default width, header display)
- [ ] **SYS-03**: Owner can configure global invoice charges (tax/VAT percentages, fixed fees, active toggles)
- [ ] **SYS-04**: Owner can configure expiry alert threshold windows (default 90, 60, 30 days) and low stock defaults
- [ ] **SYS-05**: Owner can manage medicine categories
- [ ] **SYS-06**: Owner can manage user accounts (create, assign role, reset password, activate/deactivate)
- [ ] **SYS-07**: System maintains an append-only immutable audit log for authentication, price overrides, stock adjustments, settings changes, and supplier returns

## v2 Requirements

Deferred to future releases. Tracked but not in current roadmap.

### Hardware & Barcode Integration
- **BAR-01**: Direct thermal printer ESC/POS hardware integration
- **BAR-02**: Barcode and QR code scanning for fast billing and stock receiving
- **BAR-03**: Barcode label generation and printing for batches

### Offline & Distribution
- **SYNC-01**: Offline POS billing mode with background sync when connection resumes
- **DIST-01**: Multi-branch support with centralized inventory and stock transfers
- **DIST-02**: Wholesale ordering and customer credit/dues ledger management

### Supply Chain & Accounting
- **ACCT-01**: Full double-entry accounting ledger (balance sheet, trial balance, P&L)
- **PURC-01**: Supplier master management, purchase orders, and accounts payable
- **MOB-01**: Dedicated mobile app for owner dashboard and inventory counting

## Out of Scope

Explicitly excluded from v1 to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Wholesale & Customer Credit/Dues | Multi-customer credit accounts add ledger complexity; v1 focuses strictly on retail cash/card/MFS counter sales |
| Full Accounting (General Ledger, Balance Sheet) | Standard pharmacy POS needs operational reporting; full accounting is handled by dedicated accounting software |
| Purchase Orders & Supplier AP | Free-text supplier name on receiving is sufficient for MVP; full purchasing lifecycle deferred to v2 |
| Barcode Hardware SDKs | Browser print with standard CSS @page handles receipts; direct ESC/POS hardware drivers avoided in MVP |
| Offline Mode / Client-Side DB Sync | Web-first architecture requires active connection; network loss displays warning banner and prevents corrupt submits |
| Multi-Branch & Multi-Language | Single-branch retail pharmacy in Bangladesh (Asia/Dhaka timezone, English UI, BDT currency) |
| Line-Level Discounts | Invoice-level percentage discount meets core requirement with simpler counter flow and audit tracking |
| Invoice Editing or Deletion | Strict immutability guarantee — corrections must occur via sales return and credit notes |
| Line-Level Price Rounding | Unit prices and line totals remain exact Decimal128 values; only invoice grand total rounds (2dp half up) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| SYS-01 | Phase 1 | Pending |
| SYS-02 | Phase 1 | Pending |
| SYS-03 | Phase 1 | Pending |
| SYS-04 | Phase 1 | Pending |
| SYS-05 | Phase 1 | Pending |
| SYS-06 | Phase 1 | Pending |
| SYS-07 | Phase 1 | Pending |
| INVT-01 | Phase 2 | Pending |
| INVT-02 | Phase 2 | Pending |
| INVT-03 | Phase 2 | Pending |
| INVT-04 | Phase 2 | Pending |
| INVT-05 | Phase 2 | Pending |
| INVT-06 | Phase 2 | Pending |
| INVT-07 | Phase 2 | Pending |
| INVT-08 | Phase 2 | Pending |
| INVT-09 | Phase 2 | Pending |
| INVT-10 | Phase 2 | Pending |
| INVT-11 | Phase 2 | Pending |
| INVT-12 | Phase 2 | Pending |
| POS-01 | Phase 3 | Pending |
| POS-02 | Phase 3 | Pending |
| POS-03 | Phase 3 | Pending |
| POS-04 | Phase 3 | Pending |
| POS-05 | Phase 3 | Pending |
| POS-06 | Phase 3 | Pending |
| POS-07 | Phase 3 | Pending |
| POS-08 | Phase 3 | Pending |
| POS-09 | Phase 3 | Pending |
| POS-10 | Phase 3 | Pending |
| POS-11 | Phase 3 | Pending |
| POS-12 | Phase 3 | Pending |
| POS-13 | Phase 3 | Pending |
| POS-14 | Phase 3 | Pending |
| POS-15 | Phase 3 | Pending |
| RET-01 | Phase 4 | Pending |
| RET-02 | Phase 4 | Pending |
| RET-03 | Phase 4 | Pending |
| RET-04 | Phase 4 | Pending |
| RET-05 | Phase 4 | Pending |
| RET-06 | Phase 4 | Pending |
| RPT-01 | Phase 5 | Pending |
| RPT-02 | Phase 5 | Pending |
| RPT-03 | Phase 5 | Pending |
| RPT-04 | Phase 5 | Pending |
| RPT-05 | Phase 5 | Pending |
| RPT-06 | Phase 5 | Pending |
| RPT-07 | Phase 5 | Pending |
| RPT-08 | Phase 5 | Pending |
| RPT-09 | Phase 5 | Pending |
| RPT-10 | Phase 5 | Pending |
| RPT-11 | Phase 5 | Pending |
| RPT-12 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 51 total
- Mapped to phases: 51
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-03*
*Last updated: 2026-10-03 after initial definition*
