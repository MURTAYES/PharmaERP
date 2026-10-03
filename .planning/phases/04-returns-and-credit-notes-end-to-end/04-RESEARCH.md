# Phase 4: Returns & Credit Notes (End-to-End) - Research

**Date:** 2026-10-03  
**Status:** Complete  
**Phase:** 4 — Returns & Credit Notes  

---

## 1. Technical Architecture & Domain Patterns

### A. Data Models & Schemas

#### 1. Credit Note Model (`server/src/models/CreditNote.ts`)
```typescript
export interface ICreditNoteLineItem {
  itemId: Types.ObjectId;
  tradeName: string;
  genericName: string;
  batchId: Types.ObjectId;
  batchNumber: string;
  unit: 'piece' | 'strip' | 'box';
  unitHierarchySnapshot: {
    piecesPerStrip: number;
    stripsPerBox: number;
  };
  returnedQuantity: number;
  returnedQuantityPieces: number;
  originalUnitPrice: Types.Decimal128;
  originalUnitPricePerPiece: Types.Decimal128;
  returnedLineTotal: Types.Decimal128;
  destinationBucket: 'sellable' | 'damaged' | 'expired';
}

export interface ICreditNote extends Document {
  creditNoteNumber: string;       // Gap-free sequence: CN-000001
  invoiceId: Types.ObjectId;
  invoiceNumber: string;
  customerId?: Types.ObjectId;
  customerName?: string;
  customerPhone?: string;
  processedBy: Types.ObjectId;
  processedByName: string;
  lines: ICreditNoteLineItem[];
  subtotalRefund: Types.Decimal128;
  discountRefund: Types.Decimal128;
  chargesRefund: Types.Decimal128;
  grandTotalRefund: Types.Decimal128;
  refundMethod: 'cash' | 'original_payment';
  reasonCategory: string;
  reasonDetail: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. Supplier Return Model (`server/src/models/SupplierReturn.ts`)
```typescript
export interface ISupplierReturnLineItem {
  itemId: Types.ObjectId;
  tradeName: string;
  genericName: string;
  batchId: Types.ObjectId;
  batchNumber: string;
  expiryDate: Date;
  fromBucket: 'damaged' | 'expired';
  quantityPieces: number;
  purchaseCostPerPiece?: Types.Decimal128; // Owner visibility
  totalCost?: Types.Decimal128;           // Owner visibility
}

export interface ISupplierReturn extends Document {
  supplierReturnNumber: string;    // Gap-free sequence: SRT-000001
  supplierName: string;
  supplierInvoiceRef?: string;
  processedBy: Types.ObjectId;
  processedByName: string;
  lines: ISupplierReturnLineItem[];
  totalQuantityPieces: number;
  totalEstimatedCredit?: Types.Decimal128;
  reasonCategory: string;
  reasonDetail: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. Refund Math & Pricing Engine (`server/src/utils/pricingEngine.ts`)

### Proportional Refund Formula:
1. **Returned Line Total:**
   `line_refund = returned_quantity_pieces * unit_price_per_piece`
2. **Subtotal Refund:**
   `subtotal_refund = sum(line_refund for each returned line)`
3. **Proportional Discount Refund:**
   If the original invoice had a discount, compute the ratio:
   `ratio = subtotal_refund / original_subtotal`
   `discount_refund = original_discount_amount * ratio`
4. **Proportional Percentage Charges Refund:**
   For each percentage charge (e.g. VAT 5%):
   `charge_refund = (subtotal_refund - discount_refund) * (rate / 100)`
   Fixed charges (e.g. fixed platform/delivery fee) have `charge_refund = 0`.
5. **Grand Total Refund:**
   `grand_total_refund = roundHalfUp(subtotal_refund - discount_refund + charges_refund)`

---

## 3. Atomic Multi-Document Transaction Architecture

### Sales Return Transaction (`returnService.ts`):
1. **Start Mongoose Session Transaction.**
2. **Validate Invoice & Remaining Returnable Quantity:**
   - Fetch target invoice.
   - Aggregate all previous credit notes for this invoice.
   - For each returned item in request:
     `total_already_returned + requested_return <= original_sold_quantity`
   - Throw `400 Bad Request` if over-returning.
3. **Compute Proportional Refund Breakdown** via `pricingEngine.calculateRefund(...)`.
4. **Acquire Next Gap-Free Credit Note Number:**
   `getNextSequence('creditNoteNumber', 'CN', 6, session)`
5. **Update Batch Buckets Atomically:**
   - For each line item:
     - If `destinationBucket === 'sellable'`: `$inc: { qtySellable: returned_pieces }`
     - If `destinationBucket === 'damaged'`: `$inc: { qtyDamaged: returned_pieces }`
     - If `destinationBucket === 'expired'`: `$inc: { qtyExpired: returned_pieces }`
   - Create `StockMovement` ledger entry (`type: 'RETURN_RESTOCK'`).
6. **Update Invoice Status:**
   - If total pieces returned equals total invoice pieces -> `status = 'RETURNED_FULL'`
   - Else -> `status = 'RETURNED_PARTIAL'`
7. **Save `CreditNote` document.**
8. **Commit Transaction.**

---

## 4. UI & Frontend Architecture

1. **Returns Lookup Dialog / Screen (`client/src/pages/Returns.tsx` & `client/src/components/returns/SalesReturnModal.tsx`):**
   - Search invoice by number or customer phone.
   - View sold items, prices, past returned quantities, and returnable quantities.
   - Interactive quantity controls (piece/strip/box) + destination bucket selector (`Sellable`, `Damaged`, `Expired`).
   - Live refund breakdown card displaying item total, proportional discount deduction, tax adjustments, and final cash/original refund.
2. **Printable Thermal Credit Note Modal (`client/src/components/returns/CreditNoteReceiptModal.tsx`):**
   - 80mm/58mm thermal layout matching existing POS receipts.
3. **Supplier Return View (`client/src/components/returns/SupplierReturnModal.tsx`):**
   - Owner-only interface to select damaged/expired batch stock and issue `SRT-000001` vouchers.
