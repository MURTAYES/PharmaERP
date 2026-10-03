# Phase 3: Point of Sale & Billing (End-to-End) - Validation Strategy

**Date:** 2026-10-03  
**Phase:** 3 — Point of Sale & Billing  
**Status:** Defined  

---

## 1. Test Architecture & Automated Verification

### A. Pricing & Calculation Tests (`server/src/tests/pricingEngine.test.ts`)
- Multi-line subtotal calculation with decimal accuracy.
- Percentage discount calculation and net calculation.
- Compound percentage charges (e.g. 5% VAT applied on net after discount).
- Fixed charges (e.g. ৳ 10.00 service fee) applied once per invoice.
- Grand total unrounded intermediate arithmetic with 2dp round-half-up finale.
- Edge cases: 0% discount, 100% discount, fractional cents/poisha rounding.

### B. POS Checkout & Concurrency Tests (`server/src/tests/posCheckout.test.ts`)
- Successful checkout creating sequential invoice `INV-000001`.
- Batch `qtySellable` reduction by exact integer pieces count.
- `StockMovement` creation with `type: 'SALE_DEDUCT'`.
- Conditional `$gte` guard failure: attempting to purchase more stock than available aborts the entire transaction and leaves database unchanged.
- Non-FEFO flag recorded when earlier expiring batch is bypassed.
- Price override metadata and variance calculation saved on line items.

### C. Held Bills Tests (`server/src/tests/heldBills.test.ts`)
- Create held bill from cart payload.
- Retrieve active held bills list.
- Retrieve single held bill details.
- Delete held bill upon checkout or cancellation.

### D. Role-Based Field Stripping Verification
- Pharmacist user invoice query verifies `purchaseCostPerPiece`, `profit`, and cost fields are strictly `undefined`.
- Owner user query preserves `purchaseCostPerPiece` snapshot.

---

## 2. Manual & End-to-End UAT Checklist

1. **POS Navigation:** Press `F2` to focus search, select medicine via arrow keys + Enter.
2. **Batch & Unit Selection:** Switch between piece, strip, box; verify unit price and converted total pieces.
3. **FEFO Suggestion:** Verify earliest batch is picked first; select older batch and verify non-FEFO warning indicator.
4. **Price Override:** Edit unit price; verify variance tag and note.
5. **Held Bill:** Press `F8` to hold bill; verify it appears in Held Bills drawer; resume it back to cart.
6. **Discounts & Charges:** Add 10% discount; verify VAT and fixed charges recalculate dynamically.
7. **Payment & Checkout:** Pay via Cash with change calculation; click "Complete Sale"; verify invoice created and stock deducted.
8. **Thermal Printing:** Verify 58mm/80mm receipt dialog formats cleanly without clipping.
