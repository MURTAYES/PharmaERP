import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

export const SENSITIVE_PHARMACIST_FIELDS = new Set([
  'purchasePrice',
  'purchasePricePerPiece',
  'cost',
  'costPrice',
  'unitCost',
  'profit',
  'totalProfit',
  'stockValuation',
  'valuationAtCost',
  'margin',
  'purchaseTotal',
  'totalCost',
]);

export function stripSensitiveFields(data: any): any {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => stripSensitiveFields(item));
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    // Handle Mongoose documents converted or raw
    const source = typeof data.toJSON === 'function' ? data.toJSON() : data;
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(source)) {
      if (!SENSITIVE_PHARMACIST_FIELDS.has(key)) {
        sanitized[key] = stripSensitiveFields(value);
      }
    }
    return sanitized;
  }

  return data;
}

export function responseSerializer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = (body: any): Response => {
    if (req.user && req.user.role === 'pharmacist') {
      const sanitized = stripSensitiveFields(body);
      return originalJson(sanitized);
    }
    return originalJson(body);
  };

  next();
}
