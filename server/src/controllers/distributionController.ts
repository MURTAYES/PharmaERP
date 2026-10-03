import { Request, Response } from 'express';
import { Item } from '../models/Item.js';
import { Batch } from '../models/Batch.js';
import { AnalyticsCache } from '../models/AnalyticsCache.js';

interface AxisDefinition {
  name: string;
  shortLabel: string;
  regex: RegExp;
  angleDeg: number; // For SVG spider layout
}

const SPIDER_AXES: AxisDefinition[] = [
  { name: 'Tablets & Caplets', shortLabel: 'Tablets', regex: /tablet|caplet|chewable|bolus/i, angleDeg: 270 },
  { name: 'Capsules & Pellets', shortLabel: 'Capsules', regex: /capsule|pellet/i, angleDeg: 330 },
  { name: 'Syrups & Oral Liquids', shortLabel: 'Syrups', regex: /syrup|solution|liquid|drops|elixir/i, angleDeg: 30 },
  { name: 'Suspensions & Powders', shortLabel: 'Suspensions', regex: /suspension|powder|granule|sachet/i, angleDeg: 90 },
  { name: 'Injections & Infusions', shortLabel: 'Injections', regex: /injection|infusion|vial|ampoule|vaccine/i, angleDeg: 150 },
  { name: 'Topicals & Ophthalmic', shortLabel: 'Topicals/Eye', regex: /cream|ointment|gel|lotion|spray|ophthalmic|otic|scalp/i, angleDeg: 210 },
];

export async function getProductDistribution(req: Request, res: Response): Promise<void> {
  const CACHE_KEY = 'product_distribution_spider';
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const forceRefresh = req.query.refresh === 'true';

  try {
    // 1. Check persistent 7-day server cache
    if (!forceRefresh) {
      const cached = await AnalyticsCache.findOne({ key: CACHE_KEY });
      if (cached && cached.expiresAt > new Date()) {
        const remainingMs = cached.expiresAt.getTime() - Date.now();
        const ttlDaysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

        res.json({
          ...cached.data,
          fromCache: true,
          calculatedAt: cached.calculatedAt,
          expiresAt: cached.expiresAt,
          ttlDaysRemaining,
        });
        return;
      }
    }

    // 2. Perform Real Data Aggregation across MongoDB Items
    const totalProducts = await Item.countDocuments({ isActive: true });
    
    // Group all items by category
    const categoryStats = await Item.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Count items with stocked batches
    const stockedItemIds = await Batch.distinct('itemId', { qtySellable: { $gt: 0 } });
    const inStockCount = stockedItemIds.length;
    const inStockRatio = totalProducts > 0 
      ? `${((inStockCount / totalProducts) * 100).toFixed(1)}%` 
      : '0.0%';

    // Map categories into 6 Spider Axes
    const axisCounts = SPIDER_AXES.map(() => 0);
    let otherCount = 0;

    categoryStats.forEach((cat: { _id: string; count: number }) => {
      const name = cat._id || '';
      let matched = false;
      for (let i = 0; i < SPIDER_AXES.length; i++) {
        if (SPIDER_AXES[i].regex.test(name)) {
          axisCounts[i] += cat.count;
          matched = true;
          break;
        }
      }
      if (!matched) {
        otherCount += cat.count;
      }
    });

    const maxCount = Math.max(...axisCounts, 1);

    // Compute SVG Polygon Coordinates (Center: 100, 100; Radius: 20 to 78)
    const CX = 100;
    const CY = 100;
    const MIN_R = 22;
    const MAX_R = 76;

    const axes = SPIDER_AXES.map((axis, i) => {
      const count = axisCounts[i];
      const percentage = totalProducts > 0 ? parseFloat(((count / totalProducts) * 100).toFixed(1)) : 0;
      // Normalization scale for radar visualization
      const normalized = Math.min(1.0, Math.max(0.18, count / maxCount));
      const radius = MIN_R + normalized * (MAX_R - MIN_R);
      
      const angleRad = (axis.angleDeg * Math.PI) / 180;
      const x = Math.round(CX + radius * Math.cos(angleRad));
      const y = Math.round(CY + radius * Math.sin(angleRad));

      return {
        label: axis.shortLabel,
        fullName: axis.name,
        count,
        percentage,
        normalized,
        x,
        y,
      };
    });

    const polygonPoints = axes.map((a) => `${a.x},${a.y}`).join(' ');

    // Determine Top Category
    let topAxis = axes[0];
    for (const a of axes) {
      if (a.count > topAxis.count) topAxis = a;
    }

    const payload = {
      totalProducts,
      inStockCount,
      inStockRatio,
      topCategory: `${topAxis.label} (${topAxis.percentage}%)`,
      topCategoryName: topAxis.label,
      otherCount,
      axes,
      polygonPoints,
      cachePeriodDays: 7,
    };

    // 3. Store result in 7-day Cache
    const calculatedAt = new Date();
    const expiresAt = new Date(calculatedAt.getTime() + SEVEN_DAYS_MS);

    await AnalyticsCache.findOneAndUpdate(
      { key: CACHE_KEY },
      {
        data: payload,
        calculatedAt,
        expiresAt,
      },
      { upsert: true, new: true }
    );

    res.json({
      ...payload,
      fromCache: false,
      calculatedAt,
      expiresAt,
      ttlDaysRemaining: 7,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate product distribution spider analytics' });
  }
}
