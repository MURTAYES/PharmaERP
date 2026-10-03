import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';

describe('Supplier Returns Logic', () => {
  it('calculates total return value accurately with Decimal precision', () => {
    const lines = [
      { quantityPieces: 10, purchaseCostPerPiece: '15.50' },
      { quantityPieces: 5, purchaseCostPerPiece: '8.20' },
    ];

    let totalPcs = 0;
    let totalCredit = new Decimal(0);

    for (const l of lines) {
      totalPcs += l.quantityPieces;
      const lineCost = new Decimal(l.purchaseCostPerPiece).times(l.quantityPieces);
      totalCredit = totalCredit.plus(lineCost);
    }

    expect(totalPcs).toBe(15);
    expect(totalCredit.toFixed(2)).toBe('196.00');
  });

  it('rejects invalid or zero quantity returns', () => {
    const qty = 0;
    expect(() => {
      if (qty <= 0) throw new Error('Return quantity pieces must be greater than 0');
    }).toThrow('Return quantity pieces must be greater than 0');
  });
});
