# Phase 3: Point of Sale & Billing (End-to-End) - Context

**Date:** 2026-10-03  
**Status:** Defined  
**Phase:** 3 — Point of Sale & Billing  

---

## 1. Domain & Business Goals

PharmaERP's core value proposition is **fast, error-free counter billing with batch-level traceability**. At the retail pharmacy counter, speed is critical during peak customer rush, but precision and auditability cannot be compromised.

### Core Workflows to Support:
1. **Rapid Item & Batch Selection:**
   - Search medicines by trade name, generic name, or item code in <300ms.
   - Automatically pick the earliest-expiring (FEFO) sellable batch.
   - Allow pharmacist to select another batch without hard blocks, while transparently marking the line as non-FEFO.
2. **Unit & Price Flexibility:**
   - Support selling in pieces, strips, or boxes with automatic integer piece conversion.
   - Allow counter price overrides (e.g. regular customer discount or round-off per item) without administrative approval bottlenecks, while logging the variance.
3. **Draft & Held Bills Management:**
   - Hold customer carts instantly (e.g. while customer checks another item) and resume from any terminal.
4. **Discounts & Settings-Based Charges:**
   - Apply percentage invoice discounts.
   - Apply active tax/VAT percentage charges and fixed fees configured in Pharmacy Settings.
5. **Multi-Method Tender & Change Calculation:**
   - Support Cash (instant change calculation), Card, MFS (bKash/Nagad/Rocket), and Split payments.
6. **Concurrency-Safe Atomic Checkout:**
   - Atomically deduct batch sellable pieces using `$gte` guard in a MongoDB transaction.
   - Assign gap-free sequential invoice number (`INV-000001`).
   - Write stock movement ledger entries (`SALE_DEDUCT`).
   - Create immutable snapshot invoice.
7. **Thermal Receipt Printing:**
   - Format instant printable thermal receipts (58mm / 80mm) via browser print CSS.

---

## 2. Role Boundaries & Security

- **Owner:** Can view invoice line purchase costs, calculated profit margins, price override reports, and non-FEFO audit flags.
- **Pharmacist:** Can perform fast POS billing, price overrides, held bills, and receipt printing. Never receives purchase cost or margin data in any API response or UI view.

---

## 3. Plan Decomposition Strategy

Phase 3 is executed across 5 focused, vertical plans:
- **03-01: Invoicing & Held Bill Models, Decimal Calculation Engine, and Sequential Counter Service**
- **03-02: Atomic POS Checkout Transaction & Batch FEFO Availability API**
- **03-03: Server-side Held Bills API & Quick Bill Management**
- **03-04: High-Speed POS Billing UI with Keyboard Shortcuts, Cart Management, FEFO Selector & Price Overrides**
- **03-05: POS Payment Modal, Multi-Tender Processing, Thermal Receipt Print Engine & Invoice History View**
