# Plan Summary: 02-03 Stock Movement Ledger, Bucket Adjustments & Expiry/Low-Stock Alerting Engine

**Execution Date:** 2026-10-03
**Status:** Completed & Verified

## Accomplishments
1. **StockMovement Model (`server/src/models/StockMovement.ts`):**
   - Append-only schema with pre-hooks blocking update and delete operations.
   - Captures movement type (`RECEIVE`, `ADJUST_TRANSFER`, `WRITE_OFF`, `SALE_DEDUCT`, `RETURN_RESTOCK`), piece delta, source/target buckets, structured reason category, detail note, and user ID.
2. **Stock Adjustment & Write-off APIs (`server/src/controllers/stockAdjustmentController.ts`):**
   - `POST /api/stock-adjustments/transfer`: Owner-only bucket transfers with source quantity validation and movement logging.
   - `POST /api/stock-adjustments/write-off`: Owner-only stock write-offs.
   - `GET /api/stock-adjustments/movements`: Filterable movement ledger history.
3. **Alerts Aggregation Engine (`server/src/controllers/alertController.ts`):**
   - `GET /api/alerts/summary`: Real-time KPI counts for Expired, Critical (<30d), Warning (<60d), Notice (<90d), and Low Stock.
   - `GET /api/alerts/expiring`: Filter batches by expiry alert tier.
   - `GET /api/alerts/low-stock`: Aggregates sellable stock across batches and returns items below threshold.
4. **Verification:**
   - Vitest suites `server/src/tests/stockAdjustment.test.ts` and `server/src/tests/alerts.test.ts` passing.
