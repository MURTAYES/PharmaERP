# Phase 3: Point of Sale & Billing (End-to-End) - Research

**Date:** 2026-10-03  
**Status:** Complete  
**Phase:** 3 — Point of Sale & Billing  

---

## 1. Technical Architecture & Domain Patterns

### A. Data Models & Schemas

#### 1. Invoice Model (`server/src/models/Invoice.ts`)
```typescript
export interface IInvoiceLineItem {
  itemId: Types.ObjectId;
  tradeName: string;            // Snapshot at time of sale
  genericName: string;          // Snapshot
  batchId: Types.ObjectId;
  batchNumber: string;          // Snapshot
  expiryDate: Date;             // Snapshot
  unit: 'piece' | 'strip' | 'box';
  unitHierarchySnapshot: {
    piecesPerStrip: number;
    stripsPerBox: number;
  };
  quantity: number;             // Quantity in selected unit (integer)
  quantityPieces: number;       // Converted integer pieces deducted from stock
  unitPrice: Types.Decimal128;  // Price charged per selected unit
  unitPricePerPiece: Types.Decimal128; // Derived price per base piece
  lineTotal: Types.Decimal128;  // quantity * unitPrice
  purchaseCostPerPiece?: Types.Decimal128; // Cost snapshot (Owner only, stripped from pharmacist)
  isPriceOverridden: boolean;
  originalUnitPrice?: Types.Decimal128;
  priceOverrideVariance?: Types.Decimal128;
  isNonFefo: boolean;           // True if earlier expiring batch was available
  suggestedFefoBatchNumber?: string;
}

export interface IInvoicePayment {
  method: 'cash' | 'card' | 'mfs' | 'split';
  cashTendered?: Types.Decimal128;
  changeDue?: Types.Decimal128;
  mfsProvider?: 'bkash' | 'nagad' | 'rocket' | 'upay';
  mfsTransactionId?: string;
  cardLast4?: string;
  cardType?: string;
  splitDetails?: {
    cashAmount?: Types.Decimal128;
    cardAmount?: Types.Decimal128;
    mfsAmount?: Types.Decimal128;
  };
}

export interface IInvoice {
  invoiceNumber: string;        // Formatted sequence: "INV-000001"
  billedBy: Types.ObjectId;     // Reference to User
  billedByName: string;         // Snapshot of Pharmacist / Owner username
  customerName?: string;
  customerPhone?: string;
  lines: IInvoiceLineItem[];
  subtotal: Types.Decimal128;   // Sum of line totals
  discountPercent: Types.Decimal128; // e.g. 5.00%
  discountAmount: Types.Decimal128;  // subtotal * (discountPercent / 100)
  charges: {
    name: string;
    type: 'percentage' | 'fixed';
    rate: Types.Decimal128;     // e.g. 5% VAT or ৳ 10.00 fixed
    amount: Types.Decimal128;   // Calculated charge amount
  }[];
  totalCharges: Types.Decimal128;
  grandTotal: Types.Decimal128; // (subtotal - discountAmount) + totalCharges (rounded 2dp)
  payment: IInvoicePayment;
  status: 'PAID' | 'RETURNED_PARTIAL' | 'RETURNED_FULL';
  hasPriceOverride: boolean;
  hasNonFefoBatch: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. Held Bill Model (`server/src/models/HeldBill.ts`)
```typescript
export interface IHeldBill {
  billReference: string;        // Auto-generated e.g. "HOLD-101" or customer label
  heldBy: Types.ObjectId;       // User who held the bill
  heldByName: string;
  customerName?: string;
  customerPhone?: string;
  lines: Array<{
    itemId: string;
    tradeName: string;
    genericName: string;
    batchId: string;
    batchNumber: string;
    expiryDate: string;
    unit: 'piece' | 'strip' | 'box';
    unitHierarchy: {
      piecesPerStrip: number;
      stripsPerBox: number;
    };
    quantity: number;
    unitPrice: string;
    mrpPerPiece: string;
    isPriceOverridden: boolean;
    originalUnitPrice?: string;
    isNonFefo: boolean;
  }>;
  discountPercent: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. Calculation & Precision Engine (Decimal.js)

To prevent floating-point calculation errors:
- Intermediate amounts are computed with 100% precision:
  $$\text{subtotal} = \sum (\text{qty} \times \text{unitPrice})$$
  $$\text{discountAmount} = \text{subtotal} \times \left(\frac{\text{discountPercent}}{100}\right)$$
  $$\text{netAfterDiscount} = \text{subtotal} - \text{discountAmount}$$
  $$\text{percentageChargeAmount} = \text{netAfterDiscount} \times \left(\frac{\text{chargeRate}}{100}\right)$$
  $$\text{fixedChargeAmount} = \text{chargeRate}$$
  $$\text{grandTotal} = \text{ROUND\_HALF\_UP}\left(\text{netAfterDiscount} + \sum \text{chargeAmounts},\, 2\right)$$
- All amounts serialized as clean strings over HTTP JSON and stored as `Mongoose.Types.Decimal128` in MongoDB.

---

## 3. Concurrency & Negative Stock Protection

Checkout transactions run within an atomic MongoDB replica set session:
```typescript
const session = await mongoose.startSession();
session.startTransaction();
try {
  // 1. Atomically deduct stock with $gte conditional guard
  for (const line of lines) {
    const updatedBatch = await Batch.findOneAndUpdate(
      {
        _id: line.batchId,
        qtySellable: { $gte: line.quantityPieces },
      },
      {
        $inc: { qtySellable: -line.quantityPieces },
      },
      { session, new: true }
    );
    if (!updatedBatch) {
      throw new Error(`Insufficient stock for batch ${line.batchNumber} (${line.tradeName})`);
    }
  }
  
  // 2. Atomically allocate next sequential invoice number
  const invoiceNumber = await getNextSequence('invoiceNumber', 'INV', 6, session);
  
  // 3. Save immutable invoice snapshot
  const [invoice] = await Invoice.create([invoiceData], { session });
  
  // 4. Record stock movement ledger entries (SALE_DEDUCT)
  await StockMovement.create(stockMovements, { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## 4. FEFO Recommendation & Non-FEFO Flagging
- When querying batches for an item during sale, sort by `expiryDate ASC` where `qtySellable > 0`.
- The first batch is the recommended **FEFO batch**.
- If a pharmacist chooses any other batch while a valid earlier-expiring batch has stock, `isNonFefo` is marked `true` and the suggested batch number is recorded for auditing.

---

## 5. High-Speed Keyboard Navigation & Thermal Printing
- **Shortcuts:**
  - `F2` or `/`: Focus item search
  - `F4` or `Ctrl+Enter`: Open Payment Modal / Checkout
  - `F8`: Quick Hold Bill
  - `F9`: View Held Bills
  - `Esc`: Clear / Cancel
  - `Up/Down` + `Enter`: Fast list navigation
- **Thermal Print Engine:**
  - Standard browser `@media print` with custom `@page { size: 58mm auto; margin: 0; }` and `80mm auto`.
  - Monospace receipt typography, high-contrast black/white, structured line items, payment breakdown, and QR/receipt metadata.

---

## Validation Architecture

1. **Precision Validation:** All money arithmetic executed via `decimal.js`.
2. **Atomic Integrity:** Multi-document MongoDB transactions with `$gte` stock guard.
3. **Role Security:** Pharmacist view strips all purchase cost data from invoices.
4. **Hardware-Agnostic Printing:** CSS `@media print` works across any browser and connected ESC/POS thermal printer without third-party drivers.
