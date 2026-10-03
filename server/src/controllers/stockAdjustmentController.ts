import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Batch } from '../models/Batch';
import { Item } from '../models/Item';
import { StockMovement } from '../models/StockMovement';
import { createAuditLog } from '../services/auditService';

export const transferStockSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
  fromBucket: z.enum(['sellable', 'damaged', 'expired']),
  toBucket: z.enum(['sellable', 'damaged', 'expired']),
  quantityPieces: z.number().int().positive('Quantity must be an integer greater than 0'),
  reasonCategory: z.enum([
    'Damaged in Transit',
    'Shelf Spill/Breakage',
    'Physical Count Audit Variance',
    'Customer Return Quarantine',
    'Expired Stock Quarantine',
    'Supplier Return Prep',
    'Direct Adjustment',
  ]),
  reasonDetail: z.string().min(3, 'Detailed reason note is required for stock adjustments').trim(),
});

export const writeOffStockSchema = z.object({
  batchId: z.string().min(1, 'Batch ID is required'),
  fromBucket: z.enum(['damaged', 'expired']),
  quantityPieces: z.number().int().positive('Quantity must be an integer greater than 0'),
  reasonCategory: z.enum([
    'Damaged in Transit',
    'Shelf Spill/Breakage',
    'Physical Count Audit Variance',
    'Expired Stock Quarantine',
    'Direct Adjustment',
  ]),
  reasonDetail: z.string().min(3, 'Detailed reason note is required for stock write-offs').trim(),
});

/**
 * Transfer stock between buckets (Owner only)
 */
export async function transferStock(req: Request, res: Response): Promise<void> {
  try {
    const validated = transferStockSchema.parse(req.body);

    if (validated.fromBucket === validated.toBucket) {
      res.status(400).json({ error: 'Source and destination buckets must be different' });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(validated.batchId)) {
      res.status(400).json({ error: 'Invalid batch ID' });
      return;
    }

    const batch = await Batch.findById(validated.batchId);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    const sourceField =
      validated.fromBucket === 'sellable'
        ? 'qtySellable'
        : validated.fromBucket === 'damaged'
        ? 'qtyDamaged'
        : 'qtyExpired';

    const targetField =
      validated.toBucket === 'sellable'
        ? 'qtySellable'
        : validated.toBucket === 'damaged'
        ? 'qtyDamaged'
        : 'qtyExpired';

    const currentQty = (batch as any)[sourceField] || 0;
    if (currentQty < validated.quantityPieces) {
      res.status(400).json({
        error: `Insufficient quantity in ${validated.fromBucket} bucket (available: ${currentQty}, requested: ${validated.quantityPieces})`,
      });
      return;
    }

    // Update batch balances
    (batch as any)[sourceField] -= validated.quantityPieces;
    (batch as any)[targetField] += validated.quantityPieces;
    await batch.save();

    // Record immutable movement ledger entry
    const movement = new StockMovement({
      batchId: batch._id,
      itemId: batch.itemId,
      type: 'ADJUST_TRANSFER',
      qtyChangePieces: validated.quantityPieces,
      bucketFrom: validated.fromBucket,
      bucketTo: validated.toBucket,
      reasonCategory: validated.reasonCategory,
      reasonDetail: validated.reasonDetail,
      userId: req.user?._id || new mongoose.Types.ObjectId(),
    });
    await movement.save();

    // Record Audit Log
    await createAuditLog({
      action: 'STOCK_BUCKET_TRANSFERRED',
      entity: 'Batch',
      entityId: batch._id.toString(),
      user: req.user,
      details: {
        batchNumber: batch.batchNumber,
        fromBucket: validated.fromBucket,
        toBucket: validated.toBucket,
        quantityPieces: validated.quantityPieces,
        reasonCategory: validated.reasonCategory,
        reasonDetail: validated.reasonDetail,
      },
    });

    res.json({
      message: `Successfully transferred ${validated.quantityPieces} pieces from ${validated.fromBucket} to ${validated.toBucket}`,
      batch: batch.toJSON(),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to transfer stock' });
  }
}

/**
 * Write off damaged or expired stock (Owner only)
 */
export async function writeOffStock(req: Request, res: Response): Promise<void> {
  try {
    const validated = writeOffStockSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(validated.batchId)) {
      res.status(400).json({ error: 'Invalid batch ID' });
      return;
    }

    const batch = await Batch.findById(validated.batchId);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    const sourceField = validated.fromBucket === 'damaged' ? 'qtyDamaged' : 'qtyExpired';
    const currentQty = (batch as any)[sourceField] || 0;

    if (currentQty < validated.quantityPieces) {
      res.status(400).json({
        error: `Insufficient quantity in ${validated.fromBucket} bucket to write off (available: ${currentQty}, requested: ${validated.quantityPieces})`,
      });
      return;
    }

    // Deduct from bucket
    (batch as any)[sourceField] -= validated.quantityPieces;
    await batch.save();

    // Record movement
    const movement = new StockMovement({
      batchId: batch._id,
      itemId: batch.itemId,
      type: 'WRITE_OFF',
      qtyChangePieces: -validated.quantityPieces,
      bucketFrom: validated.fromBucket,
      bucketTo: 'write_off',
      reasonCategory: validated.reasonCategory,
      reasonDetail: validated.reasonDetail,
      userId: req.user?._id || new mongoose.Types.ObjectId(),
    });
    await movement.save();

    // Record Audit Log
    await createAuditLog({
      action: 'STOCK_WRITTEN_OFF',
      entity: 'Batch',
      entityId: batch._id.toString(),
      user: req.user,
      details: {
        batchNumber: batch.batchNumber,
        fromBucket: validated.fromBucket,
        quantityWrittenOff: validated.quantityPieces,
        reasonCategory: validated.reasonCategory,
        reasonDetail: validated.reasonDetail,
      },
    });

    res.json({
      message: `Successfully written off ${validated.quantityPieces} pieces from ${validated.fromBucket}`,
      batch: batch.toJSON(),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to write off stock' });
  }
}

/**
 * Get stock movement ledger history
 */
export async function getStockMovements(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 30;
    const itemId = req.query.itemId as string;
    const batchId = req.query.batchId as string;
    const type = req.query.type as string;

    const query: Record<string, any> = {};
    if (itemId && mongoose.Types.ObjectId.isValid(itemId)) query.itemId = itemId;
    if (batchId && mongoose.Types.ObjectId.isValid(batchId)) query.batchId = batchId;
    if (type) query.type = type;

    const total = await StockMovement.countDocuments(query);
    const movements = await StockMovement.find(query)
      .populate('itemId', 'tradeName genericName itemCode')
      .populate('batchId', 'batchNumber expiryDate')
      .populate('userId', 'username fullName role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      movements,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch stock movements' });
  }
}
