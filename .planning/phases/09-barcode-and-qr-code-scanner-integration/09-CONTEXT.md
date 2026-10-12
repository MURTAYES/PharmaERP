# Phase 9: Automated Barcode & QR Scanner Integration (POS & Inventory Auto-Detection) - Context

**Date:** 2026-10-12  
**Status:** Defined  
**Phase:** 9 — Automated Barcode & QR Code Scanner Integration  

---

## 1. Domain & Business Goals

PharmaERP's core value proposition is **fast, error-free counter billing and rapid inventory ingestion**. At retail pharmacy counters and stock receiving areas, pharmacists use hardware barcode and QR code scanners (handheld USB/Bluetooth scanners operating as HID keyboard wedges).

Manual typing of medicine names or selecting from long dropdowns creates friction during peak hours. This phase introduces automated hardware scanner detection that turns any physical scan into an immediate, zero-click software action across POS billing and inventory batch receiving.

---

## 2. Key Architecture & User Decisions Locked

### A. Hardware Scanner Auto-Detection (HID Keyboard Wedge Listener)
- **Zero Click / Zero Focus**: Cashiers do not need to click or focus the search input before scanning. A global window keyboard listener listens for incoming scanner keystrokes.
- **Inter-Character Interval Guard**: Physical scanners transmit entire barcode strings at extremely high speeds (<30ms between characters, concluding with an `Enter` key). The detector cleanly differentiates between barcode scanners and manual human typing, preventing accidental triggers while typing normally.

### B. Point of Sale (POS) Billing Behavior
1. **Immediate Auto-Add**:
   - Scanning a barcode or QR code instantly looks up the product and adds its active batch to the cart.
   - Triggers an instantaneous visual row highlight and a soft success audio chime for cashier confirmation.
2. **Duplicate Scan Handling**:
   - If an item is already present in the active cart, scanning its barcode again automatically increments the quantity by `+1` piece.
3. **Multi-Batch Resolution (Batch Picker)**:
   - When a scanned product has **only 1 active batch in stock**, it is added immediately.
   - When a product has **multiple active batches in stock**, it immediately presents a streamlined, quick batch picker popover allowing the pharmacist to confirm which physical batch is in their hand before continuing.

### C. Inventory Stock Receiving ("Receive Batch") Behavior
1. **Auto-Populate Product Card**:
   - When the "Receive Batch" modal is opened in Inventory and a barcode is scanned, the system instantly matches the product.
   - Auto-fills Trade Name, Brand Name, Product Category, and Pieces-Per-Box packaging ratio.
   - Automatically advances cursor focus directly to the **Batch Number** and **Expiry Date** input fields for fast batch ingestion.
2. **Batch Association**:
   - If the scanned barcode is associated with an existing batch in the catalog, it can auto-populate known supplier/pricing history for review.

### D. Unknown Barcode Graceful Fallback
- If an unrecognized barcode/QR code is scanned (not in the database), the system does not crash or silently fail.
- Instead, it displays a clean prompt: **"Unknown Barcode Detected: Link to existing product or Add New Master Product"**, with one-click buttons to either attach the barcode to an existing medicine or launch "Add Master Product" with the barcode already pre-filled.

---

## 3. Plan Decomposition Strategy

Phase 9 will be executed across 2 focused, vertical plans:
- **09-01: Global Scanner Hardware Listener Engine & Barcode/QR Lookup API**
  - Fast barcode lookup endpoint (`GET /api/inventory/items/lookup-barcode?code=...`) supporting multi-barcode arrays and batch associations.
  - Reusable React scanner hook (`useBarcodeScanner`) with inter-keystroke interval timing, buffer flushing, and audio chime feedback.
- **09-02: POS Zero-Click Billing & Inventory Receive Modal Auto-Ingestion**
  - POS auto-add and duplicate quantity increment (`+1`).
  - POS quick multi-batch selector popover.
  - Inventory "Receive Batch" instant product detection and auto-focus workflow.
  - "Unknown Barcode" linking & master product creation modal.
