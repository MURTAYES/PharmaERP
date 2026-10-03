import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { reportApi, DateQueryFilter } from '../services/reportApi';
import { exportToCSV } from '../utils/csvExporter';
import { useAuth } from '../context/AuthContext';

type ReportTab =
  | 'sales_summary'
  | 'sales_by_item'
  | 'profit_loss'
  | 'price_overrides'
  | 'non_fefo'
  | 'stock_valuation'
  | 'returns'
  | 'stock_ledger';

export const Reports: React.FC = () => {
  const { role } = useAuth();
  const isOwner = role === 'owner';

  const [activeTab, setActiveTab] = useState<ReportTab>('sales_summary');

  // Filter toolbar state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default last 30 days
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('');

  // Data state
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const fetchCurrentReport = useCallback(async () => {
    setLoading(true);
    try {
      const filter: DateQueryFilter = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: search.trim() || undefined,
        type: movementType || undefined,
      };

      let res: any;
      if (activeTab === 'sales_summary') {
        res = await reportApi.getSalesSummary(filter);
      } else if (activeTab === 'sales_by_item') {
        res = await reportApi.getSalesByItem(filter);
      } else if (activeTab === 'profit_loss') {
        res = await reportApi.getProfitAndLoss(filter);
      } else if (activeTab === 'price_overrides') {
        res = await reportApi.getPriceOverrides(filter);
      } else if (activeTab === 'non_fefo') {
        res = await reportApi.getNonFefo(filter);
      } else if (activeTab === 'stock_valuation') {
        res = await reportApi.getStockValuation();
      } else if (activeTab === 'returns') {
        res = await reportApi.getReturnsReport(filter);
      } else if (activeTab === 'stock_ledger') {
        res = await reportApi.getStockMovementLedger(filter);
      }
      setReportData(res);
    } catch (err) {
      console.error('Failed to load report data', err);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, search, movementType]);

  useEffect(() => {
    fetchCurrentReport();
  }, [fetchCurrentReport]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!reportData) return;

    if (activeTab === 'sales_summary') {
      exportToCSV(
        'Sales_Summary_Report',
        [
          { header: 'Date', accessor: 'date' },
          { header: 'Invoice Count', accessor: 'invoiceCount' },
          { header: 'Pieces Sold', accessor: 'piecesSold' },
          { header: 'Subtotal (৳)', accessor: 'subtotal' },
          { header: 'Discount (৳)', accessor: 'discount' },
          { header: 'Charges (৳)', accessor: 'charges' },
          { header: 'Grand Total (৳)', accessor: 'grandTotal' },
        ],
        reportData.dailyBreakdown || []
      );
    } else if (activeTab === 'sales_by_item') {
      exportToCSV(
        'Sales_By_Item_Report',
        [
          { header: 'Trade Name', accessor: 'tradeName' },
          { header: 'Generic Name', accessor: 'genericName' },
          { header: 'Transaction Count', accessor: 'transactionCount' },
          { header: 'Total Pieces Sold', accessor: 'totalPiecesSold' },
          { header: 'Total Revenue (৳)', accessor: 'totalRevenue' },
          { header: 'Avg Price / Pc (৳)', accessor: 'avgPricePerPiece' },
        ],
        reportData.items || []
      );
    } else if (activeTab === 'profit_loss') {
      exportToCSV(
        'Profit_And_Loss_Report',
        [
          { header: 'Trade Name', accessor: 'tradeName' },
          { header: 'Generic Name', accessor: 'genericName' },
          { header: 'Quantity Sold (pcs)', accessor: 'quantityPieces' },
          { header: 'Revenue (৳)', accessor: 'revenue' },
          { header: 'Cost (৳)', accessor: 'cost' },
          { header: 'Gross Profit (৳)', accessor: 'profit' },
          { header: 'Margin (%)', accessor: (r) => `${r.marginPercent}%` },
          { header: 'Uncosted Pieces', accessor: 'uncostedPieces' },
        ],
        reportData.itemBreakdown || []
      );
    } else if (activeTab === 'price_overrides') {
      exportToCSV(
        'Price_Override_Audit',
        [
          { header: 'Invoice #', accessor: 'invoiceNumber' },
          { header: 'Date', accessor: (r) => format(new Date(r.date), 'dd/MM/yyyy hh:mm a') },
          { header: 'Billed By', accessor: 'billedByName' },
          { header: 'Medicine', accessor: 'tradeName' },
          { header: 'Unit', accessor: 'unit' },
          { header: 'Quantity', accessor: 'quantity' },
          { header: 'Original Price (৳)', accessor: 'originalUnitPrice' },
          { header: 'Overridden Price (৳)', accessor: 'overriddenUnitPrice' },
          { header: 'Variance (৳)', accessor: 'variance' },
          { header: 'Line Total (৳)', accessor: 'lineTotal' },
        ],
        reportData.overrides || []
      );
    } else if (activeTab === 'non_fefo') {
      exportToCSV(
        'Non_FEFO_Audit',
        [
          { header: 'Invoice #', accessor: 'invoiceNumber' },
          { header: 'Date', accessor: (r) => format(new Date(r.date), 'dd/MM/yyyy') },
          { header: 'Billed By', accessor: 'billedByName' },
          { header: 'Medicine', accessor: 'tradeName' },
          { header: 'Chosen Batch', accessor: 'chosenBatchNumber' },
          { header: 'Suggested FEFO Batch', accessor: 'suggestedFefoBatchNumber' },
          { header: 'Quantity (pcs)', accessor: 'quantityPieces' },
          { header: 'Line Total (৳)', accessor: 'lineTotal' },
        ],
        reportData.nonFefoLines || []
      );
    } else if (activeTab === 'stock_valuation') {
      exportToCSV(
        'Stock_Valuation_Report',
        [
          { header: 'Batch No', accessor: 'batchNumber' },
          { header: 'Trade Name', accessor: 'tradeName' },
          { header: 'Generic Name', accessor: 'genericName' },
          { header: 'Category', accessor: 'category' },
          { header: 'Expiry Date', accessor: (r) => format(new Date(r.expiryDate), 'dd/MM/yyyy') },
          { header: 'Sellable (pcs)', accessor: 'qtySellable' },
          { header: 'Damaged (pcs)', accessor: 'qtyDamaged' },
          { header: 'Expired (pcs)', accessor: 'qtyExpired' },
          { header: 'Retail MRP / Pc (৳)', accessor: 'mrpPerPiece' },
          { header: 'Cost / Pc (৳)', accessor: (r) => r.costPerPiece || 'Missing' },
          { header: 'Retail Valuation (৳)', accessor: 'retailValuation' },
          { header: 'Cost Valuation (৳)', accessor: 'costValuation' },
          { header: 'Supplier', accessor: 'supplierName' },
        ],
        reportData.batches || []
      );
    } else if (activeTab === 'returns') {
      exportToCSV(
        'Customer_Credit_Notes',
        [
          { header: 'Credit Note #', accessor: 'creditNoteNumber' },
          { header: 'Original Invoice #', accessor: 'invoiceNumber' },
          { header: 'Date', accessor: (r) => format(new Date(r.createdAt), 'dd/MM/yyyy') },
          { header: 'Customer', accessor: (r) => r.customerName || 'Counter' },
          { header: 'Processed By', accessor: 'processedByName' },
          { header: 'Reason', accessor: 'reasonCategory' },
          { header: 'Subtotal Refund (৳)', accessor: 'subtotalRefund' },
          { header: 'Discount Adj (৳)', accessor: 'discountRefund' },
          { header: 'Grand Refund (৳)', accessor: 'grandTotalRefund' },
          { header: 'Refund Method', accessor: 'refundMethod' },
        ],
        reportData.creditNotes || []
      );
    } else if (activeTab === 'stock_ledger') {
      exportToCSV(
        'Stock_Movement_Ledger',
        [
          { header: 'Timestamp', accessor: (r) => format(new Date(r.timestamp), 'dd/MM/yyyy hh:mm a') },
          { header: 'Medicine', accessor: (r) => r.itemId?.tradeName || 'Medicine' },
          { header: 'Batch No', accessor: (r) => r.batchId?.batchNumber || '—' },
          { header: 'Type', accessor: 'type' },
          { header: 'Qty Change (pcs)', accessor: 'qtyChangePieces' },
          { header: 'From Bucket', accessor: (r) => r.bucketFrom || '—' },
          { header: 'To Bucket', accessor: (r) => r.bucketTo || '—' },
          { header: 'Staff', accessor: (r) => r.userId?.fullName || 'System' },
          { header: 'Detail', accessor: 'reasonDetail' },
        ],
        reportData.movements || []
      );
    }
  };

  if (!isOwner) {
    return (
      <div className="p-12 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">lock</span>
        <h2 className="text-base font-bold text-slate-900">Owner Access Required</h2>
        <p className="text-xs text-slate-500">Analytics and reporting are restricted to pharmacy owners.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Header Banner */}
      <div className="w-full bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-clinical border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-container/15 flex items-center justify-center text-primary shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[28px]">analytics</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              Executive Analytics & Report Center
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Sales performance, profit & loss, price override audits, FEFO compliance, stock valuations, and universal CSV exports.
            </p>
          </div>
        </div>

        <Button variant="primary" onClick={handleExportCSV} className="gap-1.5" disabled={loading || !reportData}>
          <span className="material-symbols-outlined text-[20px]">download</span>
          Export to CSV
        </Button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-surface-container">
        {[
          { id: 'sales_summary', label: 'Sales Summary', icon: 'payments' },
          { id: 'sales_by_item', label: 'Sales by Item', icon: 'medication' },
          { id: 'profit_loss', label: 'Profit & Loss', icon: 'trending_up' },
          { id: 'price_overrides', label: 'Price Overrides', icon: 'price_change' },
          { id: 'non_fefo', label: 'Non-FEFO Audit', icon: 'warning' },
          { id: 'stock_valuation', label: 'Stock Valuation', icon: 'inventory_2' },
          { id: 'returns', label: 'Returns & Credits', icon: 'assignment_return' },
          { id: 'stock_ledger', label: 'Movement Ledger', icon: 'history' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Toolbar */}
      {activeTab !== 'stock_valuation' && (
        <Card className="p-4 bg-surface-container-lowest">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-semibold">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low border border-transparent rounded-xl text-xs text-on-surface focus:bg-surface-container-lowest focus:border-primary focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-semibold">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-low border border-transparent rounded-xl text-xs text-on-surface focus:bg-surface-container-lowest focus:border-primary focus:outline-none font-mono"
              />
            </div>

            {(activeTab === 'sales_by_item' || activeTab === 'stock_ledger') && (
              <div className="relative md:col-span-2">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter by medicine brand or generic name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-surface-container-low border border-transparent rounded-xl text-xs text-on-surface focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {activeTab === 'stock_ledger' && (
              <div className="md:col-span-2">
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-container-low border border-transparent rounded-xl text-xs text-on-surface focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
                >
                  <option value="">All Movement Types</option>
                  <option value="RECEIVE">RECEIVE (Stock In)</option>
                  <option value="SALE_DEDUCT">SALE_DEDUCT (POS Sale)</option>
                  <option value="RETURN_RESTOCK">RETURN_RESTOCK (Sales Return)</option>
                  <option value="ADJUST_TRANSFER">ADJUST_TRANSFER (Bucket Adjustment)</option>
                  <option value="WRITE_OFF">WRITE_OFF (Spoilage Disposal)</option>
                  <option value="SUPPLIER_RETURN">SUPPLIER_RETURN (Distributor Return)</option>
                </select>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Report Content Container */}
      <Card className="p-0 overflow-hidden border-outline-variant/30">
        {loading ? (
          <div className="py-24 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl animate-spin text-primary block mb-2 mx-auto">
              progress_activity
            </span>
            Compiling analytical report...
          </div>
        ) : !reportData ? (
          <div className="py-20 text-center text-on-surface-variant text-xs">No data returned.</div>
        ) : (
          <div>
            {/* Tab 1: Sales Summary */}
            {activeTab === 'sales_summary' && (
              <div className="space-y-4 p-5">
                {/* Summary KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-teal-800 uppercase">Total Revenue</span>
                    <span className="text-xl font-mono font-black text-teal-950 block mt-1">
                      ৳ {reportData.totals?.grandTotal}
                    </span>
                  </div>
                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-sky-800 uppercase">Invoices Billed</span>
                    <span className="text-xl font-mono font-black text-sky-950 block mt-1">
                      {reportData.totals?.totalInvoices}
                    </span>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-purple-800 uppercase">Discounts Given</span>
                    <span className="text-xl font-mono font-black text-purple-950 block mt-1">
                      ৳ {reportData.totals?.totalDiscount}
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">Pieces Sold</span>
                    <span className="text-xl font-mono font-black text-emerald-950 block mt-1">
                      {reportData.totals?.totalPiecesSold} pcs
                    </span>
                  </div>
                </div>

                {/* Daily Breakdown Table */}
                <div className="overflow-x-auto rounded-2xl border border-surface-container">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase border-b border-surface-container">
                      <tr>
                        <th className="p-3.5">Date</th>
                        <th className="p-3.5">Invoices</th>
                        <th className="p-3.5">Pieces Sold</th>
                        <th className="p-3.5">Subtotal</th>
                        <th className="p-3.5">Discount</th>
                        <th className="p-3.5">Charges</th>
                        <th className="p-3.5 text-right">Grand Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-mono">
                      {reportData.dailyBreakdown?.map((d: any) => (
                        <tr key={d.date} className="hover:bg-surface-container-low/50">
                          <td className="p-3.5 font-bold text-on-surface font-sans">{d.date}</td>
                          <td className="p-3.5">{d.invoiceCount}</td>
                          <td className="p-3.5">{d.piecesSold} pcs</td>
                          <td className="p-3.5">৳ {d.subtotal}</td>
                          <td className="p-3.5 text-purple-700">৳ {d.discount}</td>
                          <td className="p-3.5">৳ {d.charges}</td>
                          <td className="p-3.5 text-right font-bold text-emerald-800">৳ {d.grandTotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Sales by Item */}
            {activeTab === 'sales_by_item' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase border-b border-surface-container">
                    <tr>
                      <th className="p-4">Medicine</th>
                      <th className="p-4">Transactions</th>
                      <th className="p-4">Units Sold</th>
                      <th className="p-4">Avg Price / Pc</th>
                      <th className="p-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {reportData.items?.map((itm: any) => (
                      <tr key={itm.itemId} className="hover:bg-surface-container-low/50">
                        <td className="p-4">
                          <span className="font-bold text-on-surface block">{itm.tradeName}</span>
                          <span className="text-[11px] text-on-surface-variant">{itm.genericName}</span>
                        </td>
                        <td className="p-4 font-mono">{itm.transactionCount} bills</td>
                        <td className="p-4 font-mono font-bold text-on-surface">
                          {itm.totalPiecesSold} pcs
                        </td>
                        <td className="p-4 font-mono text-primary font-semibold">
                          ৳ {itm.avgPricePerPiece}
                        </td>
                        <td className="p-4 text-right font-mono font-extrabold text-sm text-emerald-900">
                          ৳ {itm.totalRevenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Profit & Loss */}
            {activeTab === 'profit_loss' && (
              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-teal-800 uppercase">Total Revenue</span>
                    <span className="text-xl font-mono font-black text-teal-950 block mt-1">
                      ৳ {reportData.summary?.totalRevenue}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-slate-800 uppercase">Total Cost (COGS)</span>
                    <span className="text-xl font-mono font-black text-slate-900 block mt-1">
                      ৳ {reportData.summary?.totalCost}
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">Gross Profit</span>
                    <span className="text-xl font-mono font-black text-emerald-950 block mt-1">
                      ৳ {reportData.summary?.grossProfit}
                    </span>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-purple-800 uppercase">Profit Margin</span>
                    <span className="text-xl font-mono font-black text-purple-950 block mt-1">
                      {reportData.summary?.profitMarginPercent}%
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-surface-container">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase border-b border-surface-container">
                      <tr>
                        <th className="p-3.5">Medicine</th>
                        <th className="p-3.5">Quantity (pcs)</th>
                        <th className="p-3.5">Revenue</th>
                        <th className="p-3.5">Cost</th>
                        <th className="p-3.5">Gross Profit</th>
                        <th className="p-3.5 text-right">Margin (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-mono">
                      {reportData.itemBreakdown?.map((p: any) => (
                        <tr key={p.itemId} className="hover:bg-surface-container-low/50">
                          <td className="p-3.5 font-sans">
                            <span className="font-bold text-on-surface block">{p.tradeName}</span>
                            {p.uncostedPieces > 0 && (
                              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                                {p.uncostedPieces} pcs cost missing
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">{p.quantityPieces}</td>
                          <td className="p-3.5">৳ {p.revenue}</td>
                          <td className="p-3.5 text-slate-600">৳ {p.cost}</td>
                          <td className="p-3.5 font-bold text-emerald-800">৳ {p.profit}</td>
                          <td className="p-3.5 text-right font-bold text-purple-800">
                            {p.marginPercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Price Overrides Audit */}
            {activeTab === 'price_overrides' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase border-b border-surface-container">
                    <tr>
                      <th className="p-4">Invoice # & Date</th>
                      <th className="p-4">Cashier</th>
                      <th className="p-4">Medicine</th>
                      <th className="p-4">Qty & Unit</th>
                      <th className="p-4">Original MRP</th>
                      <th className="p-4">Overridden Price</th>
                      <th className="p-4 text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container font-mono">
                    {reportData.overrides?.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-on-surface-variant font-sans">
                          No price overrides recorded in selected date range.
                        </td>
                      </tr>
                    ) : (
                      reportData.overrides?.map((ov: any, idx: number) => (
                        <tr key={idx} className="hover:bg-surface-container-low/50">
                          <td className="p-4 font-sans">
                            <span className="font-bold text-primary font-mono block">{ov.invoiceNumber}</span>
                            <span className="text-[11px] text-on-surface-variant font-mono">
                              {format(new Date(ov.date), 'dd/MM/yyyy hh:mm a')}
                            </span>
                          </td>
                          <td className="p-4 font-sans font-semibold">{ov.billedByName}</td>
                          <td className="p-4 font-sans">
                            <span className="font-bold text-on-surface block">{ov.tradeName}</span>
                            <span className="text-[11px] text-on-surface-variant">{ov.genericName}</span>
                          </td>
                          <td className="p-4">
                            {ov.quantity} {ov.unit} ({ov.quantityPieces} pcs)
                          </td>
                          <td className="p-4 text-slate-500">৳ {ov.originalUnitPrice}</td>
                          <td className="p-4 font-bold text-primary">৳ {ov.overriddenUnitPrice}</td>
                          <td className="p-4 text-right font-extrabold text-purple-700">
                            ৳ {ov.variance}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 5: Non-FEFO Audit */}
            {activeTab === 'non_fefo' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase border-b border-surface-container">
                    <tr>
                      <th className="p-4">Invoice & Date</th>
                      <th className="p-4">Cashier</th>
                      <th className="p-4">Medicine</th>
                      <th className="p-4">Chosen Batch</th>
                      <th className="p-4">Suggested FEFO Batch</th>
                      <th className="p-4 text-right">Quantity Sold</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {reportData.nonFefoLines?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-on-surface-variant font-sans">
                          No non-FEFO batch overrides recorded in selected date range.
                        </td>
                      </tr>
                    ) : (
                      reportData.nonFefoLines?.map((nf: any, idx: number) => (
                        <tr key={idx} className="hover:bg-surface-container-low/50 font-mono">
                          <td className="p-4 font-sans">
                            <span className="font-bold text-primary font-mono block">{nf.invoiceNumber}</span>
                            <span className="text-[11px] text-on-surface-variant">
                              {format(new Date(nf.date), 'dd/MM/yyyy')}
                            </span>
                          </td>
                          <td className="p-4 font-sans font-semibold">{nf.billedByName}</td>
                          <td className="p-4 font-sans font-bold text-on-surface">{nf.tradeName}</td>
                          <td className="p-4 font-bold text-amber-800 bg-amber-50 rounded">
                            {nf.chosenBatchNumber}
                          </td>
                          <td className="p-4 text-slate-500">{nf.suggestedFefoBatchNumber}</td>
                          <td className="p-4 text-right font-bold text-on-surface">
                            {nf.quantityPieces} pcs
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 6: Stock Valuation */}
            {activeTab === 'stock_valuation' && (
              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-teal-800 uppercase">Retail Worth (MRP)</span>
                    <span className="text-xl font-mono font-black text-teal-950 block mt-1">
                      ৳ {reportData.summary?.totalRetailValuation}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-slate-800 uppercase">Cost Worth</span>
                    <span className="text-xl font-mono font-black text-slate-900 block mt-1">
                      ৳ {reportData.summary?.totalCostValuation}
                    </span>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase">Potential Margin</span>
                    <span className="text-xl font-mono font-black text-emerald-950 block mt-1">
                      ৳ {reportData.summary?.potentialGrossProfit}
                    </span>
                  </div>
                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-sky-800 uppercase">Total Sellable Pieces</span>
                    <span className="text-xl font-mono font-black text-sky-950 block mt-1">
                      {reportData.summary?.totalSellablePieces} pcs
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-surface-container">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase border-b border-surface-container">
                      <tr>
                        <th className="p-3.5">Medicine & Batch</th>
                        <th className="p-3.5">Expiry</th>
                        <th className="p-3.5">Sellable (pcs)</th>
                        <th className="p-3.5">Retail Price</th>
                        <th className="p-3.5">Cost Price</th>
                        <th className="p-3.5 text-right">Retail Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-mono">
                      {reportData.batches?.map((b: any) => (
                        <tr key={b.batchId} className="hover:bg-surface-container-low/50">
                          <td className="p-3.5 font-sans">
                            <span className="font-bold text-on-surface block">{b.tradeName}</span>
                            <span className="text-[11px] font-mono text-primary font-bold">
                              Batch: {b.batchNumber}
                            </span>
                          </td>
                          <td className="p-3.5">{format(new Date(b.expiryDate), 'dd/MM/yyyy')}</td>
                          <td className="p-3.5 font-bold text-on-surface">{b.qtySellable}</td>
                          <td className="p-3.5">৳ {b.mrpPerPiece}</td>
                          <td className="p-3.5 text-slate-600">
                            {b.costPerPiece ? `৳ ${b.costPerPiece}` : 'Cost Missing'}
                          </td>
                          <td className="p-3.5 text-right font-bold text-emerald-800">
                            ৳ {b.retailValuation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 7: Returns & Credits */}
            {activeTab === 'returns' && (
              <div className="space-y-4 p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-purple-800 uppercase">Customer Credit Notes</span>
                    <span className="text-xl font-mono font-black text-purple-950 block mt-1">
                      {reportData.summary?.totalCreditNotes} vouchers
                    </span>
                  </div>
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-rose-800 uppercase">Total Refunded</span>
                    <span className="text-xl font-mono font-black text-rose-950 block mt-1">
                      ৳ {reportData.summary?.totalCustomerRefund}
                    </span>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-amber-800 uppercase">Supplier Returns</span>
                    <span className="text-xl font-mono font-black text-amber-950 block mt-1">
                      {reportData.summary?.totalSupplierReturns} vouchers
                    </span>
                  </div>
                  <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                    <span className="text-[11px] font-bold text-teal-800 uppercase">Returned Pieces</span>
                    <span className="text-xl font-mono font-black text-teal-950 block mt-1">
                      {reportData.summary?.totalCustomerPcs} pcs
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-surface-container">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase border-b border-surface-container">
                      <tr>
                        <th className="p-3.5">Credit Note #</th>
                        <th className="p-3.5">Invoice #</th>
                        <th className="p-3.5">Customer & Staff</th>
                        <th className="p-3.5">Reason</th>
                        <th className="p-3.5 text-right">Grand Refund</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container font-mono">
                      {reportData.creditNotes?.map((cn: any) => (
                        <tr key={cn._id} className="hover:bg-surface-container-low/50">
                          <td className="p-3.5 font-bold text-primary">{cn.creditNoteNumber}</td>
                          <td className="p-3.5 font-sans font-semibold">{cn.invoiceNumber}</td>
                          <td className="p-3.5 font-sans">
                            <span className="font-bold text-on-surface block">
                              {cn.customerName || 'Counter'}
                            </span>
                            <span className="text-[11px] text-on-surface-variant">By {cn.processedByName}</span>
                          </td>
                          <td className="p-3.5 font-sans">
                            <Badge variant="warning">{cn.reasonCategory}</Badge>
                          </td>
                          <td className="p-3.5 text-right font-black text-rose-800">
                            ৳ {parseFloat(cn.grandTotalRefund).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 8: Movement Ledger */}
            {activeTab === 'stock_ledger' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase border-b border-surface-container">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Medicine</th>
                      <th className="p-4">Batch</th>
                      <th className="p-4">Movement Type</th>
                      <th className="p-4">Delta (pcs)</th>
                      <th className="p-4">Bucket Routing</th>
                      <th className="p-4">Staff & Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container font-mono">
                    {reportData.movements?.map((m: any) => (
                      <tr key={m._id} className="hover:bg-surface-container-low/50">
                        <td className="p-4 text-on-surface-variant">
                          {format(new Date(m.timestamp), 'dd/MM/yyyy hh:mm a')}
                        </td>
                        <td className="p-4 font-sans font-bold text-on-surface">
                          {m.itemId?.tradeName || 'Medicine'}
                        </td>
                        <td className="p-4 font-bold text-primary">{m.batchId?.batchNumber || '—'}</td>
                        <td className="p-4 font-sans">
                          <Badge
                            variant={
                              m.type === 'RECEIVE' || m.type === 'RETURN_RESTOCK'
                                ? 'success'
                                : m.type === 'WRITE_OFF'
                                ? 'error'
                                : 'neutral'
                            }
                          >
                            {m.type}
                          </Badge>
                        </td>
                        <td
                          className={`p-4 font-extrabold ${
                            m.qtyChangePieces > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {m.qtyChangePieces > 0 ? `+${m.qtyChangePieces}` : m.qtyChangePieces}
                        </td>
                        <td className="p-4 font-sans text-[11px]">
                          {m.bucketFrom && <span>{m.bucketFrom} → </span>}
                          <strong>{m.bucketTo || 'shelf'}</strong>
                        </td>
                        <td className="p-4 font-sans">
                          <span className="font-bold text-on-surface block">
                            {m.userId?.fullName || 'System'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant italic">
                            {m.reasonDetail}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
