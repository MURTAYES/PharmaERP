import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';

describe('Specialized Reports Calculations', () => {
  it('computes Gross Profit and Margin % accurately', () => {
    const revenue = new Decimal('1500.00');
    const cost = new Decimal('1100.00');

    const grossProfit = revenue.minus(cost);
    const marginPercent = grossProfit.dividedBy(revenue).times(100).toDecimalPlaces(1).toNumber();

    expect(grossProfit.toFixed(2)).toBe('400.00');
    expect(marginPercent).toBe(26.7);
  });

  it('computes stock valuation delta (Potential Gross Profit)', () => {
    const retailVal = new Decimal('25000.00');
    const costVal = new Decimal('19500.00');

    const potentialGrossProfit = retailVal.minus(costVal);
    expect(potentialGrossProfit.toFixed(2)).toBe('5500.00');
  });
});
