import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { createItemSchema } from '../controllers/itemController.js';

describe('Item Master Schema & Derived Pricing (Plan 02-01)', () => {
  it('validates item payload and verifies unit hierarchy and derived pricing math', () => {
    const rawInput = {
      tradeName: 'Napa Extra',
      genericName: 'Paracetamol + Caffeine',
      category: 'Tablet',
      manufacturer: 'Beximco Pharmaceuticals Ltd.',
      shelfLocation: 'Rack A-1',
      unitHierarchy: {
        baseUnit: 'piece',
        piecesPerStrip: 12,
        stripsPerBox: 11,
      },
      mrpPerPiece: '2.50',
      lowStockThresholdPieces: 50,
    };

    const validated = createItemSchema.parse(rawInput);
    expect(validated.tradeName).toBe('Napa Extra');
    expect(validated.unitHierarchy.piecesPerStrip).toBe(12);
    expect(validated.unitHierarchy.stripsPerBox).toBe(11);

    // Derived packaging math:
    const pieceMRP = new Decimal(validated.mrpPerPiece.toString());
    const pcsPerStrip = validated.unitHierarchy.piecesPerStrip;
    const stripsPerBox = validated.unitHierarchy.stripsPerBox;
    const totalPcsPerBox = pcsPerStrip * stripsPerBox; // 132

    const stripPrice = pieceMRP.times(pcsPerStrip).toFixed(2);
    const boxPrice = pieceMRP.times(totalPcsPerBox).toFixed(2);

    expect(stripPrice).toBe('30.00');
    expect(boxPrice).toBe('330.00');
    expect(totalPcsPerBox).toBe(132);
  });

  it('rejects invalid or negative MRP per piece', () => {
    const invalidInput = {
      tradeName: 'Napa',
      genericName: 'Paracetamol',
      category: 'Tablet',
      manufacturer: 'Beximco',
      mrpPerPiece: '-2.50',
    };

    expect(() => createItemSchema.parse(invalidInput)).toThrow();
  });
});
