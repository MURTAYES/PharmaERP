import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const heldBillLineSchema = z.object({
  itemId: z.string().min(1),
  tradeName: z.string().min(1),
  genericName: z.string().min(1),
  batchId: z.string().min(1),
  batchNumber: z.string().min(1),
  expiryDate: z.string().min(1),
  unit: z.enum(['piece', 'strip', 'box']),
  unitHierarchy: z.object({
    piecesPerStrip: z.number().int().min(1),
    stripsPerBox: z.number().int().min(1),
  }),
  quantity: z.number().int().positive(),
  quantityPieces: z.number().int().positive(),
  unitPrice: z.string(),
  mrpPerPiece: z.string(),
  isPriceOverridden: z.boolean().default(false),
  originalUnitPrice: z.string().optional(),
  isNonFefo: z.boolean().default(false),
  suggestedFefoBatchNumber: z.string().optional(),
});

const createHeldBillSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  lines: z.array(heldBillLineSchema).min(1, 'Cart cannot be empty'),
  discountPercent: z.string().default('0.00'),
  notes: z.string().optional(),
});

describe('Held Bills Schema Validation (Plan 03-03)', () => {
  it('validates saving a draft cart to held bills', () => {
    const validPayload = {
      customerName: 'Karim Ahmed',
      customerPhone: '01711223344',
      lines: [
        {
          itemId: 'item123',
          tradeName: 'Napa Extra',
          genericName: 'Paracetamol + Caffeine',
          batchId: 'batch456',
          batchNumber: 'B-998',
          expiryDate: '2027-11-30',
          unit: 'strip' as const,
          unitHierarchy: { piecesPerStrip: 12, stripsPerBox: 10 },
          quantity: 2,
          quantityPieces: 24,
          unitPrice: '30.00',
          mrpPerPiece: '2.50',
          isPriceOverridden: false,
          isNonFefo: false,
        },
      ],
      discountPercent: '5.00',
      notes: 'Customer stepped out for ATM',
    };

    const parsed = createHeldBillSchema.parse(validPayload);
    expect(parsed.customerName).toBe('Karim Ahmed');
    expect(parsed.lines).toHaveLength(1);
    expect(parsed.lines[0].quantityPieces).toBe(24);
    expect(parsed.notes).toBe('Customer stepped out for ATM');
  });

  it('rejects empty held bill carts', () => {
    expect(() =>
      createHeldBillSchema.parse({
        lines: [],
      })
    ).toThrow();
  });
});
