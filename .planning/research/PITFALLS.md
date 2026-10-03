# Domain Pitfalls

**Domain:** Retail Pharmacy Management
**Researched:** 2026-10-03

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Floating-Point Money Math
**What goes wrong:** Using JavaScript `Number` type for prices, totals, and calculations causes accumulating rounding errors. ₹0.10 + ₹0.20 !== ₹0.30 in IEEE 754.
**Why it happens:** JavaScript's only number type is a 64-bit float. Developers use it by default without thinking about precision.
**Consequences:** Invoice totals drift from expected values. Over thousands of transactions, discrepancies become significant and un-auditable.
**Prevention:** Decimal128 in MongoDB, `decimal.js` library in all server-side calculations, string serialization over API. Never convert Decimal128 → Number at any point.
**Detection:** Unit tests that verify `0.1 + 0.2 === 0.3` semantics with your chosen library. Integration tests on grand total computation.

### Pitfall 2: Race Condition on Stock Deduction
**What goes wrong:** Two concurrent sales both read `qtySellable = 5`, both sell 3, ending with `qtySellable = -1`.
**Why it happens:** Read-check-write pattern without atomicity. Even with transactions, if you read the batch, check in application code, then write, another transaction can interleave.
**Consequences:** Negative stock, overselling, inventory data corruption.
**Prevention:** Atomic conditional update: `updateOne({ _id, qtySellable: { $gte: qty } }, { $inc: { qtySellable: -qty } })` inside a transaction. If `modifiedCount === 0`, abort.
**Detection:** Concurrent sale tests (fire 10 requests simultaneously for the same batch with limited stock).

### Pitfall 3: Invoice Number Gaps
**What goes wrong:** Counter incremented outside the sale transaction. If the sale rolls back, the counter is already incremented, leaving a gap.
**Why it happens:** Counter increment done in a separate operation or pre-allocated.
**Consequences:** Missing invoice numbers trigger audit/tax investigation concerns.
**Prevention:** `findOneAndUpdate` on the counters collection inside the same MongoDB session/transaction as the invoice insert.
**Detection:** Integration test: create 100 invoices, verify sequential with no gaps. Create a sale that fails mid-transaction, verify counter didn't increment.

### Pitfall 4: Client-Trusted Calculations
**What goes wrong:** API accepts `grandTotal` from the client and stores it directly.
**Why it happens:** UI already computes totals for display; seems wasteful to recompute on server.
**Consequences:** Malicious or buggy client can submit incorrect totals. Charge changes on server not reflected.
**Prevention:** Server recomputes everything: line totals, subtotal, discount, charges, grand total. Client values are purely for display.
**Detection:** Send a request with deliberately wrong `grandTotal` and verify server ignores it.

## Moderate Pitfalls

### Pitfall 5: Forgetting to Snapshot on Invoice Lines
**What goes wrong:** Invoice line stores only `itemId` and `batchId`. When item name or MRP changes, the invoice retroactively changes.
**Prevention:** Snapshot all display fields at invoice creation time: `itemNameSnapshot`, `batchNo`, `expiryDate`, `mrpPerPiece`, `soldPricePerPiece`, `costPerPiece`.

### Pitfall 6: Charge Changes Affecting Past Invoices
**What goes wrong:** Charges stored as reference to settings. When settings change, old invoices show new charges.
**Prevention:** Snapshot active charges onto each invoice at creation time. Store `[{name, type, value, amount}]` directly on the invoice document.

### Pitfall 7: Partial Return Exceeding Sold Quantity
**What goes wrong:** Multiple returns against the same invoice line exceed the original sold quantity.
**Prevention:** Track `returnedPieces` on each invoice line. Validate: `returnQty <= invoiceLine.qtyPieces - invoiceLine.returnedPieces`.

### Pitfall 8: Cost Data Leaking to Pharmacist
**What goes wrong:** A new API endpoint or response field accidentally includes `purchasePricePerPiece` or profit calculations.
**Prevention:** Response serializer middleware that strips fields by name recursively. Integration tests that assert pharmacist responses never contain cost fields.
**Detection:** Run every API endpoint as pharmacist and grep responses for cost-related field names.

### Pitfall 9: Timezone Bugs in Expiry Checking
**What goes wrong:** Batch expiry comparison uses UTC while the pharmacy operates in Asia/Dhaka (UTC+6). A batch that expires "today" might still be sellable or already expired depending on timezone handling.
**Prevention:** Always compare expiry dates in Asia/Dhaka timezone. Store expiry as date-only (no time component). Compare as `>= startOfDay(today, 'Asia/Dhaka')`.

## Minor Pitfalls

### Pitfall 10: Slow Type-Ahead Search
**What goes wrong:** Item search takes >300ms, frustrating the pharmacist at the counter.
**Prevention:** MongoDB text index on `name`, `genericName`, `company`. Consider compound index. Keep item count reasonable (single pharmacy unlikely to exceed 10K items).

### Pitfall 11: Hard-Deleting Referenced Data
**What goes wrong:** Deleting an item that has batches or invoices referencing it breaks historical data.
**Prevention:** Soft-delete only (`isActive: false`). Never hard-delete transactional data.

### Pitfall 12: Missing Audit Log on Sensitive Actions
**What goes wrong:** Price changes or stock adjustments happen without audit trail. Owner can't investigate discrepancies.
**Prevention:** Audit log middleware or explicit logging in every sensitive service method. Before/after snapshots.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation (Auth) | JWT token stored insecurely | Use httpOnly cookies or secure storage; short-lived access tokens |
| Inventory (Items/Batches) | Floating-point in seed data | Use string representation for all Decimal128 fields in seed scripts |
| Billing (Sales) | Race condition on stock | Atomic conditional update with $gte guard |
| Billing (Sales) | Invoice counter gaps | Counter inside transaction |
| Billing (Sales) | Client-trusted totals | Server recomputes everything |
| Returns | Return exceeding sold | Track returnedPieces, validate in transaction |
| Reports | Timezone in aggregation | Set timezone in MongoDB aggregation $dateToString |
| All phases | Cost leak to pharmacist | Response serializer integration tests |

## Sources

- MongoDB transaction documentation and race condition prevention
- JavaScript floating-point arithmetic issues (IEEE 754)
- Pharmacy POS post-mortem discussions
- OWASP secure API design patterns
