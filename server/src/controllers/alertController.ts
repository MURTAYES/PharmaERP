import { Request, Response } from 'express';
import { Batch } from '../models/Batch.js';
import { Item } from '../models/Item.js';
import { Settings } from '../models/Settings.js';

/**
 * Get real-time alert summary KPI counts
 */
export async function getAlertSummary(_req: Request, res: Response): Promise<void> {
  try {
    const settings = await Settings.findOne();
    const windows = settings?.expiryAlertWindows || { greenDays: 90, yellowDays: 60, redDays: 30 };

    const now = new Date();
    const d30 = new Date(now.getTime() + windows.redDays * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() + windows.yellowDays * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() + windows.greenDays * 24 * 60 * 60 * 1000);

    // Expiry counts for batches with sellable stock
    const [expiredCount, critical30Count, warning60Count, notice90Count] = await Promise.all([
      Batch.countDocuments({ expiryDate: { $lte: now }, qtySellable: { $gt: 0 } }),
      Batch.countDocuments({ expiryDate: { $gt: now, $lte: d30 }, qtySellable: { $gt: 0 } }),
      Batch.countDocuments({ expiryDate: { $gt: d30, $lte: d60 }, qtySellable: { $gt: 0 } }),
      Batch.countDocuments({ expiryDate: { $gt: d60, $lte: d90 }, qtySellable: { $gt: 0 } }),
    ]);

    // Low stock items count: Aggregate total sellable stock per item and compare against lowStockThresholdPieces
    const lowStockAggregation = await Item.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: 'itemId',
          as: 'batches',
        },
      },
      {
        $project: {
          lowStockThresholdPieces: 1,
          totalSellablePieces: { $sum: '$batches.qtySellable' },
        },
      },
      {
        $match: {
          $expr: { $lte: ['$totalSellablePieces', '$lowStockThresholdPieces'] },
        },
      },
      { $count: 'lowStockCount' },
    ]);

    const lowStockCount = lowStockAggregation[0]?.lowStockCount || 0;

    res.json({
      expiredCount,
      critical30Count,
      warning60Count,
      notice90Count,
      lowStockCount,
      totalAlerts: expiredCount + critical30Count + warning60Count + notice90Count + lowStockCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch alert summary' });
  }
}

/**
 * Get list of batches in a specific expiry tier
 */
export async function getExpiringBatches(req: Request, res: Response): Promise<void> {
  try {
    const tier = (req.query.tier as string)?.toLowerCase() || 'all';
    const settings = await Settings.findOne();
    const windows = settings?.expiryAlertWindows || { greenDays: 90, yellowDays: 60, redDays: 30 };

    const now = new Date();
    const d30 = new Date(now.getTime() + windows.redDays * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() + windows.yellowDays * 24 * 60 * 60 * 1000);
    const d90 = new Date(now.getTime() + windows.greenDays * 24 * 60 * 60 * 1000);

    const query: Record<string, any> = { qtySellable: { $gt: 0 } };

    if (tier === 'expired') {
      query.expiryDate = { $lte: now };
    } else if (tier === 'critical') {
      query.expiryDate = { $gt: now, $lte: d30 };
    } else if (tier === 'warning') {
      query.expiryDate = { $gt: d30, $lte: d60 };
    } else if (tier === 'notice') {
      query.expiryDate = { $gt: d60, $lte: d90 };
    } else if (tier === 'all') {
      query.expiryDate = { $lte: d90 };
    }

    const batches = await Batch.find(query)
      .populate('itemId', 'tradeName genericName itemCode category shelfLocation unitHierarchy mrpPerPiece')
      .sort({ expiryDate: 1 });

    res.json({
      tier,
      count: batches.length,
      batches: batches.map((b: any) => b.toJSON()),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch expiring batches' });
  }
}

/**
 * Get items that are below their low stock threshold
 */
export async function getLowStockItems(_req: Request, res: Response): Promise<void> {
  try {
    const lowStockItems = await Item.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'batches',
          localField: '_id',
          foreignField: 'itemId',
          as: 'batches',
        },
      },
      {
        $project: {
          tradeName: 1,
          genericName: 1,
          itemCode: 1,
          category: 1,
          manufacturer: 1,
          shelfLocation: 1,
          unitHierarchy: 1,
          mrpPerPiece: 1,
          lowStockThresholdPieces: 1,
          totalSellablePieces: { $sum: '$batches.qtySellable' },
          batchCount: { $size: '$batches' },
        },
      },
      {
        $match: {
          $expr: { $lte: ['$totalSellablePieces', '$lowStockThresholdPieces'] },
        },
      },
      { $sort: { totalSellablePieces: 1, tradeName: 1 } },
    ]);

    res.json({
      count: lowStockItems.length,
      items: lowStockItems,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch low stock items' });
  }
}
