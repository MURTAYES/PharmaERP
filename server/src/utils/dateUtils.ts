/**
 * Utility to parse expiry date strings into Date objects.
 * Supports:
 * - 'MM/YYYY' (e.g. '11/2027' -> end of November 2027)
 * - 'DD/MM/YYYY' (e.g. '15/11/2027' -> 15th of November 2027)
 * - ISO string or Date object
 */
export function parseExpiryDate(input: string | Date): Date {
  if (input instanceof Date) {
    return input;
  }

  if (typeof input !== 'string') {
    throw new Error('Invalid expiry date format');
  }

  const trimmed = input.trim();

  // Pattern: YYYY-MM (e.g. '2027-11' from HTML5 month picker)
  const yyyymmMatch = trimmed.match(/^(\d{4})-(\d{1,2})$/);
  if (yyyymmMatch) {
    const year = parseInt(yyyymmMatch[1], 10);
    const month = parseInt(yyyymmMatch[2], 10);
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 01 and 12');
    }
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));
  }

  // Pattern: MM/YYYY or M/YYYY
  const mmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmyyyyMatch) {
    const month = parseInt(mmyyyyMatch[1], 10);
    const year = parseInt(mmyyyyMatch[2], 10);
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 01 and 12');
    }
    // Get last day of the month by setting day 0 of the next month
    const lastDay = new Date(year, month, 0).getDate();
    return new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999));
  }

  // Pattern: DD/MM/YYYY
  const ddmmyyyyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10);
    const year = parseInt(ddmmyyyyMatch[3], 10);
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 01 and 12');
    }
    const maxDays = new Date(year, month, 0).getDate();
    if (day < 1 || day > maxDays) {
      throw new Error(`Day must be between 01 and ${maxDays} for month ${month}`);
    }
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  }

  // ISO string fallback
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) {
    throw new Error('Invalid date string format. Use DD/MM/YYYY or MM/YYYY');
  }
  return parsed;
}

/**
 * Categorize expiry status into tiers based on alert thresholds
 */
export function getExpiryTier(
  expiryDate: Date,
  windows: { greenDays: number; yellowDays: number; redDays: number } = {
    greenDays: 90,
    yellowDays: 60,
    redDays: 30,
  }
): 'expired' | 'critical' | 'warning' | 'notice' | 'normal' {
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return 'expired';
  }
  if (diffDays <= windows.redDays) {
    return 'critical'; // <30 days
  }
  if (diffDays <= windows.yellowDays) {
    return 'warning'; // 30-60 days
  }
  if (diffDays <= windows.greenDays) {
    return 'notice'; // 60-90 days
  }
  return 'normal';
}
