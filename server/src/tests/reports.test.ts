import { describe, it, expect } from 'vitest';
import { resolveDhakaDateRange } from '../services/reportService.js';

describe('Report Timezone & Pipeline Utilities', () => {
  it('correctly resolves start and end dates with Asia/Dhaka (+06:00) offset', () => {
    const { start, end } = resolveDhakaDateRange('2026-10-01', '2026-10-03');

    expect(start).not.toBeNull();
    expect(end).not.toBeNull();

    // Verify UTC timestamps correspond to Dhaka midnight and end of day
    expect(start!.toISOString()).toBe('2026-09-30T18:00:00.000Z'); // 2026-10-01 00:00 Dhaka is 18:00 prev day UTC
    expect(end!.toISOString()).toBe('2026-10-03T17:59:59.999Z'); // 2026-10-03 23:59:59.999 Dhaka is 17:59:59.999 UTC
  });

  it('handles optional single-sided date queries', () => {
    const { start, end } = resolveDhakaDateRange('2026-10-01', undefined);
    expect(start).not.toBeNull();
    expect(end).toBeNull();
  });
});
