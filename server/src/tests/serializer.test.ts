import { describe, it, expect } from 'vitest';
import { stripSensitiveFields, SENSITIVE_PHARMACIST_FIELDS } from '../middleware/serializer.js';

describe('Server-Side Field Stripping Serializer', () => {
  it('strips sensitive cost, profit, and purchasePrice fields from objects', () => {
    const rawData = {
      itemName: 'Amoxicillin 500mg',
      batchNumber: 'AMX-001',
      expiryDate: '2026-12-31',
      qtySellable: 100,
      mrpPerPiece: '10.00',
      purchasePrice: '7.50',
      purchasePricePerPiece: '7.50',
      cost: '750.00',
      profit: '250.00',
      stockValuation: '750.00',
      margin: '25%',
    };

    const sanitized = stripSensitiveFields(rawData);

    expect(sanitized.itemName).toBe('Amoxicillin 500mg');
    expect(sanitized.batchNumber).toBe('AMX-001');
    expect(sanitized.mrpPerPiece).toBe('10.00');
    expect(sanitized.purchasePrice).toBeUndefined();
    expect(sanitized.purchasePricePerPiece).toBeUndefined();
    expect(sanitized.cost).toBeUndefined();
    expect(sanitized.profit).toBeUndefined();
    expect(sanitized.stockValuation).toBeUndefined();
    expect(sanitized.margin).toBeUndefined();
  });

  it('recursively strips sensitive fields inside nested arrays and objects', () => {
    const rawPayload = {
      status: 'success',
      report: {
        totalSales: '5000.00',
        totalProfit: '1200.00',
        items: [
          {
            name: 'Item A',
            salePrice: '100.00',
            unitCost: '80.00',
            profit: '20.00',
          },
          {
            name: 'Item B',
            salePrice: '200.00',
            unitCost: '150.00',
            profit: '50.00',
          },
        ],
      },
    };

    const sanitized = stripSensitiveFields(rawPayload);

    expect(sanitized.status).toBe('success');
    expect(sanitized.report.totalSales).toBe('5000.00');
    expect(sanitized.report.totalProfit).toBeUndefined();
    expect(sanitized.report.items[0].name).toBe('Item A');
    expect(sanitized.report.items[0].salePrice).toBe('100.00');
    expect(sanitized.report.items[0].unitCost).toBeUndefined();
    expect(sanitized.report.items[0].profit).toBeUndefined();
    expect(sanitized.report.items[1].unitCost).toBeUndefined();
  });

  it('handles null, undefined, primitive, and Date values safely', () => {
    const testDate = new Date();
    expect(stripSensitiveFields(null)).toBeNull();
    expect(stripSensitiveFields(undefined)).toBeUndefined();
    expect(stripSensitiveFields('hello')).toBe('hello');
    expect(stripSensitiveFields(123)).toBe(123);
    expect(stripSensitiveFields(testDate)).toBe(testDate);
  });
});
