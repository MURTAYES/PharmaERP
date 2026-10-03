import { describe, it, expect } from 'vitest';
import { calculateRefundPricing } from '../utils/pricingEngine.js';

describe('Refund Pricing Engine', () => {
  it('calculates full refund with 0 discount and 0 charges', () => {
    const returnedLines = [
      { unitPricePerPiece: '10.0000', returnedQuantityPieces: 5 }, // 50.00
      { unitPricePerPiece: '5.0000', returnedQuantityPieces: 10 }, // 50.00
    ];
    const origSubtotal = '100.00';
    const origDiscount = '0.00';
    const origCharges: any[] = [];

    const result = calculateRefundPricing(returnedLines, origSubtotal, origDiscount, origCharges);

    expect(result.subtotalRefund).toBe('100.00');
    expect(result.discountRefund).toBe('0.00');
    expect(result.grandTotalRefund).toBe('100.00');
  });

  it('calculates proportional discount reduction on partial return', () => {
    // Original sale: Subtotal 200, Flat Discount 20 (10% eff), Net 180
    // Customer returns 50 value (25% of subtotal)
    // Proportional discount reduction: 20 * (50/200) = 5.00
    // Grand total refund = 50 - 5 = 45.00
    const returnedLines = [
      { unitPricePerPiece: '2.5000', returnedQuantityPieces: 20 }, // 50.00
    ];
    const origSubtotal = '200.00';
    const origDiscount = '20.00';
    const origCharges: any[] = [];

    const result = calculateRefundPricing(returnedLines, origSubtotal, origDiscount, origCharges);

    expect(result.subtotalRefund).toBe('50.00');
    expect(result.discountRefund).toBe('5.00');
    expect(result.netRefundAfterDiscount).toBe('45.00');
    expect(result.grandTotalRefund).toBe('45.00');
  });

  it('calculates proportional percentage charges and ignores fixed charges', () => {
    // Original sale: Subtotal 100, 5% VAT = 5.00, 10 fixed Delivery = 10.00
    // Return: 50.00 value
    // VAT refunded on 50 = 50 * 5% = 2.50
    // Fixed Delivery refund = 0.00
    // Grand total refund = 50 + 2.50 = 52.50
    const returnedLines = [
      { unitPricePerPiece: '5.0000', returnedQuantityPieces: 10 }, // 50.00
    ];
    const origSubtotal = '100.00';
    const origDiscount = '0.00';
    const origCharges = [
      { name: 'VAT', type: 'percentage' as const, rate: 5 },
      { name: 'Delivery Fee', type: 'fixed' as const, rate: 10 },
    ];

    const result = calculateRefundPricing(returnedLines, origSubtotal, origDiscount, origCharges);

    expect(result.subtotalRefund).toBe('50.00');
    expect(result.discountRefund).toBe('0.00');
    expect(result.chargesRefund).toEqual([
      { name: 'VAT', type: 'percentage', rate: '5.00', refundAmount: '2.50' },
      { name: 'Delivery Fee', type: 'fixed', rate: '10.00', refundAmount: '0.00' },
    ]);
    expect(result.totalChargesRefund).toBe('2.50');
    expect(result.grandTotalRefund).toBe('52.50');
  });
});
