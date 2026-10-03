import { describe, it, expect } from 'vitest';
import { getExpiryTier } from '../utils/dateUtils.js';

describe('Expiry Tier Classification (Plan 02-03)', () => {
  const windows = { greenDays: 90, yellowDays: 60, redDays: 30 };

  it('classifies expired dates correctly', () => {
    const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(getExpiryTier(pastDate, windows)).toBe('expired');
  });

  it('classifies critical (<30d) tier correctly', () => {
    const criticalDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    expect(getExpiryTier(criticalDate, windows)).toBe('critical');
  });

  it('classifies warning (30-60d) tier correctly', () => {
    const warningDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
    expect(getExpiryTier(warningDate, windows)).toBe('warning');
  });

  it('classifies notice (60-90d) tier correctly', () => {
    const noticeDate = new Date(Date.now() + 75 * 24 * 60 * 60 * 1000);
    expect(getExpiryTier(noticeDate, windows)).toBe('notice');
  });

  it('classifies normal (>90d) tier correctly', () => {
    const normalDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000);
    expect(getExpiryTier(normalDate, windows)).toBe('normal');
  });
});
