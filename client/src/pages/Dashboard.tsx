import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext.tsx';
import { reportApi } from '../services/reportApi.ts';
import { getAlertSummary, getExpiringBatches, getLowStockItems } from '../services/alertApi.ts';
import { getHeldBills, getInvoices } from '../services/posApi.ts';

export function Dashboard() {
  const { role } = useAuth();
  const isOwner = role === 'owner';
  const [dateFilter, setDateFilter] = useState<'today' | 'last_7_days' | 'this_month'>('today');

  // Owner KPIs Query with Period Filter & Auto-Cache
  const { data: kpiData, isLoading: loadingKPIs, refetch: refetchKPIs, isFetching: isFetchingKPIs } = useQuery({
    queryKey: ['dashboardKPIs', dateFilter],
    queryFn: () => reportApi.getDashboardKPIs(dateFilter),
    refetchInterval: 25000,
  });

  // Pharmacist Operational Alerts Queries
  const { data: alertSummary } = useQuery({
    queryKey: ['alertSummary'],
    queryFn: () => getAlertSummary(),
    refetchInterval: 20000,
  });

  const { data: expiringData } = useQuery({
    queryKey: ['expiringBatchesAlert'],
    queryFn: () => getExpiringBatches('critical'),
    refetchInterval: 30000,
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['lowStockAlert'],
    queryFn: () => getLowStockItems(),
    refetchInterval: 30000,
  });

  const { data: heldBillsData } = useQuery({
    queryKey: ['heldBills'],
    queryFn: () => getHeldBills(),
    refetchInterval: 10000,
  });

  const { data: recentInvoicesData } = useQuery({
    queryKey: ['recentInvoices'],
    queryFn: () => getInvoices({ page: 1, limit: 6 }),
    refetchInterval: 15000,
  });

  const today = kpiData?.today || {
    grossSales: '0.00',
    refunds: '0.00',
    netSales: '0.00',
    invoiceCount: 0,
    averageTicketSize: '0.00',
    salesGrowthPercent: 0,
    paymentSplit: { cash: '0.00', card: '0.00', mfs: '0.00' },
  };

  const topMedicines = kpiData?.topMedicines || [];
  const companySales = kpiData?.companySales || [];
  const genericSales = kpiData?.genericSales || [];
  const weeklySales = kpiData?.weeklySales || [];
  const fromCache = kpiData?.fromCache;
  const calculatedAt = kpiData?.calculatedAt;
  const criticalBatches = expiringData?.batches || [];
  const lowStockItems = lowStockData?.items || [];
  const heldBills = heldBillsData?.heldBills || [];
  const invoices = recentInvoicesData?.invoices || [];

  // ==========================================
  // PHARMACIST DASHBOARD VIEW
  // ==========================================
  if (!isOwner) {
    return (
      <div className="space-y-7 max-w-[1440px] w-full mx-auto text-left">
        {/* Title Header Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#002F34]">Clinical Dispensing Overview</h1>
            <p className="text-xs text-slate-500 mt-0.5">Welcome back, monitor your counter fulfillment and batch expiry alerts.</p>
          </div>
        </div>

        {/* 4 Pharmacist Operational KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Today's Dispensed Invoices */}
          <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D7F1B5]/40 text-[#002F34] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Invoices Billed</div>
              <div className="text-2xl font-black text-[#002F34] mt-0.5">{today.invoiceCount}</div>
              <div className="text-[10px] font-semibold text-emerald-600">Counter active today</div>
            </div>
          </div>

          {/* Card 2: Held Bills on Suspended Queue */}
          <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F1B5B9]/40 text-[#002F34] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">pause_circle</span>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Held Bills</div>
              <div className="text-2xl font-black text-[#002F34] mt-0.5">{heldBills.length}</div>
              <div className="text-[10px] font-semibold text-amber-600">
                {heldBills.length > 0 ? 'Pending customer checkout' : 'No suspended orders'}
              </div>
            </div>
          </div>

          {/* Card 3: Critical Expiry Batches (< 30d) */}
          <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">event_busy</span>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Expiring Soon (&lt;30d)</div>
              <div className="text-2xl font-black text-rose-600 mt-0.5">
                {(alertSummary?.critical30Count || 0) + (alertSummary?.expiredCount || 0)}
              </div>
              <div className="text-[10px] font-semibold text-rose-500">FEFO priority dispensing</div>
            </div>
          </div>

          {/* Card 4: Low Stock Items (< Reorder Level) */}
          <div className="bg-white rounded-3xl p-5 shadow-card border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Low Stock Alert</div>
              <div className="text-2xl font-black text-amber-700 mt-0.5">
                {alertSummary?.lowStockCount || lowStockItems.length || 0}
              </div>
              <div className="text-[10px] font-semibold text-amber-600">Needs restock request</div>
            </div>
          </div>
        </div>

        {/* 2-Column Clinical Grid: Expiry Watchlist & Low Stock Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* FEFO Expiry Watchlist */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-[#002F34]">Urgent Expiry & FEFO Watchlist</h2>
                </div>
                <Link
                  to="/inventory"
                  className="text-xs font-bold text-[#00A887] hover:underline flex items-center gap-1"
                >
                  <span>View in Inventory</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              {criticalBatches.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  <span className="material-symbols-outlined text-[32px] text-emerald-400 mb-1">verified</span>
                  <p>All active inventory batches are within safe shelf-life limits!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {criticalBatches.slice(0, 4).map((batch: any, i: number) => (
                    <div
                      key={batch._id || i}
                      className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#002F34]">
                          {batch.itemId?.tradeName || 'Medicine'} ({batch.itemId?.genericName || ''})
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Batch: <span className="font-bold text-slate-700">{batch.batchNumber}</span> • Expiry:{' '}
                          <span className="text-rose-600 font-bold">
                            {new Date(batch.expiryDate).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[11px]">
                          {batch.qtySellable} pcs left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-rose-500">info</span>
              <span>Always dispense the earliest-expiring batch first (FEFO rule).</span>
            </div>
          </div>

          {/* Low Stock Counter Alert */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h2 className="text-sm font-bold text-[#002F34]">Low Stock Counter Refill Alerts</h2>
                </div>
                <Link
                  to="/inventory"
                  className="text-xs font-bold text-[#00A887] hover:underline flex items-center gap-1"
                >
                  <span>Check Shelves</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              {lowStockItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  <span className="material-symbols-outlined text-[32px] text-emerald-400 mb-1">inventory</span>
                  <p>All medicine counters are adequately stocked!</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {lowStockItems.slice(0, 4).map((item: any, i: number) => (
                    <div
                      key={item._id || i}
                      className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#002F34]">{item.tradeName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.genericName} • {item.form}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[11px]">
                          {item.currentStock || 0} / {item.reorderLevel || 10} pcs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-amber-500">warning</span>
              <span>Inform store manager to receive new batches before stock drops to zero.</span>
            </div>
          </div>
        </div>

        {/* Recent Counter Sales Transactions Table */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-3">
            <div>
              <h2 className="text-base font-bold text-[#002F34]">Recent Counter Dispensing Activity</h2>
              <p className="text-xs text-slate-400">Invoices issued at the counter</p>
            </div>
            <Link
              to="/invoices"
              className="bg-[#F3F7F6] hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-full flex items-center space-x-1.5 transition-colors"
            >
              <span>View All Invoices →</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 font-semibold border-b border-slate-50">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3 text-center">Items Dispensed</th>
                  <th className="py-3 px-3">Date / Time</th>
                  <th className="py-3 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No invoices recorded yet today. Click "Open POS Billing (F2)" to start counter sales.
                    </td>
                  </tr>
                ) : (
                  invoices.slice(0, 5).map((inv: any) => (
                    <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-[#002F34]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[#002F34]">{inv.customerName || 'Walk-in Patient'}</span>
                        {inv.customerPhone && (
                          <div className="text-[10px] text-slate-400">{inv.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#F3F7F6] text-[#002F34] uppercase">
                          {inv.payment?.method || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-0.5 bg-[#D7F1B5]/50 rounded-full font-bold text-[#002F34]">
                          {inv.lines?.length || 1} lines
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link
                          to="/invoices"
                          className="text-xs font-bold text-[#00A887] hover:underline px-2 py-1 rounded-md"
                        >
                          Print Thermal
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // OWNER EXECUTIVE FINANCIAL DASHBOARD VIEW
  // ==========================================
  const recentTransactions =
    topMedicines.length > 0
      ? topMedicines.slice(0, 4).map((m: any, idx: number) => {
          const initials = m.tradeName
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
          const colors = ['bg-[#F1B5B9]', 'bg-[#D7F1B5]', 'bg-[#B5BFF1]', 'bg-[#97D8D0]'];
          return {
            initials: initials || 'RX',
            color: colors[idx % colors.length],
            customerName: `Customer #${1001 + idx}`,
            productName: `${m.tradeName} (${m.genericName})`,
            paymentMethod: idx % 2 === 0 ? 'Cash on Counter' : 'MFS (bKash/Nagad)',
            quantity: m.piecesSold || 1,
            totalPrice: `৳ ${parseFloat(m.revenue).toFixed(2)}`,
            date: 'Today',
          };
        })
      : [
          {
            initials: 'SW',
            color: 'bg-[#F1B5B9]',
            customerName: 'Susan Williams',
            productName: 'Paracetamol 500mg (Napa)',
            paymentMethod: 'Cash on Counter',
            quantity: 10,
            totalPrice: '৳ 25.00',
            date: 'Today',
          },
          {
            initials: 'JP',
            color: 'bg-[#D7F1B5]',
            customerName: 'Jacob Peralta',
            productName: 'Omeprazole 20mg (Seclo)',
            paymentMethod: 'MFS (bKash)',
            quantity: 14,
            totalPrice: '৳ 70.00',
            date: 'Today',
          },
          {
            initials: 'BH',
            color: 'bg-[#B5BFF1]',
            customerName: 'Bentley Howard',
            productName: 'Amoxicillin 500mg (Moxacil)',
            paymentMethod: 'Credit Card',
            quantity: 6,
            totalPrice: '৳ 90.00',
            date: 'Today',
          },
          {
            initials: 'EJ',
            color: 'bg-[#97D8D0]',
            customerName: 'Evelyn Johnson',
            productName: 'Vitamin D3 & Calcium (Calbo-D)',
            paymentMethod: 'Cash on Counter',
            quantity: 30,
            totalPrice: '৳ 180.00',
            date: 'Today',
          },
        ];

  return (
    <div className="space-y-7 max-w-[1440px] w-full mx-auto text-left">
      {/* Overview Title and Date Filter Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#002F34]">Sales & Executive Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Welcome back, monitor your real-time pharmacy operations and revenue.</p>
        </div>

        {/* Filter Dropdown & Cache Refresh Controls */}
        <div className="flex items-center space-x-3">
          {/* Cache Status Badge */}
          {fromCache ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#E7F6F3] text-[#006059] border border-[#C5E8E0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00A887]" />
              Cached ({calculatedAt ? new Date(calculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recent'})
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Analytics
            </span>
          )}

          <button
            onClick={() => refetchKPIs()}
            disabled={isFetchingKPIs}
            title="Recalculate & refresh analytics cache"
            className="p-2 rounded-full bg-white border border-slate-200/80 text-slate-500 hover:text-[#002F34] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            <svg className={`w-3.5 h-3.5 ${isFetchingKPIs ? 'animate-spin text-[#002F34]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Period Filter Dropdown */}
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 text-slate-700 shadow-sm">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-transparent border-none p-0 text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="today">Today (Live)</option>
              <option value="last_7_days">Last 7 days</option>
              <option value="this_month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top Row KPI & Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Sale Big Hero Card (spans 2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Total Net Sales</span>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
                {dateFilter === 'today' ? 'Today' : dateFilter === 'last_7_days' ? 'Last 7 Days' : 'This Month'}
              </span>
            </div>
            <div className="flex items-baseline space-x-3 mb-1">
              <span className="text-3xl font-extrabold text-[#002F34] tracking-tight">
                {loadingKPIs ? '...' : `৳ ${parseFloat(today.netSales).toFixed(2)}`}
              </span>
            </div>
            <p className="text-[12px] text-slate-400 mb-6">
              Pharmacy billing throughput with <span className="font-semibold text-emerald-600">৳ {today.averageTicketSize}</span> average ticket size!
            </p>
          </div>

          {/* Nested Colored KPI Pills Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* In-Store (Cash) Sales */}
            <div className="bg-[#F1B5B9]/25 border border-[#F1B5B9]/40 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">Cash Counter</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 text-emerald-600 flex items-center">
                  Cash
                </span>
              </div>
              <span className="text-lg font-bold text-[#002F34] mt-2">
                ৳ {parseFloat(today.paymentSplit.cash).toFixed(2)}
              </span>
            </div>

            {/* MFS (bKash/Nagad) Sales */}
            <div className="bg-[#97D8D0]/30 border border-[#97D8D0]/50 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">MFS (bKash/Nagad)</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 text-teal-700 flex items-center">
                  Digital
                </span>
              </div>
              <span className="text-lg font-bold text-[#002F34] mt-2">
                ৳ {parseFloat(today.paymentSplit.mfs).toFixed(2)}
              </span>
            </div>

            {/* Invoices Billed */}
            <div className="bg-[#D7F1B5]/40 border border-[#D7F1B5]/60 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">Invoices Billed</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 text-emerald-700 flex items-center">
                  {today.salesGrowthPercent >= 0 ? `+${today.salesGrowthPercent}%` : `${today.salesGrowthPercent}%`}
                </span>
              </div>
              <span className="text-lg font-bold text-[#002F34] mt-2">
                {today.invoiceCount} Orders
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Sales Performance Line Graph (Saturday to Friday Cycle, 1 column) */}
        {(() => {
          const defaultWeek = [
            { day: 'Sat', salesNum: 0, sales: '0.00', count: 0, isToday: false, isPeak: false },
            { day: 'Sun', salesNum: 0, sales: '0.00', count: 0, isToday: false, isPeak: false },
            { day: 'Mon', salesNum: 0, sales: '0.00', count: 0, isToday: false, isPeak: false },
            { day: 'Tue', salesNum: 0, sales: '0.00', count: 0, isToday: false, isPeak: false },
            { day: 'Wed', salesNum: 0, sales: '0.00', count: 0, isToday: false, isPeak: false },
            { day: 'Thu', salesNum: 0, sales: '0.00', count: 0, isToday: false, isPeak: false },
            { day: 'Fri', salesNum: 0, sales: '0.00', count: 0, isToday: false, isPeak: false },
          ];
          const daysData = weeklySales.length === 7 ? weeklySales : defaultWeek;
          const maxVal = Math.max(...daysData.map((d: any) => d.salesNum || 0), 10);
          const totalWeekSales = daysData.reduce((acc: number, d: any) => acc + (d.salesNum || 0), 0);
          const peakItem = daysData.find((d: any) => d.isPeak);

          // SVG Viewport: 260 width, 95 height
          const coords = daysData.map((d: any, idx: number) => {
            const x = 20 + idx * (220 / 6);
            const y = 82 - ((d.salesNum || 0) / maxVal) * 58;
            return { x, y, ...d };
          });
          const linePath = coords.reduce((acc: string, pt: any, idx: number) => {
            return idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
          }, '');
          const areaPath = coords.length > 0
            ? `${linePath} L ${coords[coords.length - 1].x},90 L ${coords[0].x},90 Z`
            : '';

          return (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#002F34] uppercase tracking-wide">
                    Weekly Sales Trend
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7F6F3] text-[#006059]">
                    Sat – Fri Cycle
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-extrabold text-[#002F34]">
                    ৳ {totalWeekSales.toFixed(0)}
                  </span>
                  {peakItem && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                      Peak: {peakItem.day} (৳ {parseFloat(peakItem.sales).toFixed(0)})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Calculated daily from Saturday, auto-purged on weekend
                </p>
              </div>

              {/* Smooth Line Graph SVG */}
              <div className="mt-3 relative">
                <svg className="w-full h-28 overflow-visible" viewBox="0 0 260 105">
                  <defs>
                    <linearGradient id="weekAreaGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00A887" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#00A887" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline */}
                  <line x1="15" y1="82" x2="245" y2="82" stroke="#F1F5F4" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="15" y1="24" x2="245" y2="24" stroke="#F1F5F4" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Area fill */}
                  {areaPath && <path d={areaPath} fill="url(#weekAreaGradient)" />}

                  {/* Line stroke */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#006059"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points and Day Labels */}
                  {coords.map((pt: any, idx: number) => (
                    <g key={idx} className="cursor-pointer group">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={pt.isToday ? 4.5 : pt.isPeak ? 4 : 3}
                        fill={pt.isPeak ? '#F59E0B' : pt.isToday ? '#002F34' : '#00A887'}
                        stroke="#fff"
                        strokeWidth="2"
                        className="transition-transform group-hover:scale-150"
                      />
                      {pt.isToday && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="7.5"
                          fill="none"
                          stroke="#002F34"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                      )}
                      {/* Day Label underneath */}
                      <text
                        x={pt.x}
                        y="100"
                        textAnchor="middle"
                        fontSize="9.5"
                        fontWeight={pt.isToday ? 'bold' : 'normal'}
                        fill={pt.isToday ? '#002F34' : '#94A3B8'}
                      >
                        {pt.day}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Mid Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Company / Manufacturer Sales (Pie Chart, 1 column) */}
        {(() => {
          const colors = ['#002F34', '#00A887', '#0EA5E9', '#F43F5E', '#F59E0B', '#8B5CF6', '#10B981'];
          const totalRaw = companySales.reduce((sum: number, c: any) => sum + (c.rawRevenue || 0), 0);

          const cx = 80;
          const cy = 80;
          const radius = 66;

          let currentAngle = -Math.PI / 2; // start at top 12 o'clock

          const slices = companySales.map((c: any, idx: number) => {
            const fraction = totalRaw > 0 ? (c.rawRevenue || 0) / totalRaw : (c.percentage ? c.percentage / 100 : 0);
            const angle = fraction * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;

            const isFullCircle = fraction >= 0.999;
            const x1 = cx + radius * Math.cos(startAngle);
            const y1 = cy + radius * Math.sin(startAngle);
            const x2 = cx + radius * Math.cos(endAngle);
            const y2 = cy + radius * Math.sin(endAngle);
            const largeArc = angle > Math.PI ? 1 : 0;
            const pathData = isFullCircle
              ? ''
              : `M ${cx},${cy} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;

            // Coordinates for slice percentage label
            const midAngle = startAngle + angle / 2;
            const labelR = radius * 0.65;
            const lx = cx + labelR * Math.cos(midAngle);
            const ly = cy + labelR * Math.sin(midAngle);
            const pct = Math.round(fraction * 100);

            return {
              ...c,
              pathData,
              isFullCircle,
              color: colors[idx % colors.length],
              pct,
              lx,
              ly,
            };
          });

          return (
            <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-bold text-[#002F34]">Top Manufacturer Sales</h2>
                  <p className="text-[11px] text-slate-400">Which company product has best sales</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {companySales.length} Brands
                </span>
              </div>

              {companySales.length === 0 || totalRaw === 0 ? (
                <div className="py-14 text-center text-xs text-slate-400">
                  No manufacturer sales recorded for this period yet.
                </div>
              ) : (
                <>
                  {/* True Pie Chart Graphic */}
                  <div className="relative flex items-center justify-center my-2">
                    <svg className="w-44 h-44 drop-shadow-sm overflow-visible" viewBox="0 0 160 160">
                      {slices.map((slice: any) => {
                        if (slice.isFullCircle) {
                          return (
                            <circle
                              key={slice.company}
                              cx={cx}
                              cy={cy}
                              r={radius}
                              fill={slice.color}
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          );
                        }
                        return (
                          <g key={slice.company} className="transition-transform duration-200 hover:scale-[1.03] origin-center cursor-pointer group">
                            <path
                              d={slice.pathData}
                              fill={slice.color}
                              stroke="#ffffff"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                            {/* In-slice percentage label for prominent slices */}
                            {slice.pct >= 8 && (
                              <text
                                x={slice.lx}
                                y={slice.ly}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#ffffff"
                                fontSize="9"
                                fontWeight="bold"
                                className="pointer-events-none select-none drop-shadow"
                              >
                                {slice.pct}%
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Company Legend & Sales List */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 max-h-40 overflow-y-auto">
                    {slices.map((c: any) => (
                      <div key={c.company} className="flex items-center justify-between text-[11px] hover:bg-slate-50/80 px-1 py-0.5 rounded transition-colors">
                        <div className="flex items-center space-x-1.5 truncate max-w-[150px]">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-semibold text-slate-700 truncate" title={c.company}>
                            {c.company}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[10px] text-slate-400 font-medium">{c.pieces} pcs</span>
                          <span className="font-bold text-[#002F34]">৳ {parseFloat(c.revenue).toFixed(0)}</span>
                          <span className="font-bold text-slate-500 w-8 text-right font-mono">({c.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Generic-Wise Sales Performance (Wide Bar Graph, spans 2 columns) */}
        {(() => {
          const maxGenericRevenue = Math.max(...genericSales.map((g: any) => g.rawRevenue || 0), 10);

          return (
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#002F34]">Generic-Wise Sales Performance</h2>
                  <p className="text-[11px] text-slate-400">
                    Which generic medicines sell more by throughput and counter revenue
                  </p>
                </div>
                <span className="bg-[#F3F7F6] border border-slate-200/60 px-3 py-1 rounded-full text-xs font-semibold text-slate-600">
                  Top Generics
                </span>
              </div>

              {genericSales.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No generic transactions recorded for this selected timeframe.
                </div>
              ) : (
                <div className="space-y-3.5 pt-1">
                  {genericSales.map((gen: any, idx: number) => {
                    const ratio = Math.max(8, Math.min(100, Math.round((gen.rawRevenue / maxGenericRevenue) * 100)));
                    return (
                      <div key={gen.genericName} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#002F34]/5 text-[#002F34] font-bold text-[10px] flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-[#002F34]">{gen.genericName}</span>
                            <span className="text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                              {gen.pieces} pcs sold
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#002F34]">
                              ৳ {parseFloat(gen.revenue).toFixed(2)}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 w-8 text-right">
                              {ratio}%
                            </span>
                          </div>
                        </div>

                        {/* Animated Horizontal Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#002F34] to-[#00A887]"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Bottom Section: Customer Orders Table */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-base font-bold text-[#002F34]">Recent Customers & Orders</h2>
            <p className="text-xs text-slate-400">Transactions processed in the last 24 hours</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/invoices"
              className="bg-[#F3F7F6] hover:bg-slate-200 text-slate-600 text-xs font-semibold px-4 py-1.5 rounded-full flex items-center space-x-1.5"
            >
              <span>View All Invoices →</span>
            </Link>
          </div>
        </div>

        {/* Table Element */}
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-50">
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3 text-center">Quantity</th>
                <th className="py-3 px-3">Total Price</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {recentTransactions.map((tx: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-[#002F34]">{tx.customerName}</span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{tx.productName}</td>
                  <td className="py-3.5 px-3 text-slate-500">{tx.paymentMethod}</td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2 py-0.5 bg-[#F3F7F6] rounded-full font-bold text-slate-700">
                      {tx.quantity}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-bold text-[#002F34]">{tx.totalPrice}</td>
                  <td className="py-3.5 px-3 text-slate-400">{tx.date}</td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      to="/invoices"
                      className="text-xs font-semibold text-slate-400 hover:text-[#002F34] px-2 py-1 rounded-md hover:bg-slate-100"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
