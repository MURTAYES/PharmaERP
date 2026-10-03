import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { Batch, IBatch } from '../models/Batch.js';
import { Item } from '../models/Item.js';
import { StockMovement } from '../models/StockMovement.js';
import { parseExpiryDate } from '../utils/dateUtils.js';
import { createAuditLog } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const receiveBatchSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  batchNumber: z.string().min(1, 'Batch number is required').trim().toUpperCase(),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  unit: z.enum(['piece', 'strip', 'box']).default('piece'),
  quantity: z.number().int('Quantity must be a whole number (no fractions)').positive('Quantity must be greater than 0'),
  purchasePrice: z.union([z.string(), z.number()]).optional(),
  supplierName: z.string().trim().optional(),
});

export const updateCostSchema = z.object({
  purchasePrice: z.union([z.string(), z.number()]).refine(
    (val) => {
      try {
        const d = new Decimal(val);
        return d.gte(0);
      } catch {
        return false;
      }
    },
    { message: 'Purchase price must be a valid non-negative number' }
  ),
  unit: z.enum(['piece', 'strip', 'box']).default('piece'),
});

/**
 * Receive incoming batch stock with unit conversion, duplicate merging, and cost-missing workflow
 */
export async function receiveBatch(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const validated = receiveBatchSchema.parse(req.body);

    if (!mongoose.Types.ObjectId.isValid(validated.itemId)) {
      res.status(400).json({ error: 'Invalid item ID' });
      return;
    }

    const item = await Item.findById(validated.itemId);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    let parsedExpiry: Date;
    try {
      parsedExpiry = parseExpiryDate(validated.expiryDate);
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Invalid expiry date format' });
      return;
    }

    // Convert receiving quantity into base pieces
    const pcsPerStrip = item.unitHierarchy?.piecesPerStrip || 1;
    const stripsPerBox = item.unitHierarchy?.stripsPerBox || 1;
    const totalPcsPerBox = pcsPerStrip * stripsPerBox;

    let totalPieces = 0;
    if (validated.unit === 'piece') {
      totalPieces = validated.quantity;
    } else if (validated.unit === 'strip') {
      totalPieces = validated.quantity * pcsPerStrip;
    } else if (validated.unit === 'box') {
      totalPieces = validated.quantity * totalPcsPerBox;
    }

    // Cost calculation (Owner only, or cost-missing if omitted/pharmacist)
    const isOwner = req.user?.role === 'owner';
    let purchasePricePerPiece: mongoose.Types.Decimal128 | undefined = undefined;
    let isCostMissing = true;

    if (isOwner && validated.purchasePrice !== undefined && validated.purchasePrice !== '') {
      const enteredPrice = new Decimal(validated.purchasePrice);
      let costPerPiece = enteredPrice;

      if (validated.unit === 'strip') {
        costPerPiece = enteredPrice.dividedBy(pcsPerStrip);
      } else if (validated.unit === 'box') {
        costPerPiece = enteredPrice.dividedBy(totalPcsPerBox);
      }

      purchasePricePerPiece = mongoose.Types.Decimal128.fromString(costPerPiece.toFixed(4));
      isCostMissing = false;
    }

    // Deduplication & Merging: Check for existing batch matching itemId, batchNumber, expiryDate
    let batch = await Batch.findOne({
      itemId: item._id,
      batchNumber: validated.batchNumber,
      expiryDate: parsedExpiry,
    });

    let isMerged = false;

    if (batch) {
      // Merge into existing batch
      batch.qtySellable += totalPieces;
      if (validated.supplierName) {
        batch.supplierName = validated.supplierName;
      }
      if (!isCostMissing && purchasePricePerPiece) {
        batch.purchasePricePerPiece = purchasePricePerPiece;
        batch.isCostMissing = false;
      }
      await batch.save();
      isMerged = true;
    } else {
      // Create new batch record
      batch = new Batch({
        itemId: item._id,
        batchNumber: validated.batchNumber,
        expiryDate: parsedExpiry,
        qtySellable: totalPieces,
        qtyDamaged: 0,
        qtyExpired: 0,
        purchasePricePerPiece,
        isCostMissing,
        supplierName: validated.supplierName || '',
      });
      await batch.save();
    }

    // Record immutable StockMovement ledger entry
    const movement = new StockMovement({
      batchId: batch._id,
      itemId: item._id,
      type: 'RECEIVE',
      qtyChangePieces: totalPieces,
      bucketTo: 'sellable',
      reasonCategory: 'Initial Stock',
      reasonDetail: `Received ${validated.quantity} ${validated.unit}(s) [${totalPieces} pieces]${
        isMerged ? ' (Merged into existing batch)' : ''
      }`,
      userId: req.user?.userId ? new mongoose.Types.ObjectId(req.user.userId) : new mongoose.Types.ObjectId(),
    });
    await movement.save();

    // Record Audit Log
    await createAuditLog({
      action: isMerged ? 'BATCH_MERGED_RECEIVE' : 'BATCH_RECEIVED',
      entity: 'Batch',
      entityId: batch._id.toString(),
      user: req.user,
      details: {
        itemCode: item.itemCode,
        tradeName: item.tradeName,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantityReceivedPieces: totalPieces,
        unit: validated.unit,
        quantityEntered: validated.quantity,
        isCostMissing: batch.isCostMissing,
      },
    });

    res.status(isMerged ? 200 : 201).json({
      message: isMerged
        ? `Added ${totalPieces} pieces to existing batch ${batch.batchNumber}`
        : `Created new batch ${batch.batchNumber} with ${totalPieces} pieces`,
      batch: batch.toJSON(),
      isMerged,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to receive batch' });
  }
}

/**
 * List batches for a specific item (sorted by FEFO)
 */
export async function getBatchesByItem(req: Request, res: Response): Promise<void> {
  try {
    const { itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      res.status(400).json({ error: 'Invalid item ID' });
      return;
    }

    const batches = await Batch.find({ itemId }).sort({ expiryDate: 1 });
    res.json({ batches: batches.map((b: any) => b.toJSON()) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch batches' });
  }
}

/**
 * Update purchase cost for a batch (Owner only)
 */
export async function updateBatchCost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid batch ID' });
      return;
    }

    const validated = updateCostSchema.parse(req.body);
    const batch = await Batch.findById(id).populate('itemId');
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }

    const item = batch.itemId as any;
    const pcsPerStrip = item?.unitHierarchy?.piecesPerStrip || 1;
    const stripsPerBox = item?.unitHierarchy?.stripsPerBox || 1;
    const totalPcsPerBox = pcsPerStrip * stripsPerBox;

    const enteredPrice = new Decimal(validated.purchasePrice);
    let costPerPiece = enteredPrice;

    if (validated.unit === 'strip') {
      costPerPiece = enteredPrice.dividedBy(pcsPerStrip);
    } else if (validated.unit === 'box') {
      costPerPiece = enteredPrice.dividedBy(totalPcsPerBox);
    }

    const previousCost = batch.purchasePricePerPiece?.toString();
    batch.purchasePricePerPiece = mongoose.Types.Decimal128.fromString(costPerPiece.toFixed(4));
    batch.isCostMissing = false;
    await batch.save();

    await createAuditLog({
      action: 'BATCH_COST_UPDATED',
      entity: 'Batch',
      entityId: batch._id.toString(),
      user: req.user,
      details: {
        batchNumber: batch.batchNumber,
        previousCost,
        updatedCostPerPiece: costPerPiece.toFixed(4),
        unitUsed: validated.unit,
      },
    });

    res.json({
      message: 'Batch cost updated successfully',
      batch: batch.toJSON(),
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to update batch cost' });
  }
}
