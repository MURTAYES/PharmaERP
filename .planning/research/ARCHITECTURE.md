# Architecture Patterns

**Domain:** Retail Pharmacy Management
**Researched:** 2026-10-03

## Recommended Architecture

**Modular Monolith** — Feature-organized Express API with clear service boundaries.

For a 2-3 user pharmacy system, microservices add unnecessary operational complexity. A well-structured monolith with clear module boundaries is the right choice.

```
┌─────────────────────────────────────────────────┐
│                  React SPA (Vite)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Billing  │ │Inventory │ │ Owner Dashboard  │ │
│  │ Screen   │ │ Views    │ │ & Reports        │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │ HTTPS / JSON
┌─────────────────────┴───────────────────────────┐
│               Express API Server                 │
│  ┌────────────────────────────────────────────┐  │
│  │         Middleware Pipeline                 │  │
│  │  auth → roleGuard → validate → serialize   │  │
│  └────────────────────────────────────────────┘  │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐  │
│  │ Auth   │ │ Items  │ │  Sales   │ │Reports │  │
│  │Service │ │Service │ │ Service  │ │Service │  │
│  └────────┘ └────────┘ └──────────┘ └────────┘  │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐  │
│  │ Stock  │ │Returns │ │ Settings │ │ Audit  │  │
│  │Service │ │Service │ │ Service  │ │Service │  │
│  └────────┘ └────────┘ └──────────┘ └────────┘  │
└─────────────────────┬───────────────────────────┘
                      │ Mongoose + Transactions
┌─────────────────────┴───────────────────────────┐
│            MongoDB Atlas (Replica Set)            │
│  users │ items │ batches │ invoices │ movements   │
│  salesReturns │ supplierReturns │ heldBills       │
│  settings │ counters │ auditLogs                  │
└──────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Auth Service | JWT issue/refresh, password hashing, login rate limiting | User model |
| Items Service | CRUD items, category management, type-ahead search | Item model, Audit |
| Stock Service | Batch creation, stock receiving, adjustments, FEFO queries | Batch model, Movement model, Audit |
| Sales Service | Invoice creation (transactional), held bills, batch suggestion | Invoice model, Batch model, Counter model, Movement model, Settings |
| Returns Service | Sales returns, supplier returns (transactional) | Invoice model, Batch model, Movement model, Counter model |
| Reports Service | Aggregation queries, CSV generation | All read-only models |
| Settings Service | Pharmacy profile, charges, categories, alert config | Settings model, Audit |
| Audit Service | Append-only logging | AuditLog model |
| Middleware: roleGuard | Route-level role enforcement | Auth context |
| Middleware: serialize | Strip cost/profit fields for pharmacist role | Response transformation |

## Data Flow

### Sale Creation (Critical Path)

```
1. Client → POST /api/v1/sales (lines, payment, customer)
2. Auth middleware: verify JWT, attach user
3. Role guard: both roles allowed
4. Validation: Zod schema for request body
5. Sales Service (inside MongoDB transaction):
   a. Load settings (charges)
   b. For each line:
      - Load item (validate active, get saleUnits/MRP)
      - Load batch (validate expiry, check FEFO)
      - Atomic decrement: batches.updateOne({_id, qtySellable: {$gte: qty}}, {$inc: {qtySellable: -qty}})
      - If modifiedCount == 0 → abort "INSUFFICIENT_STOCK"
      - Set flags (priceOverridden, nonFefo)
      - Insert stock movement (SALE)
   c. Compute totals (subtotal, discount, charges, grandTotal)
   d. Increment counter (inside transaction)
   e. Insert invoice
6. Commit transaction
7. Serialize response (strip cost fields for pharmacist)
8. Return invoice with 201
```

### Field Stripping (Security-Critical)

```
Response Serializer Middleware:
  if (req.user.role === 'pharmacist') {
    recursivelyRemove(responseBody, [
      'purchasePricePerPiece', 'costPerPiece',
      'profit', 'valuation', 'stockValuation'
    ]);
  }
```

This runs at the API layer, not the UI — pharmacist never receives cost data, even via API inspection.

## Patterns to Follow

### Pattern 1: Atomic Conditional Update (Stock Guard)
**What:** Use `$gte` guard in update filter to prevent negative stock
**When:** Every stock deduction (sale, supplier return)
**Example:**
```typescript
const result = await Batch.updateOne(
  { _id: batchId, qtySellable: { $gte: qtyPieces } },
  { $inc: { qtySellable: -qtyPieces } },
  { session }
);
if (result.modifiedCount === 0) {
  throw new AppError('INSUFFICIENT_STOCK', 409);
}
```

### Pattern 2: Snapshot on Write
**What:** Copy current values into the invoice at creation time
**When:** Creating invoices, returns, supplier returns
**Why:** Ensures historical accuracy — price/name changes don't alter old records

### Pattern 3: Counter Inside Transaction
**What:** Increment sequential counter within the same transaction as document creation
**When:** Invoice, sales return, supplier return numbering
**Why:** Gap-free sequential numbers even on rollback

### Pattern 4: Decimal String Serialization
**What:** Serialize Decimal128 as strings over API, parse back to Decimal128 on input
**When:** All money fields crossing the API boundary
**Why:** JavaScript Number loses precision; string is lossless

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Trusted Totals
**What:** Accepting client-computed subtotal/grandTotal
**Why bad:** Client math can be tampered with or have rounding differences
**Instead:** Server recomputes everything from line quantities and prices

### Anti-Pattern 2: UI-Only Field Hiding
**What:** Hiding cost fields in the UI but sending them in API responses
**Why bad:** Pharmacist can inspect network traffic to see costs
**Instead:** Server-side response serializer strips fields before sending

### Anti-Pattern 3: Floating-Point Money
**What:** Using JavaScript Number for money calculations
**Why bad:** 0.1 + 0.2 !== 0.3; errors accumulate across thousands of transactions
**Instead:** Decimal128 in DB, decimal.js in code, string over API

### Anti-Pattern 4: Read-Check-Write for Stock
**What:** Read stock → check if sufficient → write deduction (separate operations)
**Why bad:** Race condition between concurrent sales
**Instead:** Atomic conditional update with $gte in the filter

## Scalability Considerations

| Concern | At 2-3 users | At 10 users | At 100 users |
|---------|-------------|-------------|--------------|
| Concurrent sales | Atomic updates handle well | Same pattern works | Consider read replicas for reports |
| Search performance | Text index sufficient | Same | Consider search service (Atlas Search) |
| Report generation | Inline aggregation | Same | Background jobs for heavy reports |
| Data volume | Months of data fits easily | Years fit well | Archive old movements, partition by date |

## Sources

- MongoDB official documentation on transactions and Decimal128
- Express.js application structure best practices
- OWASP API security guidelines
- Pharmacy POS architecture case studies
