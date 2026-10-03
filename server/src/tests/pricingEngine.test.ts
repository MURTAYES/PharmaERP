import { describe, it, expect } from 'vitest';
import {
  calculateLineItem,
  calculateInvoiceTotals,
  calculateChangeDue,
} from '../utils/pricingEngine.js';

describe('Pricing Engine with Decimal.js', () => {
  it('calculates line items for pieces, strips, and boxes correctly without float artifacts', () => {
    const hierarchy = { piecesPerStrip: 10, stripsPerBox: 10 }; // 100 pcs/box

    // 5 pieces at 2.50
    const itemPiece = calculateLineItem({
      unitPrice: '2.50',
      quantity: 5,
      unit: 'piece',
      unitHierarchy: hierarchy,
    });
    expect(itemPiece.quantity).toBe(5);
    expect(itemPiece.quantityPieces).toBe(5);
    expect(itemPiece.unitPrice).toBe('2.50');
    expect(itemPiece.unitPricePerPiece).toBe('2.5000');
    expect(itemPiece.lineTotal).toBe('12.50');

    // 2 strips at 25.00
    const itemStrip = calculateLineItem({
      unitPrice: '25.00',
      quantity: 2,
      unit: 'strip',
      unitHierarchy: hierarchy,
    });
    expect(itemStrip.quantity).toBe(2);
    expect(itemStrip.quantityPieces).toBe(20);
    expect(itemStrip.unitPrice).toBe('25.00');
    expect(itemStrip.unitPricePerPiece).toBe('2.5000');
    expect(itemStrip.lineTotal).toBe('50.00');

    // 1 box at 250.00
    const itemBox = calculateLineItem({
      unitPrice: '250.00',
      quantity: 1,
      unit: 'box',
      unitHierarchy: hierarchy,
    });
    expect(itemBox.quantity).toBe(1);
    expect(itemBox.quantityPieces).toBe(100);
    expect(itemBox.unitPrice).toBe('250.00');
    expect(itemBox.unitPricePerPiece).toBe('2.5000');
    expect(itemBox.lineTotal).toBe('250.00');
  });

  it('computes subtotal, percentage discounts, and global charges accurately', () => {
    const lines = [
      { lineTotal: '100.00' },
      { lineTotal: '200.00' },
      { lineTotal: '50.00' },
    ];
    // Subtotal: 350.00
    // Discount: 10% -> 35.00
    // Net after discount: 315.00
    // Charges: 5% VAT (15.75) + ৳ 10.00 fixed bag fee
    // Grand Total: 315.00 + 15.75 + 10.00 = 340.75
    const totals = calculateInvoiceTotals(lines, '10.00', [
      { name: 'VAT', type: 'percentage', rate: '5.00', isActive: true },
      { name: 'Eco Bag Fee', type: 'fixed', rate: '10.00', isActive: true },
      { name: 'Inactive Charge', type: 'fixed', rate: '50.00', isActive: false },
    ]);

    expect(totals.subtotal).toBe('350.00');
    expect(totals.discountPercent).toBe('10.00');
    expect(totals.discountAmount).toBe('35.00');
    expect(totals.netAfterDiscount).toBe('315.00');
    expect(totals.charges).toHaveLength(2);
    expect(totals.charges[0].amount).toBe('15.75');
    expect(totals.charges[1].amount).toBe('10.00');
    expect(totals.totalCharges).toBe('25.75');
    expect(totals.grandTotal).toBe('340.75');
  });

  it('performs correct 2dp round-half-up on fractional grand totals', () => {
    // Subtotal: 33.33, 0% discount, 5% VAT = 1.6665 -> Grand Total = 34.9965 -> rounded half up = 35.00
    const totals = calculateInvoiceTotals([{ lineTotal: '33.33' }], 0, [
      { name: 'VAT', type: 'percentage', rate: '5.00', isActive: true },
    ]);
    expect(totals.subtotal).toBe('33.33');
    expect(totals.totalCharges).toBe('1.67');
    expect(totals.grandTotal).toBe('35.00');
  });

  it('calculates cash change due accurately', () => {
    const change1 = calculateChangeDue('340.00', '500.00');
    expect(change1.isSufficient).toBe(true);
    expect(change1.changeDue).toBe('160.00');
    expect(change1.balanceRemaining).toBe('0.00');

    const change2 = calculateChangeDue('340.00', '300.00');
    expect(change2.isSufficient).toBe(false);
    expect(change2.changeDue).toBe('0.00');
    expect(change2.balanceRemaining).toBe('40.00');
  });
});
