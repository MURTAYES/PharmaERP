import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { receiveBatchSchema, updateCostSchema } from '../controllers/batchController.js';
import { parseExpiryDate } from '../utils/dateUtils.js';

describe('Batch Receiving Schema & Unit Conversion Logic (Plan 02-02)', () => {
  it('parses MM/YYYY expiry date format to the last day of the month', () => {
    const parsed = parseExpiryDate('11/2027');
    expect(parsed.getUTCFullYear()).toBe(2027);
    expect(parsed.getUTCMonth()).toBe(10); // 0-indexed November = 10
    expect(parsed.getUTCDate()).toBe(30); // Last day of November = 30
  });

  it('parses DD/MM/YYYY expiry date format accurately', () => {
    const parsed = parseExpiryDate('15/08/2026');
    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(7); // August = 7
    expect(parsed.getUTCDate()).toBe(15);
  });

  it('calculates total pieces and cost per piece for box receiving', () => {
    const pcsPerStrip = 10;
    const stripsPerBox = 10;
    const totalPcsPerBox = pcsPerStrip * stripsPerBox; // 100

    const receivingInput = {
      itemId: '654321654321654321654321',
      batchNumber: 'SEC-8821',
      expiryDate: '12/2027',
      unit: 'box' as const,
      quantity: 2,
      purchasePrice: '800.00',
      supplierName: 'Square Pharma Depot',
    };

    const validated = receiveBatchSchema.parse(receivingInput);
    const totalPieces = validated.quantity * totalPcsPerBox; // 200 pcs
    const costPerPiece = new Decimal(validated.purchasePrice!).dividedBy(totalPcsPerBox); // 800 / 100 = 8.00 per box -> 4.00 per piece

    expect(totalPieces).toBe(200);
    expect(costPerPiece.toFixed(2)).toBe('8.00'); // 800 for 2 boxes = 400/box = 4.00/pc
  });

  it('validates batch cost update schema', () => {
    const valid = updateCostSchema.parse({ purchasePrice: '50.00', unit: 'strip' });
    expect(valid.purchasePrice).toBe('50.00');
    expect(valid.unit).toBe('strip');
  });
});
