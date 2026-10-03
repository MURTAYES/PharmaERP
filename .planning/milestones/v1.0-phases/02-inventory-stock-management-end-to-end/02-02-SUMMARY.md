# Plan Summary: 02-02 Batch Stock Receiving Engine, Duplicate Merging & Cost-Missing Workflow

**Execution Date:** 2026-10-03
**Status:** Completed & Verified

## Accomplishments
1. **Batch Mongoose Model (`server/src/models/Batch.ts`):**
   - Built tri-bucket tracking (`qtySellable`, `qtyDamaged`, `qtyExpired`).
   - Stored `purchasePricePerPiece` as Decimal128 with `isCostMissing` flag.
   - Enforced unique compound index on `{ itemId, batchNumber, expiryDate }`.
2. **Date Parsing Utility (`server/src/utils/dateUtils.ts`):**
   - Supports `MM/YYYY` shorthand (e.g. `11/2027` auto-resolves to `30/11/2027` month-end) and `DD/MM/YYYY`.
3. **Batch Stock Ingestion Engine (`server/src/controllers/batchController.ts` & `server/src/routes/batchRoutes.ts`):**
   - `POST /api/batches/receive`: Converts Box/Strip/Piece quantity inputs into exact base pieces.
   - Merges duplicate incoming batches matching item, batch number, and expiry date.
   - Flags `isCostMissing: true` when received without cost / by pharmacist; strips cost from pharmacist response.
   - Appends initial `RECEIVE` movement record into `StockMovement` ledger.
   - `GET /api/batches/by-item/:itemId`: FEFO-ordered batch list.
   - `PUT /api/batches/:id/cost`: Owner-only batch cost update.
4. **Verification:**
   - Vitest suite `server/src/tests/batchReceiving.test.ts` passing.
