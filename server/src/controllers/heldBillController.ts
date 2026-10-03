import { Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { HeldBill } from '../models/HeldBill.js';
import { getNextSequence } from '../models/Counter.js';

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

/**
 * POST /api/pos/held-bills
 * Holds active cart to database with user attribution.
 */
export async function saveHeldBill(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createHeldBillSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Invalid held bill payload',
        details: parseResult.error.format(),
      });
      return;
    }

    const { customerName, customerPhone, lines, discountPercent, notes } = parseResult.data;

    // Generate short reference code
    const billReference = await getNextSequence('heldBillNumber', 'HOLD', 4);

    const heldBill = await HeldBill.create({
      billReference,
      heldBy: new Types.ObjectId(req.user!.userId),
      heldByName: req.user!.username,
      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,
      lines,
      discountPercent,
      notes: notes?.trim() || undefined,
    });

    res.status(201).json({
      message: 'Bill held successfully',
      heldBill,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to hold bill' });
  }
}

/**
 * GET /api/pos/held-bills
 * Lists active held bills.
 */
export async function getHeldBills(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const heldBills = await HeldBill.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({ heldBills });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch held bills' });
  }
}

/**
 * GET /api/pos/held-bills/:id
 * Fetches a single held bill by ID.
 */
export async function getHeldBillById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid held bill ID' });
      return;
    }

    const heldBill = await HeldBill.findById(id).lean();
    if (!heldBill) {
      res.status(404).json({ error: 'Held bill not found' });
      return;
    }

    res.json({ heldBill });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch held bill' });
  }
}

/**
 * DELETE /api/pos/held-bills/:id
 * Removes a held bill after resume/checkout or manual discard.
 */
export async function deleteHeldBill(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid held bill ID' });
      return;
    }

    const deleted = await HeldBill.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ error: 'Held bill not found' });
      return;
    }

    res.json({ message: 'Held bill discarded/resumed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete held bill' });
  }
}
