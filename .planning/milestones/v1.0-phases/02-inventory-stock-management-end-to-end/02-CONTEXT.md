# Phase 2: Inventory & Stock Management (End-to-End) - Context

**Gathered:** 2026-10-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 delivers a complete, end-to-end inventory management system for retail pharmacy operations:
- Item Master catalog (trade name, generic name, category, manufacturer, shelf location, low-stock threshold).
- Unit conversion hierarchy (Piece base, Strip with pieces/strip, Box with strips/box).
- MRP per piece with derived strip and box prices.
- Type-ahead search (<300ms) by trade name, generic name, or item code.
- Batch stock receiving UI with duplicate merging, cost-missing flag for pharmacist receiving, supplier name capture, and expiry date handling (DD/MM/YYYY and MM/YYYY).
- Stock buckets per batch (qtySellable, qtyDamaged, qtyExpired) with Owner-only transfers and write-offs requiring structured audit reasons.
- 90/60/30-day expiry warning tiers and low-stock threshold alerts with 1-click filter KPI chips.
- Append-only stock movement ledger recording all inventory transitions.

</domain>

<decisions>
## Implementation Decisions

### Unit Hierarchy & Pricing Structure
- **D-01:** Hierarchical Unit Conversion: Base piece with configurable `piecesPerStrip` and `stripsPerBox`. Total pieces per box = `piecesPerStrip * stripsPerBox`. — **Reversibility:** costly — Impacts stock ledger quantity math and POS cart breakdown.
- **D-02:** Strict Base MRP with Derived Packaging Prices: MRP is configured per base piece (Unit Price), from which Strip Price (`piece MRP * piecesPerStrip`) and Box Price (`piece MRP * piecesPerBox`) are derived and displayed clearly as: `Unit Price: ৳ 2.50 (11 x 12: ৳ 330.00) | Strip Price: ৳ 30.00 | Box Price: ৳ 330.00`. — **Reversibility:** costly — Affects pricing calculation engine and POS invoice snapshotting.

### Batch Stock Receiving & Cost-Missing Workflow
- **D-03:** Batch Deduplication & Merging: Incoming stock matching existing `itemId + batchNumber + expiryDate` is merged by incrementing `qtySellable` and updating total received quantity, while logging an explicit `RECEIVE` movement in the stock ledger. — **Reversibility:** costly — Defines batch uniqueness constraints in database.
- **D-04:** Pharmacist Cost-Missing Flag: Pharmacists can receive stock without entering purchase price. Batches received without cost are flagged `isCostMissing: true`, which the Owner can update/resolve during subsequent receiving or batch edit. Cost remains completely stripped from pharmacist responses. — **Reversibility:** reversible — Controlled by serializer and schema flags.

### Stock Bucket Adjustments & Reason Taxonomy
- **D-05:** Tri-Bucket Architecture: Each batch strictly maintains `qtySellable`, `qtyDamaged`, and `qtyExpired`.
- **D-06:** Structured Adjustment Reasons + Mandatory Detail Note: Bucket transfers (Sellable → Damaged, Sellable → Expired, Damaged → Sellable) and write-offs require selecting from curated categories (`Damaged in Transit`, `Shelf Spill/Breakage`, `Physical Count Audit Variance`, `Customer Return Quarantine`, `Expired Stock Quarantine`, `Supplier Return Prep`) plus entering a mandatory detail note for accountability. — **Reversibility:** reversible.

### Expiry & Low-Stock Alerts UI
- **D-07:** Top Alert KPI Chips & Quick Filtering: Inventory screen features 1-click top filter KPI chips (`Expired`, `<30d Critical`, `<60d Warning`, `<90d Notice`, `Low Stock`) to immediately filter the medicine and batch table.
- **D-08:** Flexible Expiry Input: Supports exact date `DD/MM/YYYY` and shorthand `MM/YYYY` (which automatically converts to the last calendar day of the given month, adhering to pharmaceutical industry packaging conventions).

### the agent's Discretion
- Search indexing: MongoDB text indexes + prefix regex / autocomplete indexes on `tradeName`, `genericName`, and `itemCode` for ultra-fast (<300ms) query performance.
- Stock Movement Ledger schema: Immutable event records capturing `batchId`, `itemId`, `type` (`RECEIVE`, `ADJUST_BUCKET`, `WRITE_OFF`, `SALE_DEDUCT`, `RETURN_RESTOCK`), `qtyChangePieces`, `bucketFrom`, `bucketTo`, `reason`, `userId`, and `timestamp`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & System Architecture
- `PROJECT.md` — Core pharmacy rules (BDT currency, Decimal128, Asia/Dhaka timezone, role boundaries).
- `.planning/REQUIREMENTS.md` — Requirements INVT-01 through INVT-12.
- `.planning/phases/01-core-foundation-auth-end-to-end/01-01-SUMMARY.md` — Express setup, serializer, Decimal128 conventions.
- `server/src/middleware/serializer.ts` — Cost/profit stripping middleware for pharmacist requests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/src/models/AuditLog.ts` & `server/src/services/auditService.ts`: Reusable audit logging engine for recording stock adjustment and batch creation events.
- `client/src/components/common/*` (`Button`, `Card`, `Badge`, `Input`, `Modal`): Standard clinical UI primitives with Deep Teal and Mint styling.
- `client/src/services/api.ts`: Configured Axios client with automatic 401 token refresh interceptors.
- `client/src/components/layout/AppLayout.tsx` & `TopNav.tsx`: Navigation bar with role-based routing and active indicator badges.

### Established Patterns
- Decimal128 Schema Pattern: Storing currency and prices as `mongoose.Types.Decimal128` and serializing to strings in JSON responses.
- RBAC Guard: `roleGuard('owner')` for owner-only actions like manual stock adjustments, write-offs, and cost viewing/editing.
- Response Serializer: Response interceptor automatically removes `purchasePrice`, `cost`, `valuation`, and `profit` fields when `req.user.role === 'pharmacist'`.

### Integration Points
- API Routes: `/api/items`, `/api/batches`, `/api/stock-adjustments`, `/api/stock-ledger`.
- TopNav Navigation: Adding active link to `/inventory` in `TopNav.tsx`.
- Dashboard Telemetry: Linking low-stock and expiring batch count metrics to the live dashboard.

</code_context>

<specifics>
## Specific Ideas

- **Pricing Display Format**: "Unit Price: ৳ 2.50 (11 x 12: ৳ 330.00) | Strip Price: ৳ 30.00"
- **Expiry Input Convenience**: Typing `11/2027` automatically resolves to `30/11/2027` (end of month), saving pharmacist typing time during rapid receiving.

</specifics>

<deferred>
## Deferred Ideas

- **BAR-02 / BAR-03**: Barcode scanning and batch barcode label printing deferred to Phase v2.
- **PURC-01**: Supplier master management, automated Purchase Orders (PO), and Accounts Payable ledger deferred to Phase v2.

</deferred>

---

*Phase: 2-Inventory & Stock Management (End-to-End)*
*Context gathered: 2026-10-03*
