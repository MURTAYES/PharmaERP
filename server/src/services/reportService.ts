import mongoose, { Types } from 'mongoose';
import Decimal from 'decimal.js';
import { Invoice } from '../models/Invoice.js';
import { CreditNote } from '../models/CreditNote.js';
import { SupplierReturn } from '../models/SupplierReturn.js';
import { Batch } from '../models/Batch.js';
import { Item } from '../models/Item.js';
import { StockMovement } from '../models/StockMovement.js';
import { AnalyticsCache } from '../models/AnalyticsCache.js';

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  billedBy?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Resolves start and end Date objects in Asia/Dhaka (+06:00 offset).
 */
export function resolveDhakaDateRange(startDateStr?: string, endDateStr?: string) {
  let start: Date | null = null;
  let end: Date | null = null;

  if (startDateStr) {
    // e.g. "2026-10-01" -> 2026-10-01T00:00:00+06:00
    start = new Date(`${startDateStr}T00:00:00+06:00`);
  }
  if (endDateStr) {
    // e.g. "2026-10-03" -> 2026-10-03T23:59:59.999+06:00
    end = new Date(`${endDateStr}T23:59:59.999+06:00`);
  }

  return { start, end };
}

export class ReportService {
  /**
   * RPT-01: Executive Dashboard Metrics with Period-Aware Analytics Cache
   * Supports: 'today' | 'last_7_days' | 'this_month'
   * Features:
   *  - Automatic persistent cache in AnalyticsCache with clean storage management (old cache pruned)
   *  - Best-selling company / brand product breakdown
   *  - Generic-wise sales bar metrics
   *  - Saturday-to-Friday weekly sales line performance
   */
  async getDashboardKPIs(period: string = 'today', forceRefresh: boolean = false) {
    const now = new Date();

    // Format YYYY-MM-DD in Asia/Dhaka (+06:00)
    const dhakaDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const [yearStr, monthStr] = dhakaDateStr.split('-');
    const todayStart = new Date(`${dhakaDateStr}T00:00:00+06:00`);
    const todayEnd = new Date(`${dhakaDateStr}T23:59:59.999+06:00`);

    const normalizedPeriod = ['today', 'last_7_days', 'this_month'].includes(period)
      ? period
      : 'today';

    const cacheKey = `dashboard_kpi_${normalizedPeriod}_${dhakaDateStr}`;

    // 1. Check persistent cache if not forcing refresh
    if (!forceRefresh) {
      try {
        const cached = await AnalyticsCache.findOne({ key: cacheKey });
        if (cached && cached.expiresAt > now) {
          return {
            ...cached.data,
            fromCache: true,
            calculatedAt: cached.calculatedAt,
          };
        }
      } catch (err) {
        console.warn('AnalyticsCache query failed, continuing with direct computation:', err);
      }
    }

    // 2. Resolve requested period date range
    let periodStart: Date;
    let periodEnd: Date = todayEnd;

    if (normalizedPeriod === 'today') {
      periodStart = todayStart;
    } else if (normalizedPeriod === 'last_7_days') {
      periodStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    } else {
      // 'this_month': 1st of month to today
      periodStart = new Date(`${yearStr}-${monthStr}-01T00:00:00+06:00`);
    }

    // Previous comparative window for growth % calculation
    const periodDurationMs = Math.max(1000, periodEnd.getTime() - periodStart.getTime());
    const prevPeriodStart = new Date(periodStart.getTime() - periodDurationMs);
    const prevPeriodEnd = new Date(periodStart.getTime() - 1);

    // 3. Resolve Saturday-to-Friday Weekly Performance Window in Asia/Dhaka
    const dhakaWeekday = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      weekday: 'short',
    }).format(now);

    const weekdayOffsets: Record<string, number> = {
      Sat: 0,
      Sun: 1,
      Mon: 2,
      Tue: 3,
      Wed: 4,
      Thu: 5,
      Fri: 6,
    };
    const daysSinceSat = weekdayOffsets[dhakaWeekday] ?? 0;
    const weekStart = new Date(todayStart.getTime() - daysSinceSat * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
    const weekStartDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(weekStart);

    // 4. Fetch DB records in parallel
    const [
      periodInvoices,
      prevPeriodInvoices,
      weeklyInvoices,
      allBatches,
      periodCreditNotes,
    ] = await Promise.all([
      Invoice.find({ createdAt: { $gte: periodStart, $lte: periodEnd } }).lean(),
      Invoice.find({ createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd } }).lean(),
      Invoice.find({ createdAt: { $gte: weekStart, $lte: weekEnd } }).lean(),
      Batch.find().lean(),
      CreditNote.find({ createdAt: { $gte: periodStart, $lte: periodEnd } }).lean(),
    ]);

    // 5. Build Item Metadata Map for Brand and Generic aggregation
    const uniqueItemIds = new Set<string>();
    for (const inv of periodInvoices) {
      for (const line of inv.lines) {
        if (line.itemId) uniqueItemIds.add(line.itemId.toString());
      }
    }
    const itemsList = await Item.find({ _id: { $in: Array.from(uniqueItemIds) } })
      .select('tradeName genericName brandName manufacturer')
      .lean();
    const itemMetaMap = new Map<string, any>();
    for (const it of itemsList) {
      itemMetaMap.set(it._id.toString(), it);
    }

    // 6. Aggregate Financial Metrics for the Selected Period
    let grossSalesDec = new Decimal(0);
    let paymentSplit = { cash: new Decimal(0), card: new Decimal(0), mfs: new Decimal(0) };
    const itemSalesMap = new Map<string, { tradeName: string; genericName: string; pcs: number; revenue: any }>();
    const companySalesMap = new Map<string, { revenue: any; pieces: number }>();
    const genericSalesMap = new Map<string, { revenue: any; pieces: number }>();
    let totalProductRevenueDec = new Decimal(0);

    for (const inv of periodInvoices) {
      const gTotal = new Decimal(inv.grandTotal?.toString() || 0);
      grossSalesDec = grossSalesDec.plus(gTotal);

      if (inv.payment?.method === 'cash') {
        paymentSplit.cash = paymentSplit.cash.plus(gTotal);
      } else if (inv.payment?.method === 'card') {
        paymentSplit.card = paymentSplit.card.plus(gTotal);
      } else if (inv.payment?.method === 'mfs') {
        paymentSplit.mfs = paymentSplit.mfs.plus(gTotal);
      } else if (inv.payment?.method === 'split' && inv.payment.splitDetails) {
        if (inv.payment.splitDetails.cashAmount) {
          paymentSplit.cash = paymentSplit.cash.plus(new Decimal(inv.payment.splitDetails.cashAmount.toString()));
        }
        if (inv.payment.splitDetails.cardAmount) {
          paymentSplit.card = paymentSplit.card.plus(new Decimal(inv.payment.splitDetails.cardAmount.toString()));
        }
        if (inv.payment.splitDetails.mfsAmount) {
          paymentSplit.mfs = paymentSplit.mfs.plus(new Decimal(inv.payment.splitDetails.mfsAmount.toString()));
        }
      }

      for (const line of inv.lines) {
        const lineRev = new Decimal(line.lineTotal?.toString() || 0);
        totalProductRevenueDec = totalProductRevenueDec.plus(lineRev);
        const meta = itemMetaMap.get(line.itemId.toString());

        // Top medicines tracking
        const key = line.itemId.toString();
        const prevItem = itemSalesMap.get(key) || {
          tradeName: line.tradeName,
          genericName: line.genericName,
          pcs: 0,
          revenue: new Decimal(0),
        };
        prevItem.pcs += line.quantityPieces || 0;
        prevItem.revenue = prevItem.revenue.plus(lineRev);
        itemSalesMap.set(key, prevItem);

        // Company / Brand Sales Tracking
        const companyName = (meta?.brandName || meta?.manufacturer || line.tradeName.split(' ')[0] || 'General Brand').trim();
        const prevComp = companySalesMap.get(companyName) || { revenue: new Decimal(0), pieces: 0 };
        prevComp.revenue = prevComp.revenue.plus(lineRev);
        prevComp.pieces += line.quantityPieces || 0;
        companySalesMap.set(companyName, prevComp);

        // Generic-Wise Sales Tracking
        const genericName = (line.genericName || meta?.genericName || 'General Formula').trim();
        const prevGen = genericSalesMap.get(genericName) || { revenue: new Decimal(0), pieces: 0 };
        prevGen.revenue = prevGen.revenue.plus(lineRev);
        prevGen.pieces += line.quantityPieces || 0;
        genericSalesMap.set(genericName, prevGen);
      }
    }

    // Period Refunds
    let refundsDec = new Decimal(0);
    for (const cn of periodCreditNotes) {
      refundsDec = refundsDec.plus(new Decimal(cn.grandTotalRefund?.toString() || 0));
    }
    const netSalesDec = grossSalesDec.minus(refundsDec);

    // Previous Period Sales for Growth %
    let prevGrossSalesDec = new Decimal(0);
    for (const inv of prevPeriodInvoices) {
      prevGrossSalesDec = prevGrossSalesDec.plus(new Decimal(inv.grandTotal?.toString() || 0));
    }

    let salesGrowthPercent = 0;
    if (prevGrossSalesDec.greaterThan(0)) {
      salesGrowthPercent = grossSalesDec
        .minus(prevGrossSalesDec)
        .dividedBy(prevGrossSalesDec)
        .times(100)
        .toDecimalPlaces(1)
        .toNumber();
    }

    // 7. Format Company / Brand Breakdown ("Which company product has best sales")
    const sortedCompanies = Array.from(companySalesMap.entries())
      .map(([company, val]) => ({
        company,
        revenue: val.revenue.toFixed(2),
        pieces: val.pieces,
        rawRevenue: val.revenue.toNumber(),
        percentage: totalProductRevenueDec.greaterThan(0)
          ? Math.round(val.revenue.dividedBy(totalProductRevenueDec).times(100).toNumber())
          : 0,
      }))
      .sort((a, b) => b.rawRevenue - a.rawRevenue);

    let companySales: any[] = [];
    if (sortedCompanies.length <= 5) {
      companySales = sortedCompanies;
    } else {
      const top5 = sortedCompanies.slice(0, 5);
      const others = sortedCompanies.slice(5);
      let otherRev = new Decimal(0);
      let otherPieces = 0;
      for (const o of others) {
        otherRev = otherRev.plus(o.revenue);
        otherPieces += o.pieces;
      }
      const otherPct = totalProductRevenueDec.greaterThan(0)
        ? Math.round(otherRev.dividedBy(totalProductRevenueDec).times(100).toNumber())
        : 0;
      companySales = [
        ...top5,
        {
          company: 'Other Brands',
          revenue: otherRev.toFixed(2),
          pieces: otherPieces,
          rawRevenue: otherRev.toNumber(),
          percentage: otherPct,
        },
      ];
    }

    // 8. Format Generic-Wise Sales Performance (for Bar Graph)
    const sortedGenerics = Array.from(genericSalesMap.entries())
      .map(([genericName, val]) => ({
        genericName,
        revenue: val.revenue.toFixed(2),
        pieces: val.pieces,
        rawRevenue: val.revenue.toNumber(),
        percentage: totalProductRevenueDec.greaterThan(0)
          ? Math.round(val.revenue.dividedBy(totalProductRevenueDec).times(100).toNumber())
          : 0,
      }))
      .sort((a, b) => b.rawRevenue - a.rawRevenue)
      .slice(0, 6);

    // 9. Format Weekly Sales Performance (Saturday to Friday Cycle)
    const dayNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const weeklySales: any[] = [];
    let maxDaySales = new Decimal(0);
    let peakDayIndex = -1;

    for (let i = 0; i < 7; i++) {
      const dStart = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      const dEnd = new Date(dStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      const dStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(dStart);

      let daySales = new Decimal(0);
      let dayCount = 0;

      for (const inv of weeklyInvoices) {
        const invT = new Date(inv.createdAt).getTime();
        if (invT >= dStart.getTime() && invT <= dEnd.getTime()) {
          daySales = daySales.plus(new Decimal(inv.grandTotal?.toString() || 0));
          dayCount++;
        }
      }

      if (daySales.greaterThan(maxDaySales)) {
        maxDaySales = daySales;
        peakDayIndex = i;
      }

      weeklySales.push({
        day: dayNames[i],
        date: dStr,
        sales: daySales.toFixed(2),
        salesNum: daySales.toNumber(),
        count: dayCount,
        isToday: dStr === dhakaDateStr,
        isPeak: false,
      });
    }

    if (peakDayIndex >= 0 && maxDaySales.greaterThan(0)) {
      weeklySales[peakDayIndex].isPeak = true;
    }

    // 10. Expiry Alerts
    let expiredBatches = 0;
    let critical30Batches = 0;
    let warning60Batches = 0;
    let notice90Batches = 0;

    for (const b of allBatches) {
      if (b.qtySellable <= 0) continue;
      const diffDays = Math.ceil((new Date(b.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) expiredBatches++;
      else if (diffDays <= 30) critical30Batches++;
      else if (diffDays <= 60) warning60Batches++;
      else if (diffDays <= 90) notice90Batches++;
    }

    // 11. Top 5 Best-Selling Medicines
    const topMedicines = Array.from(itemSalesMap.entries())
      .map(([itemId, val]) => ({
        itemId,
        tradeName: val.tradeName,
        genericName: val.genericName,
        piecesSold: val.pcs,
        revenue: val.revenue.toFixed(2),
      }))
      .sort((a, b) => b.piecesSold - a.piecesSold)
      .slice(0, 5);

    const resultData = {
      period: normalizedPeriod,
      today: {
        date: dhakaDateStr,
        grossSales: grossSalesDec.toFixed(2),
        refunds: refundsDec.toFixed(2),
        netSales: netSalesDec.toFixed(2),
        invoiceCount: periodInvoices.length,
        averageTicketSize:
          periodInvoices.length > 0
            ? grossSalesDec.dividedBy(periodInvoices.length).toFixed(2)
            : '0.00',
        salesGrowthPercent,
        paymentSplit: {
          cash: paymentSplit.cash.toFixed(2),
          card: paymentSplit.card.toFixed(2),
          mfs: paymentSplit.mfs.toFixed(2),
        },
      },
      companySales,
      genericSales: sortedGenerics,
      weeklySales,
      alerts: {
        expired: expiredBatches,
        critical30: critical30Batches,
        warning60: warning60Batches,
        notice90: notice90Batches,
        totalAlerts: expiredBatches + critical30Batches + warning60Batches + notice90Batches,
      },
      topMedicines,
    };

    // 12. Persistent Cache Management & Deletion of Previous Caches
    try {
      // Delete any prior cache for this specific period key that is not today's
      await AnalyticsCache.deleteMany({
        key: { $regex: `^dashboard_kpi_${normalizedPeriod}_`, $ne: cacheKey },
      });

      // Purge any expired cache documents
      await AnalyticsCache.deleteMany({
        expiresAt: { $lt: now },
      });

      // Purge previous week's weekly cache when a new Saturday week begins
      const weeklyKey = `dashboard_weekly_sales_${weekStartDateStr}`;
      await AnalyticsCache.deleteMany({
        key: { $regex: '^dashboard_weekly_sales_', $ne: weeklyKey },
      });

      // Set expiry: 5 minutes for 'today' so live POS sales reflect periodically,
      // end of day for 'last_7_days' and 'this_month'
      const cacheExpiry = normalizedPeriod === 'today'
        ? new Date(now.getTime() + 5 * 60 * 1000)
        : todayEnd;

      await AnalyticsCache.findOneAndUpdate(
        { key: cacheKey },
        {
          key: cacheKey,
          data: resultData,
          calculatedAt: now,
          expiresAt: cacheExpiry,
        },
        { upsert: true, new: true }
      );
    } catch (cacheErr) {
      console.warn('AnalyticsCache persistence failed:', cacheErr);
    }

    return {
      ...resultData,
      fromCache: false,
      calculatedAt: now,
    };
  }

  /**
   * RPT-02: Sales Summary Report
   */
  async getSalesSummary(query: DateRangeQuery) {
    const { start, end } = resolveDhakaDateRange(query.startDate, query.endDate);
    const filter: any = {};
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }
    if (query.paymentMethod) {
      filter['payment.method'] = query.paymentMethod;
    }
    if (query.billedBy && Types.ObjectId.isValid(query.billedBy)) {
      filter.billedBy = new Types.ObjectId(query.billedBy);
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();

    let totalSubtotalDec = new Decimal(0);
    let totalDiscountDec = new Decimal(0);
    let totalChargesDec = new Decimal(0);
    let totalGrandDec = new Decimal(0);
    let totalItemsCount = 0;
    let totalPiecesCount = 0;

    const dailyMap = new Map<string, any>();

    for (const inv of invoices) {
      totalSubtotalDec = totalSubtotalDec.plus(new Decimal(inv.subtotal?.toString() || 0));
      totalDiscountDec = totalDiscountDec.plus(new Decimal(inv.discountAmount?.toString() || 0));
      totalChargesDec = totalChargesDec.plus(new Decimal(inv.totalCharges?.toString() || 0));
      totalGrandDec = totalGrandDec.plus(new Decimal(inv.grandTotal?.toString() || 0));

      const invPcs = inv.lines.reduce((acc: number, l: any) => acc + l.quantityPieces, 0);
      totalItemsCount += inv.lines.length;
      totalPiecesCount += invPcs;

      const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(inv.createdAt));

      const prevDay = dailyMap.get(dateStr) || {
        date: dateStr,
        invoiceCount: 0,
        subtotal: new Decimal(0),
        discount: new Decimal(0),
        charges: new Decimal(0),
        grandTotal: new Decimal(0),
        piecesSold: 0,
      };

      prevDay.invoiceCount += 1;
      prevDay.subtotal = prevDay.subtotal.plus(new Decimal(inv.subtotal?.toString() || 0));
      prevDay.discount = prevDay.discount.plus(new Decimal(inv.discountAmount?.toString() || 0));
      prevDay.charges = prevDay.charges.plus(new Decimal(inv.totalCharges?.toString() || 0));
      prevDay.grandTotal = prevDay.grandTotal.plus(new Decimal(inv.grandTotal?.toString() || 0));
      prevDay.piecesSold += invPcs;

      dailyMap.set(dateStr, prevDay);
    }

    const dailyBreakdown = Array.from(dailyMap.values()).map((d) => ({
      date: d.date,
      invoiceCount: d.invoiceCount,
      subtotal: d.subtotal.toFixed(2),
      discount: d.discount.toFixed(2),
      charges: d.charges.toFixed(2),
      grandTotal: d.grandTotal.toFixed(2),
      piecesSold: d.piecesSold,
    }));

    return {
      totals: {
        totalInvoices: invoices.length,
        totalSubtotal: totalSubtotalDec.toFixed(2),
        totalDiscount: totalDiscountDec.toFixed(2),
        totalCharges: totalChargesDec.toFixed(2),
        grandTotal: totalGrandDec.toFixed(2),
        totalMedicinesCount: totalItemsCount,
        totalPiecesSold: totalPiecesCount,
      },
      dailyBreakdown,
      invoices,
    };
  }

  /**
   * RPT-03: Sales by Item Report
   */
  async getSalesByItem(query: DateRangeQuery) {
    const { start, end } = resolveDhakaDateRange(query.startDate, query.endDate);
    const filter: any = {};
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }

    const invoices = await Invoice.find(filter).lean();
    const itemMap = new Map<string, any>();

    for (const inv of invoices) {
      for (const line of inv.lines) {
        const key = line.itemId.toString();
        const prev = itemMap.get(key) || {
          itemId: key,
          tradeName: line.tradeName,
          genericName: line.genericName,
          transactionCount: 0,
          totalPiecesSold: 0,
          totalRevenueDec: new Decimal(0),
          units: new Set<string>(),
        };

        prev.transactionCount += 1;
        prev.totalPiecesSold += line.quantityPieces;
        prev.totalRevenueDec = prev.totalRevenueDec.plus(new Decimal(line.lineTotal?.toString() || 0));
        prev.units.add(line.unit);

        itemMap.set(key, prev);
      }
    }

    let searchRegex: RegExp | null = null;
    if (query.search?.trim()) {
      searchRegex = new RegExp(query.search.trim(), 'i');
    }

    const itemsReport = Array.from(itemMap.values())
      .filter((item) => {
        if (!searchRegex) return true;
        return searchRegex.test(item.tradeName) || searchRegex.test(item.genericName);
      })
      .map((item) => {
        const avgPricePerPiece =
          item.totalPiecesSold > 0
            ? item.totalRevenueDec.dividedBy(item.totalPiecesSold).toFixed(2)
            : '0.00';

        return {
          itemId: item.itemId,
          tradeName: item.tradeName,
          genericName: item.genericName,
          transactionCount: item.transactionCount,
          totalPiecesSold: item.totalPiecesSold,
          totalRevenue: item.totalRevenueDec.toFixed(2),
          avgPricePerPiece,
          soldUnits: Array.from(item.units),
        };
      })
      .sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue));

    return {
      items: itemsReport,
      totalCount: itemsReport.length,
    };
  }

  /**
   * RPT-04: Profit and Loss Report
   */
  async getProfitAndLoss(query: DateRangeQuery) {
    const { start, end } = resolveDhakaDateRange(query.startDate, query.endDate);
    const filter: any = {};
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }

    const invoices = await Invoice.find(filter).lean();

    let totalRevenueDec = new Decimal(0);
    let totalCostDec = new Decimal(0);
    let uncostedLinesCount = 0;
    let costedLinesCount = 0;

    const itemPnlMap = new Map<string, any>();

    for (const inv of invoices) {
      for (const line of inv.lines) {
        const lineRev = new Decimal(line.lineTotal?.toString() || 0);
        totalRevenueDec = totalRevenueDec.plus(lineRev);

        const key = line.itemId.toString();
        const prev = itemPnlMap.get(key) || {
          itemId: key,
          tradeName: line.tradeName,
          genericName: line.genericName,
          quantityPieces: 0,
          revenueDec: new Decimal(0),
          costDec: new Decimal(0),
          uncostedPieces: 0,
        };

        prev.quantityPieces += line.quantityPieces;
        prev.revenueDec = prev.revenueDec.plus(lineRev);

        if (line.purchaseCostPerPiece) {
          const costPerPcs = new Decimal(line.purchaseCostPerPiece.toString());
          const lineCost = costPerPcs.times(line.quantityPieces);
          totalCostDec = totalCostDec.plus(lineCost);
          prev.costDec = prev.costDec.plus(lineCost);
          costedLinesCount++;
        } else {
          uncostedLinesCount++;
          prev.uncostedPieces += line.quantityPieces;
        }

        itemPnlMap.set(key, prev);
      }
    }

    const grossProfitDec = totalRevenueDec.minus(totalCostDec);
    let profitMarginPercent = 0;
    if (totalRevenueDec.greaterThan(0)) {
      profitMarginPercent = grossProfitDec
        .dividedBy(totalRevenueDec)
        .times(100)
        .toDecimalPlaces(1)
        .toNumber();
    }

    const itemBreakdown = Array.from(itemPnlMap.values())
      .map((item) => {
        const itemProfitDec = item.revenueDec.minus(item.costDec);
        let itemMargin = 0;
        if (item.revenueDec.greaterThan(0)) {
          itemMargin = itemProfitDec
            .dividedBy(item.revenueDec)
            .times(100)
            .toDecimalPlaces(1)
            .toNumber();
        }

        return {
          itemId: item.itemId,
          tradeName: item.tradeName,
          genericName: item.genericName,
          quantityPieces: item.quantityPieces,
          revenue: item.revenueDec.toFixed(2),
          cost: item.costDec.toFixed(2),
          profit: itemProfitDec.toFixed(2),
          marginPercent: itemMargin,
          uncostedPieces: item.uncostedPieces,
        };
      })
      .sort((a, b) => parseFloat(b.profit) - parseFloat(a.profit));

    return {
      summary: {
        totalRevenue: totalRevenueDec.toFixed(2),
        totalCost: totalCostDec.toFixed(2),
        grossProfit: grossProfitDec.toFixed(2),
        profitMarginPercent,
        costedLinesCount,
        uncostedLinesCount,
      },
      itemBreakdown,
    };
  }

  /**
   * RPT-05: Price Override Audit Report
   */
  async getPriceOverrides(query: DateRangeQuery) {
    const { start, end } = resolveDhakaDateRange(query.startDate, query.endDate);
    const filter: any = { hasPriceOverride: true };
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();
    const overrides: any[] = [];

    for (const inv of invoices) {
      for (const line of inv.lines) {
        if (line.isPriceOverridden) {
          overrides.push({
            invoiceId: inv._id,
            invoiceNumber: inv.invoiceNumber,
            date: inv.createdAt,
            billedByName: inv.billedByName,
            tradeName: line.tradeName,
            genericName: line.genericName,
            unit: line.unit,
            quantity: line.quantity,
            quantityPieces: line.quantityPieces,
            originalUnitPrice: line.originalUnitPrice ? line.originalUnitPrice.toString() : '0.00',
            overriddenUnitPrice: line.unitPrice ? line.unitPrice.toString() : '0.00',
            variance: line.priceOverrideVariance ? line.priceOverrideVariance.toString() : '0.00',
            lineTotal: line.lineTotal ? line.lineTotal.toString() : '0.00',
          });
        }
      }
    }

    return {
      overrides,
      totalCount: overrides.length,
    };
  }

  /**
   * RPT-06: Non-FEFO Sales Audit Report
   */
  async getNonFefo(query: DateRangeQuery) {
    const { start, end } = resolveDhakaDateRange(query.startDate, query.endDate);
    const filter: any = { hasNonFefoBatch: true };
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }

    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();
    const nonFefoLines: any[] = [];

    for (const inv of invoices) {
      for (const line of inv.lines) {
        if (line.isNonFefo) {
          nonFefoLines.push({
            invoiceId: inv._id,
            invoiceNumber: inv.invoiceNumber,
            date: inv.createdAt,
            billedByName: inv.billedByName,
            tradeName: line.tradeName,
            genericName: line.genericName,
            chosenBatchNumber: line.batchNumber,
            chosenBatchExpiry: line.expiryDate,
            suggestedFefoBatchNumber: line.suggestedFefoBatchNumber || 'Earlier Expiring Batch',
            quantityPieces: line.quantityPieces,
            unit: line.unit,
            lineTotal: line.lineTotal ? line.lineTotal.toString() : '0.00',
          });
        }
      }
    }

    return {
      nonFefoLines,
      totalCount: nonFefoLines.length,
    };
  }

  /**
   * RPT-07: Stock Valuation Report (MRP vs Cost)
   */
  async getStockValuation() {
    const [items, batches] = await Promise.all([Item.find().lean(), Batch.find().lean()]);

    const itemMap = new Map<string, any>();
    for (const itm of items) {
      itemMap.set(itm._id.toString(), itm);
    }

    let totalSellablePieces = 0;
    let totalDamagedPieces = 0;
    let totalExpiredPieces = 0;
    let totalRetailValuationDec = new Decimal(0);
    let totalCostValuationDec = new Decimal(0);
    let costMissingBatchesCount = 0;

    const batchValuations = batches.map((b: any) => {
      const itm = itemMap.get(b.itemId.toString());
      const mrpPerPieceDec = itm ? new Decimal(itm.mrpPerPiece?.toString() || 0) : new Decimal(0);
      const costPerPieceDec = b.purchasePricePerPiece
        ? new Decimal(b.purchasePricePerPiece.toString())
        : new Decimal(0);

      const sellablePcs = b.qtySellable || 0;
      const damagedPcs = b.qtyDamaged || 0;
      const expiredPcs = b.qtyExpired || 0;

      totalSellablePieces += sellablePcs;
      totalDamagedPieces += damagedPcs;
      totalExpiredPieces += expiredPcs;

      const retailVal = mrpPerPieceDec.times(sellablePcs);
      const costVal = costPerPieceDec.times(sellablePcs);

      totalRetailValuationDec = totalRetailValuationDec.plus(retailVal);
      totalCostValuationDec = totalCostValuationDec.plus(costVal);

      if (b.isCostMissing) costMissingBatchesCount++;

      return {
        batchId: b._id,
        batchNumber: b.batchNumber,
        tradeName: itm ? itm.tradeName : 'Medicine',
        genericName: itm ? itm.genericName : '',
        category: itm ? itm.category : '',
        expiryDate: b.expiryDate,
        qtySellable: sellablePcs,
        qtyDamaged: damagedPcs,
        qtyExpired: expiredPcs,
        mrpPerPiece: mrpPerPieceDec.toFixed(2),
        costPerPiece: b.purchasePricePerPiece ? costPerPieceDec.toFixed(2) : null,
        retailValuation: retailVal.toFixed(2),
        costValuation: costVal.toFixed(2),
        isCostMissing: b.isCostMissing,
        supplierName: b.supplierName || '—',
      };
    });

    return {
      summary: {
        totalBatches: batches.length,
        totalSellablePieces,
        totalDamagedPieces,
        totalExpiredPieces,
        totalRetailValuation: totalRetailValuationDec.toFixed(2),
        totalCostValuation: totalCostValuationDec.toFixed(2),
        potentialGrossProfit: totalRetailValuationDec.minus(totalCostValuationDec).toFixed(2),
        costMissingBatchesCount,
      },
      batches: batchValuations,
    };
  }

  /**
   * RPT-10: Returns & Credit Notes Audit Report
   */
  async getReturnsReport(query: DateRangeQuery) {
    const { start, end } = resolveDhakaDateRange(query.startDate, query.endDate);
    const filter: any = {};
    if (start || end) {
      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }

    const [creditNotes, supplierReturns] = await Promise.all([
      CreditNote.find(filter).sort({ createdAt: -1 }).lean(),
      SupplierReturn.find(filter).sort({ createdAt: -1 }).lean(),
    ]);

    let totalCustomerRefundDec = new Decimal(0);
    let totalCustomerPcs = 0;
    const reasonDistribution: Record<string, number> = {};

    for (const cn of creditNotes) {
      totalCustomerRefundDec = totalCustomerRefundDec.plus(new Decimal(cn.grandTotalRefund?.toString() || 0));
      for (const line of cn.lines) {
        totalCustomerPcs += line.returnedQuantityPieces;
      }
      reasonDistribution[cn.reasonCategory] = (reasonDistribution[cn.reasonCategory] || 0) + 1;
    }

    let totalSupplierPcs = 0;
    let totalSupplierCreditDec = new Decimal(0);
    for (const srt of supplierReturns) {
      totalSupplierPcs += srt.totalQuantityPieces;
      if (srt.totalEstimatedCredit) {
        totalSupplierCreditDec = totalSupplierCreditDec.plus(new Decimal(srt.totalEstimatedCredit.toString()));
      }
    }

    return {
      summary: {
        totalCreditNotes: creditNotes.length,
        totalCustomerRefund: totalCustomerRefundDec.toFixed(2),
        totalCustomerPcs,
        totalSupplierReturns: supplierReturns.length,
        totalSupplierPcs,
        totalSupplierEstimatedCredit: totalSupplierCreditDec.toFixed(2),
        reasonDistribution,
      },
      creditNotes,
      supplierReturns,
    };
  }

  /**
   * RPT-11: Stock Movement Ledger
   */
  async getStockMovementLedger(query: DateRangeQuery & { type?: string; itemId?: string }) {
    const { start, end } = resolveDhakaDateRange(query.startDate, query.endDate);
    const filter: any = {};
    if (start || end) {
      filter.timestamp = {};
      if (start) filter.timestamp.$gte = start;
      if (end) filter.timestamp.$lte = end;
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.itemId && Types.ObjectId.isValid(query.itemId)) {
      filter.itemId = new Types.ObjectId(query.itemId);
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      StockMovement.find(filter)
        .populate('itemId', 'tradeName genericName itemCode')
        .populate('batchId', 'batchNumber expiryDate')
        .populate('userId', 'fullName username role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockMovement.countDocuments(filter),
    ]);

    return {
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

export const reportService = new ReportService();
