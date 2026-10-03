# Phase 2: Inventory & Stock Management (End-to-End) - Research

**Date:** 2026-10-03
**Status:** Complete

## Technical Architecture & Domain Patterns

### 1. Data Models & Schemas

#### A. Item Model (`server/src/models/Item.ts`)
```typescript
interface IItem {
  tradeName: string;            // e.g. "Napa Extra"
  genericName: string;          // e.g. "Paracetamol + Caffeine"
  itemCode: string;             // Auto or custom code e.g. "MED-000102"
  categoryId: Types.ObjectId;   // Reference to Category
  manufacturer: string;         // e.g. "Beximco Pharmaceuticals Ltd."
  shelfLocation?: string;       // e.g. "Rack A-3"
  unitHierarchy: {
    baseUnit: 'piece';          // Base tracking unit is always piece
    piecesPerStrip: number;     // e.g. 12
    stripsPerBox: number;       // e.g. 11 (Total pieces = 132)
  };
  mrpPerPiece: Types.Decimal128; // Strict decimal price per piece (e.g. 2.50)
  lowStockThresholdPieces: number; // Minimum pieces before alert (e.g. 50)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```
**Derived Pricing Math:**
- `stripPrice = mrpPerPiece * piecesPerStrip` (e.g., `2.50 * 12 = 30.00`)
- `boxPrice = mrpPerPiece * piecesPerStrip * stripsPerBox` (e.g., `2.50 * 12 * 11 = 330.00`)
- Display string: `Unit Price: ৳ 2.50 (11 x 12: ৳ 330.00) | Strip Price: ৳ 30.00 | Box Price: ৳ 330.00`

#### B. Batch Model (`server/src/models/Batch.ts`)
```typescript
interface IBatch {
  itemId: Types.ObjectId;       // Ref to Item
  batchNumber: string;          // e.g. "B2049"
  expiryDate: Date;             // Standard Date (last day of month for MM/YYYY)
  qtySellable: number;          // Available pieces for POS
  qtyDamaged: number;           // Quarantined damaged pieces
  qtyExpired: number;           // Quarantined expired pieces
  purchasePricePerPiece?: Types.Decimal128; // Cost per piece (Owner only)
  isCostMissing: boolean;       // Flagged when received by pharmacist without cost
  supplierName?: string;        // Supplier name captured on receiving
  createdAt: Date;
  updatedAt: Date;
}
```

#### C. Stock Movement Ledger (`server/src/models/StockMovement.ts`)
```typescript
interface IStockMovement {
  batchId: Types.ObjectId;
  itemId: Types.ObjectId;
  type: 'RECEIVE' | 'ADJUST_TRANSFER' | 'WRITE_OFF' | 'SALE_DEDUCT' | 'RETURN_RESTOCK';
  qtyChangePieces: number;      // Positive or negative piece delta
  bucketFrom?: 'sellable' | 'damaged' | 'expired';
  bucketTo?: 'sellable' | 'damaged' | 'expired' | 'write_off';
  reasonCategory?: 
    | 'Damaged in Transit'
    | 'Shelf Spill/Breakage'
    | 'Physical Count Audit Variance'
    | 'Customer Return Quarantine'
    | 'Expired Stock Quarantine'
    | 'Supplier Return Prep'
    | 'Initial Stock';
  reasonDetail?: string;        // Mandatory explanation
  userId: Types.ObjectId;       // User who executed movement
  timestamp: Date;
}
```

---

### 2. High-Speed Type-Ahead Search (<300ms)

To achieve sub-300ms search times across thousands of pharmaceutical items:
- **Compound Compound Indexing**: Create compound index on `tradeName`, `genericName`, and `itemCode`.
- **Text & Prefix Regex Index**:
  ```typescript
  ItemSchema.index({ tradeName: 'text', genericName: 'text', itemCode: 'text' });
  ItemSchema.index({ tradeName: 1, genericName: 1 });
  ItemSchema.index({ itemCode: 1 });
  ```
- Fast autocomplete endpoint:
  ```typescript
  GET /api/items/search?q=napa&limit=15
  ```
  Returns matching items with real-time aggregate stock across batches (`totalSellablePieces`, `earliestExpiry`).

---

### 3. Expiry Calculations & Alert Tiers

Expiry alert windows are evaluated based on the current date:
- **Expired (`tier = 'expired'`):** `expiryDate <= today` (Red badge)
- **Critical (`tier = 'critical'`):** `today < expiryDate <= today + 30 days` (Amber badge)
- **Warning (`tier = 'warning'`):** `today + 30 days < expiryDate <= today + 60 days` (Yellow badge)
- **Notice (`tier = 'notice'`):** `today + 60 days < expiryDate <= today + 90 days` (Teal badge)
- **Normal (`tier = 'normal'`):** `expiryDate > today + 90 days` (Neutral/Green)

**Date Parsing Helper:**
- User types `11/2027` -> Parsed to `2027-11-30T23:59:59.999Z` (last second of the month).
- User types `15/11/2027` -> Parsed to `2027-11-15T23:59:59.999Z`.

---

## Validation Architecture

1. **Unit Consistency:** All inventory quantities in MongoDB are stored strictly in base unit (pieces). Box and Strip conversions are handled at the presentation / input boundary.
2. **Field Stripping:** `server/src/middleware/serializer.ts` ensures `purchasePricePerPiece`, `cost`, and `valuation` never reach pharmacist users.
3. **Immutability of Stock Ledger:** `StockMovement` schema blocks updates and deletes.

---

## Dependencies

- Frontend: `date-fns` (expiry formatting and comparison), `decimal.js` (unrounded math), `lucide-react` / Material Symbols Outlined.
- Backend: `mongoose` (Decimal128), `zod` (validation).
