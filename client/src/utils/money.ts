import Decimal from 'decimal.js';

export type DecimalInstance = InstanceType<typeof Decimal>;

/**
 * Strips out currency symbols, whitespace, and non-numeric characters (except '-' and '.').
 */
export function cleanNumericString(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  // Strip out currency symbols like ৳, $, commas, etc.
  const cleaned = str.replace(/[^0-9.-]/g, '');
  return cleaned;
}

/**
 * Safely parse a value into a floating number, returning fallback if invalid or NaN.
 */
export function parseMoney(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? fallback : val;
  }
  const cleaned = cleanNumericString(val);
  if (!cleaned) return fallback;
  const num = parseFloat(cleaned);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}

/**
 * Safely creates a Decimal instance without throwing on invalid, empty, or NaN inputs.
 */
export function safeDecimal(val: any, fallback = '0'): DecimalInstance {
  try {
    if (val === null || val === undefined) return new Decimal(fallback);
    if (val instanceof Decimal) return val;
    const cleaned = cleanNumericString(val);
    if (!cleaned) return new Decimal(fallback);
    return new Decimal(cleaned);
  } catch {
    return new Decimal(fallback);
  }
}

/**
 * Formats any input (number, string, Decimal, with or without currency signs) into a 2dp formatted string like '12.50'.
 * Never returns 'NaN'.
 */
export function formatMoney(val: any, decimals = 2, fallback = '0.00'): string {
  const num = parseMoney(val, NaN);
  if (isNaN(num)) return fallback;
  return num.toFixed(decimals);
}
