import mongoose, { Types } from 'mongoose';
import Decimal from 'decimal.js';
import { Invoice } from '../models/Invoice.js';
import { CreditNote } from '../models/CreditNote.js';
import { SupplierReturn } from '../models/SupplierReturn.js';
import { Batch } from '../models/Batch.js';
import { Item } from '../models/Item.js';
import { StockMovement } from '../models/StockMovement.js';

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
   * RPT-01: Executive Dashboard Live Metrics
   */
  async getDashboardKPIs() {
    const now = new Date();
    // Format YYYY-MM-DD in Asia/Dhaka
    const dhakaDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const todayStart = new Date(`${dhakaDateStr}T00:00:00+06:00`);
    const todayEnd = new Date(`${dhakaDateStr}T23:59:59.999+06:00`);

    // Yesterday
    const yesterdayDate = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yestStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(yesterdayDate);
    const yesterdayStart = new Date(`${yestStr}T00:00:00+06:00`);
    const yesterdayEnd = new Date(`${yestStr}T23:59:59.999+06:00`);

    // 7 Days ago
    const sevenDaysAgoStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);

    const [
      todayInvoices,
      yesterdayInvoices,
      sevenDaysInvoices,
      allBatches,
      allCreditNotesToday,
    ] = await Promise.all([
      Invoice.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
      Invoice.find({ createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd } }).lean(),
      Invoice.find({ createdAt: { $gte: sevenDaysAgoStart, $lte: todayEnd } }).lean(),
      Batch.find().lean(),
      CreditNote.find({ createdAt: { $gte: todayStart, $lte: todayEnd } }).lean(),
    ]);

    // Calculate Today Sales
    let todaySalesDec = new Decimal(0);
    let todayPaymentSplit = { cash: new Decimal(0), card: new Decimal(0), mfs: new Decimal(0) };
    const itemSalesMap = new Map<string, { tradeName: string; genericName: string; pcs: number; revenue: any }>();

    for (const inv of todayInvoices) {
      const gTotal = new Decimal(inv.grandTotal?.toString() || 0);
      todaySalesDec = todaySalesDec.plus(gTotal);

      if (inv.payment?.method === 'cash') {
        todayPaymentSplit.cash = todayPaymentSplit.cash.plus(gTotal);
      } else if (inv.payment?.method === 'card') {
        todayPaymentSplit.card = todayPaymentSplit.card.plus(gTotal);
      } else if (inv.payment?.method === 'mfs') {
        todayPaymentSplit.mfs = todayPaymentSplit.mfs.plus(gTotal);
      } else if (inv.payment?.method === 'split' && inv.payment.splitDetails) {
        if (inv.payment.splitDetails.cashAmount) {
          todayPaymentSplit.cash = todayPaymentSplit.cash.plus(new Decimal(inv.payment.splitDetails.cashAmount.toString()));
        }
        if (inv.payment.splitDetails.cardAmount) {
          todayPaymentSplit.card = todayPaymentSplit.card.plus(new Decimal(inv.payment.splitDetails.cardAmount.toString()));
        }
        if (inv.payment.splitDetails.mfsAmount) {
          todayPaymentSplit.mfs = todayPaymentSplit.mfs.plus(new Decimal(inv.payment.splitDetails.mfsAmount.toString()));
        }
      }

      for (const line of inv.lines) {
        const key = line.itemId.toString();
        const prev = itemSalesMap.get(key) || {
          tradeName: line.tradeName,
          genericName: line.genericName,
          pcs: 0,
          revenue: new Decimal(0),
        };
        prev.pcs += line.quantityPieces;
        prev.revenue = prev.revenue.plus(new Decimal(line.lineTotal?.toString() || 0));
        itemSalesMap.set(key, prev);
      }
    }

    // Today Refunds
    let todayRefundsDec = new Decimal(0);
    for (const cn of allCreditNotesToday) {
      todayRefundsDec = todayRefundsDec.plus(new Decimal(cn.grandTotalRefund?.toString() || 0));
    }

    // Yesterday Sales
    let yesterdaySalesDec = new Decimal(0);
    for (const inv of yesterdayInvoices) {
      yesterdaySalesDec = yesterdaySalesDec.plus(new Decimal(inv.grandTotal?.toString() || 0));
    }

    // 7 Days Daily Trend
    const dailyTrendMap = new Map<string, { date: string; sales: any; count: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgoStart.getTime() + i * 24 * 60 * 60 * 1000);
      const ds = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
      dailyTrendMap.set(ds, { date: ds, sales: new Decimal(0), count: 0 });
    }

    for (const inv of sevenDaysInvoices) {
      const invDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(inv.createdAt));
      const entry = dailyTrendMap.get(invDateStr);
      if (entry) {
        entry.sales = entry.sales.plus(new Decimal(inv.grandTotal?.toString() || 0));
        entry.count += 1;
      }
    }

    // Expiry Alerts
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

    // Top 5 Best-Selling Medicines
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

    // Sales growth percentage compared to yesterday
    let salesGrowthPercent = 0;
    if (yesterdaySalesDec.greaterThan(0)) {
      salesGrowthPercent = todaySalesDec
        .minus(yesterdaySalesDec)
        .dividedBy(yesterdaySalesDec)
        .times(100)
        .toDecimalPlaces(1)
        .toNumber();
    }

    return {
      today: {
        date: dhakaDateStr,
        grossSales: todaySalesDec.toFixed(2),
        refunds: todayRefundsDec.toFixed(2),
        netSales: todaySalesDec.minus(todayRefundsDec).toFixed(2),
        invoiceCount: todayInvoices.length,
        averageTicketSize:
          todayInvoices.length > 0
            ? todaySalesDec.dividedBy(todayInvoices.length).toFixed(2)
            : '0.00',
        salesGrowthPercent,
        paymentSplit: {
          cash: todayPaymentSplit.cash.toFixed(2),
          card: todayPaymentSplit.card.toFixed(2),
          mfs: todayPaymentSplit.mfs.toFixed(2),
        },
      },
      yesterday: {
        date: yestStr,
        grossSales: yesterdaySalesDec.toFixed(2),
        invoiceCount: yesterdayInvoices.length,
      },
      sevenDaysTrend: Array.from(dailyTrendMap.values()).map((t) => ({
        date: t.date,
        sales: t.sales.toFixed(2),
        count: t.count,
      })),
      alerts: {
        expired: expiredBatches,
        critical30: critical30Batches,
        warning60: warning60Batches,
        notice90: notice90Batches,
        totalAlerts: expiredBatches + critical30Batches + warning60Batches + notice90Batches,
      },
      topMedicines,
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
