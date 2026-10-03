# Phase 4: Returns & Credit Notes (End-to-End) — Context & Decisions

## Executive Summary
Phase 4 implements end-to-end sales returns (customer returns against previous invoices), proportional refund calculation, stock bucket destination routing, sequential credit notes (`CN-000001`), thermal credit note receipt printing, and owner-only supplier return invoices (`SRT-000001`).

---

## Key Decisions & Locked Implementation Choices

### 1. Sales Return / Customer Refund Workflow
- **Invoice Lookup:** Search by invoice number (e.g. `INV-202610-00001`), customer phone number, or date range.
- **Partial & Full Line Item Returns:**
  - Display all original items, sold quantities, and units (pieces/strips/boxes).
  - Track previously returned quantities so an item cannot be returned more than the original sold amount.
  - Return quantities can be specified in piece/strip/box with auto-conversion to base pieces.
- **Access & Authorization:**
  - Both Pharmacist and Owner can process sales returns on any valid past invoice.
  - Mandatory audit reason category (e.g. `Wrong Medicine Dispensed`, `Customer Adverse Reaction`, `Doctor Changed Prescription`, `Damaged / Defective Packaging`, `Customer Over-purchased`) + mandatory note.

### 2. Refund Math & Pricing Engine
- **Proportional Refund Calculation:**
  - Item return value = `returned_pieces * sold_piece_price`.
  - Proportional item discount reduction: if invoice had flat discount, discount is deducted proportionally based on returned subtotal relative to original invoice subtotal.
  - Percentage charges (VAT / Tax / Service fees) refunded proportionally based on returned taxable amount.
  - Fixed charges (e.g. fixed delivery/card fee) remain non-refundable.
- **Refund Payment Modes:**
  - Refund method: Cash or Original Payment Method reversal.
  - All money calculations executed via `Decimal.js` with `Decimal128` persistence.

### 3. Stock Destination & Quarantine Routing
- **Per-Item Destination Bucket:**
  - `sellable`: Medicine is sealed, untampered, and unexpired. Stock is atomically credited back to `qtySellable` of the exact original batch.
  - `damaged`: Medicine package opened, broken, or contaminated. Stock credited to `qtyDamaged` bucket for supplier return or write-off.
  - `expired`: Medicine returned post-expiry. Stock credited to `qtyExpired` bucket.
- **Stock Ledger Integration:**
  - Every return writes an immutable `StockMovement` ledger entry with type `sales_return` and destination bucket.

### 4. Credit Notes & Thermal Receipts
- **Sequential Credit Note Numbering:**
  - Atomic counter generating gap-free sequential numbers: `CN-YYYYMM-00001` (or `CN-000001`).
  - Stores complete snapshot of original invoice reference, returned lines, refund breakdown, and refund method.
- **Printable Thermal Receipt:**
  - 80mm and 58mm browser print view for Credit Notes with pharmacy header, original invoice number, items returned, refund total, and barcode/QR placeholder.

### 5. Supplier Returns (Owner Only)
- **Supplier Return Invoices (`SRT-000001`):**
  - Allows Owner to select damaged or expired batches and return them to the pharmaceutical distributor/supplier.
  - Atomically deducts stock from `qtyDamaged` or `qtyExpired` with `$gte` concurrency guard.
  - Records supplier invoice reference, credit memo amount, reason, and writes a `supplier_return` stock ledger entry.

---

## Downstream Implementation Roadmap
- **Plan 04-01:** Sales return data models (`CreditNote`, `Counter`), pricing engine refund calculation, and atomic return transaction service.
- **Plan 04-02:** Supplier return invoice model (`SupplierReturn`) and bucket deduction engine (owner-only RBAC).
- **Plan 04-03:** Frontend Returns UI: invoice return lookup dialog, bucket selector, refund preview, printable thermal credit note receipt, and supplier return creator.
