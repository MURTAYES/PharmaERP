import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Decimal from 'decimal.js';
import { z } from 'zod';
import { Item, IItem } from '../models/Item.js';
import { Batch } from '../models/Batch.js';
import { getNextSequence } from '../models/Counter.js';
import { createAuditLog } from '../services/auditService.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const createItemSchema = z.object({
  tradeName: z.string().min(1, 'Trade name is required').trim(),
  genericName: z.string().min(1, 'Generic name is required').trim(),
  itemCode: z.string().trim().optional(),
  category: z.string().min(1, 'Category is required').trim(),
  manufacturer: z.string().min(1, 'Manufacturer is required').trim(),
  shelfLocation: z.string().trim().optional().default(''),
  unitHierarchy: z
    .object({
      baseUnit: z.literal('piece').default('piece'),
      piecesPerStrip: z.number().min(1).default(10),
      stripsPerBox: z.number().min(1).default(10),
    })
    .default({ baseUnit: 'piece', piecesPerStrip: 10, stripsPerBox: 10 }),
  mrpPerPiece: z.union([z.string(), z.number()]).refine(
    (val) => {
      try {
        const d = new Decimal(val);
        return d.gte(0);
      } catch {
        return false;
      }
    },
    { message: 'MRP per piece must be a valid non-negative number' }
  ),
  lowStockThresholdPieces: z.number().min(0).default(20),
  isActive: z.boolean().default(true),
});

export const updateItemSchema = createItemSchema.partial();

/**
 * List items with pagination, filtering, and aggregated stock totals
 */
export async function getItems(req: Request, res: Response): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 15));
    const search = (req.query.search as string)?.trim();
    const category = (req.query.category as string)?.trim();
    const activeFilter = req.query.isActive;
    const sortBy = (req.query.sortBy as string)?.toLowerCase() || 'name';
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'desc' ? -1 : 1;

    const query: Record<string, any> = {};

    if (activeFilter !== undefined) {
      query.isActive = activeFilter === 'true';
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { tradeName: searchRegex },
        { genericName: searchRegex },
        { itemCode: searchRegex },
        { manufacturer: searchRegex },
      ];
    }

    const total = await Item.countDocuments(query);

    let enrichedItems: any[] = [];

    if (sortBy === 'stock') {
      // Stock-based sorting requires aggregating batches first
      const pipeline: any[] = [
        { $match: query },
        {
          $lookup: {
            from: 'batches',
            localField: '_id',
            foreignField: 'itemId',
            as: 'batches',
          },
        },
        {
          $addFields: {
            totalSellablePieces: { $sum: '$batches.qtySellable' },
            totalDamagedPieces: { $sum: '$batches.qtyDamaged' },
            totalExpiredPieces: { $sum: '$batches.qtyExpired' },
            batchCount: { $size: '$batches' },
            earliestExpiry: { $min: '$batches.expiryDate' },
          },
        },
        {
          $sort: {
            totalSellablePieces: sortOrder,
            tradeName: 1,
          },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];

      const rawAggItems = await Item.aggregate(pipeline);

      enrichedItems = rawAggItems.map((item: any) => {
        const pieceMRP = new Decimal(item.mrpPerPiece ? item.mrpPerPiece.toString() : '0');
        const pcsPerStrip = item.unitHierarchy?.piecesPerStrip || 1;
        const stripsPerBox = item.unitHierarchy?.stripsPerBox || 1;
        const totalPcsBox = pcsPerStrip * stripsPerBox;

        return {
          ...item,
          mrpPerPiece: pieceMRP.toFixed(2),
          stripPrice: pieceMRP.times(pcsPerStrip).toFixed(2),
          boxPrice: pieceMRP.times(totalPcsBox).toFixed(2),
          totalPiecesPerBox: totalPcsBox,
          isLowStock:
            item.totalSellablePieces >= 5 &&
            item.totalSellablePieces <= (item.lowStockThresholdPieces || 20),
        };
      });
    } else {
      // Standard database field sorting
      const sortOptions: Record<string, 1 | -1> = {};
      if (sortBy === 'generic') {
        sortOptions.genericName = sortOrder;
        sortOptions.tradeName = 1;
      } else if (sortBy === 'mrp') {
        sortOptions.mrpPerPiece = sortOrder;
      } else if (sortBy === 'createdat') {
        sortOptions.createdAt = sortOrder;
      } else {
        // default: name
        sortOptions.tradeName = sortOrder;
      }

      const items = await Item.find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit);

      // Fetch batch aggregations for total sellable stock per item
      const itemIds = items.map((i: any) => i._id);
      const batchAggregates = await Batch.aggregate([
        { $match: { itemId: { $in: itemIds } } },
        {
          $group: {
            _id: '$itemId',
            totalSellablePieces: { $sum: '$qtySellable' },
            totalDamagedPieces: { $sum: '$qtyDamaged' },
            totalExpiredPieces: { $sum: '$qtyExpired' },
            batchCount: { $sum: 1 },
            earliestExpiry: { $min: '$expiryDate' },
          },
        },
      ]);

      const aggregateMap = new Map<string, any>();
      batchAggregates.forEach((agg: any) => {
        aggregateMap.set(agg._id.toString(), agg);
      });

      enrichedItems = items.map((item: any) => {
        const json = item.toJSON();
        const agg = aggregateMap.get(item._id.toString()) || {
          totalSellablePieces: 0,
          totalDamagedPieces: 0,
          totalExpiredPieces: 0,
          batchCount: 0,
          earliestExpiry: null,
        };
        return {
          ...json,
          totalSellablePieces: agg.totalSellablePieces,
          totalDamagedPieces: agg.totalDamagedPieces,
          totalExpiredPieces: agg.totalExpiredPieces,
          batchCount: agg.batchCount,
          earliestExpiry: agg.earliestExpiry,
          isLowStock:
            agg.totalSellablePieces >= 5 &&
            agg.totalSellablePieces <= item.lowStockThresholdPieces,
        };
      });
    }

    res.json({
      items: enrichedItems,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch items' });
  }
}

