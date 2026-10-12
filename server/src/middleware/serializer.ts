import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

export const SENSITIVE_PHARMACIST_FIELDS = new Set([
  'purchasePrice',
  'purchasePricePerPiece',
  'purchaseCostPerPiece',
  'cost',
  'costPrice',
  'unitCost',
  'profit',
  'grossProfit',
  'totalProfit',
  'stockValuation',
  'valuationAtCost',
  'costValuation',
  'margin',
  'marginPercent',
  'purchaseTotal',
  'totalCost',
]);

export function serializeDecimals(data: any): any {
  if (data === null || data === undefined) return data;

  // Handle BSON Decimal128 or Mongoose Decimal128
  if (data._bsontype === 'Decimal128' || data.constructor?.name === 'Decimal128') {
    return data.toString();
  }

  // Handle MongoDB $numberDecimal JSON format
  if (typeof data === 'object' && '$numberDecimal' in data) {
    return String(data.$numberDecimal);
  }

  if (data instanceof Date) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeDecimals(item));
  }

  if (typeof data === 'object') {
    const source = typeof data.toJSON === 'function' ? data.toJSON() : data;
    if (source._bsontype === 'Decimal128' || source.constructor?.name === 'Decimal128') {
      return source.toString();
    }
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(source)) {
      result[key] = serializeDecimals(value);
    }
    return result;
  }

  return data;
}

export function stripSensitiveFields(data: any, role: string = 'pharmacist'): any {
  if (role === 'owner') return data;
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => stripSensitiveFields(item, role));
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    // Handle Mongoose documents converted or raw
    const source = typeof data.toJSON === 'function' ? data.toJSON() : data;
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(source)) {
      if (!SENSITIVE_PHARMACIST_FIELDS.has(key)) {
        sanitized[key] = stripSensitiveFields(value, role);
      }
    }
    return sanitized;
  }

  return data;
}

export function responseSerializer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = (body: any): Response => {
    let processed = serializeDecimals(body);
    if (req.user && req.user.role === 'pharmacist') {
      processed = stripSensitiveFields(processed);
    }
    return originalJson(processed);
  };

  next();
}

export const serializerMiddleware = responseSerializer;
