import { describe, it, expect } from 'vitest';
import {
  transferStockSchema,
  writeOffStockSchema,
} from '../controllers/stockAdjustmentController.js';

describe('Stock Adjustment & Write-off Schema Validation (Plan 02-03)', () => {
  it('validates correct bucket transfer payloads with mandatory reason note', () => {
    const validTransfer = {
      batchId: '654321654321654321654321',
      fromBucket: 'sellable',
      toBucket: 'damaged',
      quantityPieces: 15,
      reasonCategory: 'Shelf Spill/Breakage',
      reasonDetail: 'Water spill on top shelf damaged packaging',
    };

    const validated = transferStockSchema.parse(validTransfer);
    expect(validated.fromBucket).toBe('sellable');
    expect(validated.toBucket).toBe('damaged');
    expect(validated.quantityPieces).toBe(15);
  });

  it('rejects transfer without detailed reason note', () => {
    const invalidTransfer = {
      batchId: '654321654321654321654321',
      fromBucket: 'sellable',
      toBucket: 'damaged',
      quantityPieces: 10,
      reasonCategory: 'Shelf Spill/Breakage',
      reasonDetail: '', // Empty reason
    };

    expect(() => transferStockSchema.parse(invalidTransfer)).toThrow();
  });

  it('validates write-off schema correctly', () => {
    const validWriteOff = {
      batchId: '654321654321654321654321',
      fromBucket: 'damaged',
      quantityPieces: 20,
      reasonCategory: 'Expired Stock Quarantine',
      reasonDetail: 'Incinerated expired capsules',
    };

    const validated = writeOffStockSchema.parse(validWriteOff);
    expect(validated.quantityPieces).toBe(20);
    expect(validated.fromBucket).toBe('damaged');
  });
});