/**
 * Fast type-ahead item search (<300ms) with aggregated sellable stock and FEFO batches
 */
export async function searchItems(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  try {
    const q = (req.query.q as string)?.trim();
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 15, 50);

    if (!q) {
      res.json({ items: [], latencyMs: Date.now() - startTime });
      return;
    }

    const regex = new RegExp(`^${q}`, 'i');
    const anywhereRegex = new RegExp(q, 'i');

    const items = await Item.find({
      isActive: true,
      $or: [
        { tradeName: regex },
        { tradeName: anywhereRegex },
        { genericName: anywhereRegex },
        { itemCode: regex },
      ],
    })
      .limit(limit)
      .lean();

    const itemIds = items.map((i: any) => i._id);

    // Fetch active batches with sellable stock sorted by FEFO
    const batches = await Batch.find({
      itemId: { $in: itemIds },
      qtySellable: { $gt: 0 },
    })
      .sort({ expiryDate: 1 })
      .lean();

    const batchMap = new Map<string, any[]>();
    batches.forEach((b: any) => {
      const key = b.itemId.toString();
      if (!batchMap.has(key)) batchMap.set(key, []);
      batchMap.get(key)!.push(b);
    });

    const results = items.map((item: any) => {
      const itemBatches = batchMap.get(item._id.toString()) || [];
      const totalSellablePieces = itemBatches.reduce((sum, b) => sum + b.qtySellable, 0);
      const pieceMRP = new Decimal(item.mrpPerPiece.toString());
      const pcsPerStrip = item.unitHierarchy?.piecesPerStrip || 1;
      const stripsPerBox = item.unitHierarchy?.stripsPerBox || 1;
      const totalPcsBox = pcsPerStrip * stripsPerBox;

      return {
        _id: item._id,
        tradeName: item.tradeName,
        genericName: item.genericName,
        itemCode: item.itemCode,
        category: item.category,
        manufacturer: item.manufacturer,
        shelfLocation: item.shelfLocation,
        unitHierarchy: item.unitHierarchy,
        mrpPerPiece: pieceMRP.toFixed(2),
        stripPrice: pieceMRP.times(pcsPerStrip).toFixed(2),
        boxPrice: pieceMRP.times(totalPcsBox).toFixed(2),
        totalPiecesPerBox: totalPcsBox,
        lowStockThresholdPieces: item.lowStockThresholdPieces,
        totalSellablePieces,
        isLowStock: totalSellablePieces >= 5 && totalSellablePieces <= item.lowStockThresholdPieces,
        earliestBatch: itemBatches.length > 0 ? itemBatches[0] : null,
        batches: itemBatches,
      };
    });

    res.json({
      items: results,
      latencyMs: Date.now() - startTime,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Item search failed' });
  }
}

/**
 * Get item details with all batches
 */
export async function getItemById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid item ID' });
      return;
    }

    const item = await Item.findById(id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const batches = await Batch.find({ itemId: item._id }).sort({ expiryDate: 1 });

    res.json({
      item: item.toJSON(),
      batches: batches.map((b: any) => b.toJSON()),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch item' });
  }
}

/**
 * Create new item with auto sequence code
 */
export async function createItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const validated = createItemSchema.parse(req.body);

    let itemCode = validated.itemCode;
    if (!itemCode) {
      itemCode = await getNextSequence('itemCode', 'MED', 6);
    } else {
      itemCode = itemCode.toUpperCase();
      const existing = await Item.findOne({ itemCode });
      if (existing) {
        res.status(409).json({ error: `Item code ${itemCode} already exists` });
        return;
      }
    }

    const item = new Item({
      ...validated,
      itemCode,
      mrpPerPiece: mongoose.Types.Decimal128.fromString(new Decimal(validated.mrpPerPiece).toFixed(2)),
    });

    await item.save();

    await createAuditLog({
      action: 'ITEM_CREATED',
      entity: 'Item',
      entityId: item._id.toString(),
      user: req.user,
      details: {
        tradeName: item.tradeName,
        genericName: item.genericName,
        itemCode: item.itemCode,
        mrpPerPiece: item.mrpPerPiece.toString(),
      },
    });

    res.status(201).json({ item: item.toJSON() });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to create item' });
  }
}

