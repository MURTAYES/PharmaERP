# Phase 5: Analytics & Reporting Suite (End-to-End) - Research

**Date:** 2026-10-03  
**Status:** Complete  
**Phase:** 5 — Analytics & Reporting Suite  

---

## 1. Technical Architecture & Domain Patterns

### A. Core Requirements Breakdown
- **RPT-01 (Live Dashboard):** Real-time summary of today's sales, weekly trends, transaction count, cash/card/MFS splits, active alert counts, and top 5 items.
- **RPT-02 (Sales Summary Report):** Filterable by date range (`Asia/Dhaka` timezone), payment method, and cashier/billedBy user.
- **RPT-03 (Sales by Item Report):** Item-level aggregation of pieces sold, total revenue, average sold price, and transaction frequency.
- **RPT-04 (Profit & Loss Report):** Revenue minus cost snapshots from invoice line items. Lines with missing purchase costs are flagged and excluded from profit math until owner enters the cost.
- **RPT-05 (Price Override Report):** All invoice lines where `isPriceOverridden: true`, showing original MRP, overridden price, variance amount, cashier, and invoice number.
- **RPT-06 (Non-FEFO Sales Report):** All invoice lines where `isNonFefo: true`, showing chosen batch vs suggested earlier expiring batch.
- **RPT-07 (Stock Valuation Report):** Total quantity of sellable/damaged/expired stock valued at retail MRP vs cost price.
- **RPT-08 (Expiry Report):** Batches categorized by warning windows (expired, <30d, <60d, <90d) with quantity and supplier info.
- **RPT-09 (Low Stock Report):** Medicines where total sellable pieces <= low stock threshold.
- **RPT-10 (Returns Report):** Customer returns (Credit Notes) and supplier returns (SRT vouchers) with reason breakdown and total refunds.
- **RPT-11 (Stock Movement Ledger Report):** Filterable chronological audit of all stock changes (`RECEIVE`, `ADJUST_TRANSFER`, `WRITE_OFF`, `SALE_DEDUCT`, `RETURN_RESTOCK`, `SUPPLIER_RETURN`).
- **RPT-12 (CSV Export):** Universal client-side CSV download for any report table.

---

## 2. Aggregation Pipelines & Timezone Handling

### Timezone:
- All date queries must convert `startDate` (00:00:00) and `endDate` (23:59:59.999) using `Asia/Dhaka` (+06:00 offset).

### P&L Computation Formula:
- `Revenue = sum(lineTotal for lines in invoice)`
- `Cost = sum(quantityPieces * purchaseCostPerPiece for lines where purchaseCostPerPiece != null)`
- `Gross Profit = Revenue - Cost`
- `Profit Margin % = (Gross Profit / Revenue) * 100`

---

## 3. RBAC & Data Protection
- All analytics and report endpoints are strictly protected with `requireRole(['owner'])`.
- Pharmacist role has no access to `/api/reports/*`.
