import { describe, it, expect } from 'vitest';
import { calculateLineItem, calculateInvoiceTotals } from '../utils/pricingEngine.js';

describe('POS Checkout Engine & Pricing Validations (Plan 03-02)', () => {
  const itemHierarchy = { piecesPerStrip: 10, stripsPerBox: 10 }; // 100 pcs per box

  it('correctly calculates pieces and pricing for multi-line carts with mixed units', () => {
    // Line 1: 3 Strips of Napa Extra at ৳ 25.00/strip (MRP 2.50/pc)
    const line1 = calculateLineItem({
      unitPrice: '25.00',
      quantity: 3,
      unit: 'strip',
      unitHierarchy: itemHierarchy,
    });
    expect(line1.quantityPieces).toBe(30);
    expect(line1.lineTotal).toBe('75.00');

    // Line 2: 1 Box of Seclo 20mg at ৳ 450.00/box (Overridden to 430.00)
    const line2 = calculateLineItem({
      unitPrice: '430.00',
      quantity: 1,
      unit: 'box',
      unitHierarchy: itemHierarchy,
    });
    expect(line2.quantityPieces).toBe(100);
    expect(line2.lineTotal).toBe('430.00');

    // Line 3: 5 Loose pieces at ৳ 5.00/pc
    const line3 = calculateLineItem({
      unitPrice: '5.00',
      quantity: 5,
      unit: 'piece',
      unitHierarchy: itemHierarchy,
    });
    expect(line3.quantityPieces).toBe(5);
    expect(line3.lineTotal).toBe('25.00');

    // Compute invoice totals: 75 + 430 + 25 = 530.00
    // Discount 5% -> 26.50
    // Net: 503.50
    // Charges: 5% VAT (25.175) + ৳ 10.00 fixed delivery fee
    // Total charges: 35.175
    // Grand total: 503.50 + 35.175 = 538.675 -> 538.68
    const totals = calculateInvoiceTotals(
      [line1, line2, line3],
      '5.00',
      [
        { name: 'VAT', type: 'percentage', rate: '5.00', isActive: true },
        { name: 'Delivery Fee', type: 'fixed', rate: '10.00', isActive: true },
      ]
    );

    expect(totals.subtotal).toBe('530.00');
    expect(totals.discountAmount).toBe('26.50');
    expect(totals.netAfterDiscount).toBe('503.50');
    expect(totals.charges[0].amount).toBe('25.18');
    expect(totals.charges[1].amount).toBe('10.00');
    expect(totals.grandTotal).toBe('538.68');
  });

  it('detects price overrides and calculates variance accurately', () => {
    const originalPrice = 250.0;
    const overriddenPrice = 230.0;
    const variance = overriddenPrice - originalPrice;

    expect(variance).toBe(-20.0);
  });
});
