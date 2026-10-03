# Phase 2: Inventory & Stock Management (End-to-End) - Validation Strategy

**Date:** 2026-10-03
**Status:** Approved

## Dimension Verification Matrix

| Dimension | Target | Verification Method |
|-----------|--------|---------------------|
| 1. Unit Conversion Hierarchy | Piece base + piecesPerStrip + stripsPerBox correctly computes box total pieces and derived packaging MRP | Automated test + UI rendering check |
| 2. Fast Type-Ahead Search | Query latency <300ms across trade name, generic name, item code | Vitest integration performance test |
| 3. Batch Stock Receiving | Quantity input in pieces/strips/boxes converts accurately to base pieces in DB | Controller unit & integration test |
| 4. Batch Deduplication | Duplicate batch entry (same item + batchNumber + expiry) adds to qtySellable without creating duplicate record | Database test |
| 5. Cost-Missing Flag | Receiving without cost flags `isCostMissing: true`; cost hidden from pharmacist API | Serializer & RBAC test |
| 6. Tri-Bucket Stock Integrity | qtySellable, qtyDamaged, qtyExpired balances stay consistent; bucket transfers and write-offs require reasons | Mongoose transaction test |
| 7. Expiry & Low-Stock Alerts | 90/60/30 day expiry tiers and low-stock items correctly identified in alerts API and UI chips | Alert service unit test |
| 8. Stock Movement Ledger | Append-only ledger captures every receiving, adjustment, and write-off | Immutability hook test |

## Automated Test Suites Planned

1. `server/src/tests/item.test.ts`: Item CRUD, unit conversion validation, derived prices, and type-ahead search.
2. `server/src/tests/batchReceiving.test.ts`: Batch receiving with unit conversion, duplicate merging, and cost-missing flag.
3. `server/src/tests/stockAdjustment.test.ts`: Tri-bucket transfers, write-offs, reason validation, and stock movement ledger records.
4. `server/src/tests/alerts.test.ts`: Expiry tiers (90/60/30/Expired) and low stock threshold alerts.