/**
 * Update item details
 */
export async function updateItem(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid item ID' });
      return;
    }

    const validated = updateItemSchema.parse(req.body);
    const item = await Item.findById(id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const previousData = item.toJSON();

    if (validated.tradeName !== undefined) item.tradeName = validated.tradeName;
    if (validated.genericName !== undefined) item.genericName = validated.genericName;
    if (validated.category !== undefined) item.category = validated.category;
    if (validated.manufacturer !== undefined) item.manufacturer = validated.manufacturer;
    if (validated.shelfLocation !== undefined) item.shelfLocation = validated.shelfLocation;
    if (validated.unitHierarchy !== undefined) item.unitHierarchy = validated.unitHierarchy as any;
    if (validated.lowStockThresholdPieces !== undefined)
      item.lowStockThresholdPieces = validated.lowStockThresholdPieces;
    if (validated.isActive !== undefined) item.isActive = validated.isActive;
    if (validated.mrpPerPiece !== undefined) {
      item.mrpPerPiece = mongoose.Types.Decimal128.fromString(
        new Decimal(validated.mrpPerPiece).toFixed(2)
      );
    }

    await item.save();

    await createAuditLog({
      action: 'ITEM_UPDATED',
      entity: 'Item',
      entityId: item._id.toString(),
      user: req.user,
      details: {
        previous: previousData,
        current: item.toJSON(),
      },
    });

    res.json({ item: item.toJSON() });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0]?.message || 'Validation failed' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to update item' });
  }
}

/**
 * Toggle active status
 */
export async function toggleItemActive(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid item ID' });
      return;
    }

    const item = await Item.findById(id);
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    item.isActive = !item.isActive;
    await item.save();

    await createAuditLog({
      action: 'ITEM_STATUS_TOGGLED',
      entity: 'Item',
      entityId: item._id.toString(),
      user: req.user,
      details: { isActive: item.isActive },
    });

    res.json({ item: item.toJSON() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle item status' });
  }
}
