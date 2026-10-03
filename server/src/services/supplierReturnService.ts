import mongoose, { Types } from 'mongoose';
import Decimal from 'decimal.js';
import { SupplierReturn, ISupplierReturn, ISupplierReturnLineItem } from '../models/SupplierReturn.js';
import { Batch } from '../models/Batch.js';
import { Item } from '../models/Item.js';
import { StockMovement } from '../models/StockMovement.js';
import { getNextSequence } from '../models/Counter.js';

export interface SupplierReturnItemInput {
  batchId: string;
  fromBucket: 'damaged' | 'expired';
  quantityPieces: number;
}

export interface CreateSupplierReturnInput {
  supplierName: string;
  supplierInvoiceRef?: string;
  lines: SupplierReturnItemInput[];
  reasonCategory: string;
  reasonDetail: string;
  userId: string;
  userName: string;
}

export class SupplierReturnService {
  /**
   * Processes a supplier return voucher atomically:
   * Deducts stock from damaged/expired buckets with $gte guard.
   */
  async createSupplierReturn(input: CreateSupplierReturnInput): Promise<{ supplierReturn: ISupplierReturn }> {
    if (!input.lines || input.lines.length === 0) {
      throw new Error('At least one batch line must be returned to supplier');
    }

    if (!input.supplierName?.trim()) {
      throw new Error('Supplier name is required');
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const returnLines: ISupplierReturnLineItem[] = [];
      let totalQty = 0;
      let totalEstimatedCostDec = new Decimal(0);

      for (const itemInput of input.lines) {
        const qty = Math.floor(itemInput.quantityPieces);
        if (qty <= 0) {
          throw new Error('Return quantity pieces must be greater than 0');
        }

        const bucketField = itemInput.fromBucket === 'damaged' ? 'qtyDamaged' : 'qtyExpired';

        // Conditional atomic update with $gte guard
        const updatedBatch = await Batch.findOneAndUpdate(
          {
            _id: itemInput.batchId,
            [bucketField]: { $gte: qty },
          },
          {
            $inc: { [bucketField]: -qty },
          },
          { new: true, session }
        );

        if (!updatedBatch) {
          throw new Error(
            `Insufficient ${itemInput.fromBucket} stock in batch ${itemInput.batchId} to return ${qty} pieces`
          );
        }

        const itemDoc = await Item.findById(updatedBatch.itemId).session(session);
        const tradeName = itemDoc ? itemDoc.tradeName : 'Medicine';
        const genericName = itemDoc ? itemDoc.genericName : '';

        let costPerPieceDec = new Decimal(0);
        if (updatedBatch.purchasePricePerPiece) {
          costPerPieceDec = new Decimal(updatedBatch.purchasePricePerPiece.toString());
        }
        const lineCostDec = costPerPieceDec.times(qty);
        totalEstimatedCostDec = totalEstimatedCostDec.plus(lineCostDec);
        totalQty += qty;

        returnLines.push({
          itemId: updatedBatch.itemId,
          tradeName,
          genericName,
          batchId: updatedBatch._id,
          batchNumber: updatedBatch.batchNumber,
          expiryDate: updatedBatch.expiryDate,
          fromBucket: itemInput.fromBucket,
          quantityPieces: qty,
          purchaseCostPerPiece: Types.Decimal128.fromString(costPerPieceDec.toFixed(2)),
          totalCost: Types.Decimal128.fromString(lineCostDec.toFixed(2)),
        });

        // Record stock movement ledger
        await StockMovement.create(
          [
            {
              batchId: updatedBatch._id,
              itemId: updatedBatch.itemId,
              type: 'SUPPLIER_RETURN',
              qtyChangePieces: -qty,
              bucketFrom: itemInput.fromBucket,
              bucketTo: 'supplier_return',
              reasonCategory: 'Supplier Return Prep',
              reasonDetail: `Supplier Return to ${input.supplierName}. Ref: ${input.supplierInvoiceRef || 'N/A'}. ${input.reasonDetail}`,
              userId: new Types.ObjectId(input.userId),
              timestamp: new Date(),
            },
          ],
          { session }
        );
      }

      // Generate sequence: SRT-000001
      const supplierReturnNumber = await getNextSequence('supplierReturnNumber', 'SRT', 6, session);

      const [supplierReturn] = await SupplierReturn.create(
        [
          {
            supplierReturnNumber,
            supplierName: input.supplierName.trim(),
            supplierInvoiceRef: input.supplierInvoiceRef?.trim(),
            processedBy: new Types.ObjectId(input.userId),
            processedByName: input.userName,
            lines: returnLines,
            totalQuantityPieces: totalQty,
            totalEstimatedCredit: Types.Decimal128.fromString(totalEstimatedCostDec.toFixed(2)),
            reasonCategory: input.reasonCategory,
            reasonDetail: input.reasonDetail,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return { supplierReturn };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Retrieves supplier returns with pagination and search.
   */
  async getSupplierReturns(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.search?.trim()) {
      filter.$or = [
        { supplierReturnNumber: { $regex: query.search.trim(), $options: 'i' } },
        { supplierName: { $regex: query.search.trim(), $options: 'i' } },
        { supplierInvoiceRef: { $regex: query.search.trim(), $options: 'i' } },
      ];
    }

    const [supplierReturns, total] = await Promise.all([
      SupplierReturn.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SupplierReturn.countDocuments(filter),
    ]);

    return {
      supplierReturns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const supplierReturnService = new SupplierReturnService();
