import { describe, it, expect } from 'vitest';
import { stripSensitiveFields } from '../middleware/serializer.js';

describe('Zero Cost/Profit Field-Leak Security Audit', () => {
  it('strictly strips all purchase costs, profit, and valuation from Pharmacist payloads', () => {
    const sensitivePayload = {
      _id: 'batch_123',
      batchNumber: 'B-9912',
      qtySellable: 100,
      mrpPerPiece: '5.00',
      purchasePricePerPiece: '3.50',
      purchaseCostPerPiece: '3.50',
      cost: '350.00',
      totalCost: '350.00',
      grossProfit: '150.00',
      profit: '150.00',
      marginPercent: 30,
      costValuation: '350.00',
      retailValuation: '500.00',
      isCostMissing: false,
      nestedItems: [
        {
          tradeName: 'Napa',
          purchasePricePerPiece: '1.20',
          grossProfit: '0.80',
        },
      ],
    };

    const sanitized = stripSensitiveFields(sensitivePayload, 'pharmacist');

    // Sensitive fields must be completely undefined/removed
    expect(sanitized.purchasePricePerPiece).toBeUndefined();
    expect(sanitized.purchaseCostPerPiece).toBeUndefined();
    expect(sanitized.cost).toBeUndefined();
    expect(sanitized.totalCost).toBeUndefined();
    expect(sanitized.grossProfit).toBeUndefined();
    expect(sanitized.profit).toBeUndefined();
    expect(sanitized.marginPercent).toBeUndefined();
    expect(sanitized.costValuation).toBeUndefined();
    expect(sanitized.nestedItems[0].purchasePricePerPiece).toBeUndefined();
    expect(sanitized.nestedItems[0].grossProfit).toBeUndefined();

    // Non-sensitive fields remain intact
    expect(sanitized.batchNumber).toBe('B-9912');
    expect(sanitized.qtySellable).toBe(100);
    expect(sanitized.mrpPerPiece).toBe('5.00');
    expect(sanitized.nestedItems[0].tradeName).toBe('Napa');
  });

  it('preserves all financial and cost fields for Owner role', () => {
    const ownerPayload = {
      batchNumber: 'B-9912',
      purchasePricePerPiece: '3.50',
      grossProfit: '150.00',
    };

    const result = stripSensitiveFields(ownerPayload, 'owner');

    expect(result.purchasePricePerPiece).toBe('3.50');
    expect(result.grossProfit).toBe('150.00');
    expect(result.batchNumber).toBe('B-9912');
  });

  it('handles array collections and deep objects without mutation', () => {
    const batchList = [
      { batchNumber: 'B1', purchasePricePerPiece: '2.00', qty: 50 },
      { batchNumber: 'B2', purchasePricePerPiece: '4.00', qty: 30 },
    ];

    const sanitizedList = stripSensitiveFields(batchList, 'pharmacist');

    expect(sanitizedList).toHaveLength(2);
    expect(sanitizedList[0].purchasePricePerPiece).toBeUndefined();
    expect(sanitizedList[1].purchasePricePerPiece).toBeUndefined();
    expect(sanitizedList[0].batchNumber).toBe('B1');
    expect(sanitizedList[1].batchNumber).toBe('B2');
  });
});
