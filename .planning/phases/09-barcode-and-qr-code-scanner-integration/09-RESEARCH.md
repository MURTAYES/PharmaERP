# Phase 9: Automated Barcode & QR Scanner Integration - Research

**Date:** 2026-10-12  
**Domain:** Hardware HID Barcode/QR Scanner Detection, POS Zero-Click Billing, Inventory Auto-Ingestion  

---

## 1. Technical Context & Scanner Architecture

### HID Keyboard-Wedge Emulation
Almost all USB and Bluetooth handheld barcode scanners (such as Honeywell, Zebra, Netum, Eyoyo, Symcode, etc.) operate as **Human Interface Devices (HID)** in keyboard-wedge mode. 
- When a barcode or QR code is scanned, the hardware transmits the decoded alphanumeric characters sequentially as keyboard strokes, terminated with an `Enter` (Carriage Return `\r` / `\n`) keystroke.
- **Key Inter-Character Interval (ICI)**:
  - Human typing speed: 60ms – 250ms per keystroke.
  - Hardware barcode scanner speed: **5ms – 25ms per keystroke**.
- **Detection Algorithm**:
  - Keep a timestamped buffer of characters.
  - When `Enter` is received: if buffer length >= 3 and average ICI < 40ms, classify as **Hardware Scan**.
  - Call `preventDefault()` on the terminating `Enter` key so it does not trigger accidental form submissions.
  - Flush buffer after 50ms of inactivity if no `Enter` follows.

### Synthesized Web Audio API Beep
Rather than depending on external `.mp3` assets that might fail to load offline or have CORS issues, a short, crisp physical confirmation tone can be synthesized in zero dependencies using browser `AudioContext`:
- Frequency: 1800Hz – 2400Hz (typical supermarket POS beep).
- Duration: 60ms with smooth gain envelope.

---

## 2. Existing Database & Model Patterns in PharmaERP

### `Item` Model (`server/src/models/Item.ts`)
- Has `barcodes: string[]` (indexed) and `qrCode: string` (indexed).
- Has `tradeName`, `genericName`, `manufacturer`, `brandName`, `category`, `unitHierarchy`, `mrpPerPiece`.

### `Batch` Model (`server/src/models/Batch.ts`)
- Has `barcode?: string` and `qrCode?: string`.
- Has `qtySellable`, `expiryDate`, `purchasePricePerPiece`.
- Batches can be sorted by `expiryDate: 1` to identify FEFO batches.

### Missing Backend Route
There is currently no dedicated single-query endpoint that:
1. Takes `code` (barcode or QR string).
2. Looks up matching `Item` (via `barcodes`, `qrCode`, or `itemCode`) AND matching `Batch` (via `barcode` or `qrCode`).
3. Fetches active batches (`qtySellable > 0`) for that item sorted by FEFO.
4. Returns all in a single <30ms roundtrip.

Adding `GET /api/inventory/items/lookup-barcode?code=:code` provides this exact sub-50ms lookup.

---

## 3. UI/UX Workflow Architecture

### Point of Sale Terminal (`POS.tsx`)
1. **Global Hook**: `useBarcodeScanner({ onScan, enabled: true })` active when not in a blocking modal.
2. **Duplicate Detection**: If item already in `lines`, increment `quantity` by 1 and recalculate totals.
3. **Multi-Batch Resolution**:
   - If 1 active batch: directly append to cart line items.
   - If >1 active batch: display floating popover near cart or modal: "Multiple batches in stock for {tradeName}: Select batch".
4. **Visual Feedback**: Flash newly added or updated cart row with subtle emerald glow.

### Inventory Stock Ingestion (`StockReceivingModal.tsx`)
1. When modal is open, scanner hook routes to modal handler.
2. Scanned barcode looks up product.
3. Product dropdown is automatically selected, brand and unit hierarchy auto-populate.
4. Focus is placed immediately on `batchNumber` input so pharmacist can type or scan the batch number without touching mouse.

### Unknown Barcode Workflow (`UnknownBarcodeModal.tsx`)
1. If lookup returns `{ found: false }`, prompt modal:
   - "Unrecognized barcode: {code}"
   - Button 1: "Link to Existing Product" -> searchable dropdown of existing items, adds code to item's `barcodes` array.
   - Button 2: "Create New Master Product" -> opens `ItemModal` with barcode pre-filled.

---

## 4. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| User is typing manually in a form input and scanner fires | Fast inter-keystroke interval check ensures scanner bursts are captured even if an input is focused, preventing partial text corruption. |
| Barcode scanner sends non-standard terminating key (e.g. Tab instead of Enter) | Support both `Enter` and `Tab` as termination characters, configurable with standard defaults. |
| Audio playback blocked by browser autoplay policy | Web Audio Context is initialized on first user interaction (click/touch) and cached. |
| Product has expired batches only | Lookup differentiates active sellable stock (`qtySellable > 0 && expiryDate > now`) from expired stock and warns appropriately. |
