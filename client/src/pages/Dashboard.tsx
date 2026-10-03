import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../services/reportApi.ts';

export function Dashboard() {
  const [dateFilter, setDateFilter] = useState('Today');

  const { data: kpiData, isLoading: loadingKPIs } = useQuery({
    queryKey: ['dashboardKPIs'],
    queryFn: () => reportApi.getDashboardKPIs(),
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

  // Recent dummy transactions for table display if none
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
          <h1 className="text-2xl font-bold tracking-tight text-[#002F34]">Sales Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">Welcome back, monitor your real-time pharmacy operations.</p>
        </div>

        {/* Filter Dropdown Button */}
        <div className="flex items-center space-x-3">
          <div className="bg-white border border-slate-200/80 px-4 py-2 rounded-full text-xs font-semibold flex items-center space-x-2 text-slate-700 shadow-sm">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border-none p-0 text-xs font-semibold text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="Today">Today (Live)</option>
              <option value="Last 7 days">Last 7 days</option>
              <option value="This Month">This Month</option>
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
              <button className="text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                  <circle cx="5" cy="12" r="1.5" />
                </svg>
              </button>
            </div>
            <div className="flex items-baseline space-x-3 mb-1">
              <span className="text-3xl font-extrabold text-[#002F34] tracking-tight">
                {loadingKPIs ? '...' : `৳ ${parseFloat(today.netSales).toFixed(2)}`}
              </span>
            </div>
            <p className="text-[12px] text-slate-400 mb-6">
              Pharmacy billing active with <span className="font-semibold text-emerald-600">৳ {today.averageTicketSize}</span> average ticket size!
            </p>
          </div>

          {/* Nested Colored KPI Pills Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* In-Store (Cash) Sales (Soft Pink) */}
            <div className="bg-[#F1B5B9]/25 border border-[#F1B5B9]/40 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">Cash Counter</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 text-emerald-600 flex items-center">
                  Live
                </span>
              </div>
              <span className="text-lg font-bold text-[#002F34] mt-2">
                ৳ {parseFloat(today.paymentSplit.cash).toFixed(2)}
              </span>
            </div>

            {/* MFS (bKash/Nagad) Sales (Soft Mint) */}
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

            {/* Total Invoices Billed (Soft Lime) */}
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

        {/* Total Order Card with Wave Graphic */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Total Order</span>
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" fillRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold text-[#002F34]">{today.invoiceCount} Invoices</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                ↗ Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Real-time pharmacy transaction throughput</p>
          </div>

          {/* SVG Pink Wave Chart with Gradient */}
          <div className="mt-4 relative">
            <svg className="w-full h-24 overflow-visible" fill="none" viewBox="0 0 260 90">
              <defs>
                <linearGradient id="orderGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#F1B5B9" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path d="M 0,65 C 40,75 70,40 100,55 C 130,70 160,20 190,45 C 220,70 240,15 260,25 L 260,90 L 0,90 Z" fill="url(#orderGradient)" />
              <path d="M 0,65 C 40,75 70,40 100,55 C 130,70 160,20 190,45 C 220,70 240,15 260,25" stroke="#F1B5B9" strokeLinecap="round" strokeWidth="2.5" />
              <circle cx="190" cy="45" fill="#F1B5B9" r="3.5" stroke="#fff" strokeWidth="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mid Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue By Category (Donut Chart) */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#002F34]">Revenue By Category</h2>
            <button className="text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
                <circle cx="5" cy="12" r="1.5" />
              </svg>
            </button>
          </div>

          {/* Donut graphic container with callouts */}
          <div className="relative flex items-center justify-center my-3">
            <svg className="w-48 h-48 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" fill="transparent" r="46" stroke="#f1f5f9" strokeWidth="13" />
              {/* Mint Segment: 45% */}
              <circle cx="60" cy="60" fill="transparent" r="46" stroke="#97D8D0" strokeDasharray="130 289" strokeDashoffset="0" strokeLinecap="round" strokeWidth="13" />
              {/* Coral Pink Segment: 35% */}
              <circle cx="60" cy="60" fill="transparent" r="46" stroke="#F1B5B9" strokeDasharray="98 289" strokeDashoffset="-135" strokeLinecap="round" strokeWidth="13" />
              {/* Lime Segment: 20% */}
              <circle cx="60" cy="60" fill="transparent" r="46" stroke="#D7F1B5" strokeDasharray="52 289" strokeDashoffset="-238" strokeLinecap="round" strokeWidth="13" />
            </svg>

            {/* Donut Inner Stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Revenue</span>
              <span className="text-xl font-extrabold text-[#002F34]">৳ {parseFloat(today.netSales).toFixed(0)}</span>
            </div>

            {/* Floating Badges */}
            <span className="absolute top-4 right-1 text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#97D8D0]" /> 45%
            </span>
            <span className="absolute bottom-6 right-2 text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F1B5B9]" /> 35%
            </span>
            <span className="absolute top-1/2 left-0 -translate-y-1/2 text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm flex items-center gap-1">
              20% <span className="w-1.5 h-1.5 rounded-full bg-[#D7F1B5]" />
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#97D8D0]" />
              <span>Tablets</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F1B5B9]" />
              <span>Syrups</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D7F1B5]" />
              <span>Injections</span>
            </span>
          </div>
        </div>

        {/* Weekly Sales Performance (Striped Capsule Pill Bar Chart) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#002F34]">Weekly Sales Performance</h2>
              <p className="text-[11px] text-slate-400">Total volume grouped by daily pharmacy fulfillment</p>
            </div>
            <span className="bg-[#F3F7F6] border border-slate-200/60 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1 text-slate-600">
              <span>This Week</span>
            </span>
          </div>

          {/* Capsule Chart Graphic with Axis */}
          <div className="flex items-end space-x-4 h-56 pt-4">
            {/* Y Axis Labels */}
            <div className="flex flex-col justify-between h-44 text-[10px] font-semibold text-slate-400 pb-6 pr-2">
              <span>50K</span>
              <span>40K</span>
              <span>30K</span>
              <span>20K</span>
              <span>10K</span>
            </div>

            {/* Bars Container (Sat to Fri) */}
            <div className="flex-1 grid grid-cols-7 gap-3 items-end h-44 pb-6 border-b border-slate-100">
              {/* Saturday (Peach Striped) */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-full max-w-[34px] h-[75%] rounded-full pattern-stripes-peach border border-amber-300 relative transition-transform group-hover:scale-105">
                  <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-amber-400 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-2">Sat</span>
              </div>

              {/* Sunday (Pink Striped) */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-full max-w-[34px] h-[45%] rounded-full pattern-stripes-pink border border-pink-300 relative transition-transform group-hover:scale-105">
                  <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-pink-400 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-2">Sun</span>
              </div>

              {/* Monday (Lime Striped) */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-full max-w-[34px] h-[60%] rounded-full pattern-stripes-lime border border-lime-300 relative transition-transform group-hover:scale-105">
                  <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-lime-500 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-2">Mon</span>
              </div>

              {/* Tuesday (Mint Striped - Peak) */}
              <div className="flex flex-col items-center h-full justify-end group relative">
                <div className="absolute -top-7 px-2 py-0.5 rounded-md bg-[#002F34] text-white text-[10px] font-semibold tracking-tight shadow">
                  Peak
                </div>
                <div className="w-full max-w-[34px] h-[95%] rounded-full pattern-stripes-mint border border-teal-300 relative transition-transform group-hover:scale-105">
                  <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-teal-500 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[11px] font-bold text-[#002F34] mt-2">Tue</span>
              </div>

              {/* Wednesday (Coral Pink Striped) */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-full max-w-[34px] h-[50%] rounded-full pattern-stripes-pink border border-rose-300 relative transition-transform group-hover:scale-105">
                  <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-rose-400 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-2">Wed</span>
              </div>

              {/* Thursday (Lavender Striped) */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-full max-w-[34px] h-[70%] rounded-full pattern-stripes-lavender border border-indigo-300 relative transition-transform group-hover:scale-105">
                  <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-indigo-400 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-2">Thu</span>
              </div>

              {/* Friday (Mint Striped) */}
              <div className="flex flex-col items-center h-full justify-end group">
                <div className="w-full max-w-[34px] h-[85%] rounded-full pattern-stripes-mint border border-teal-300 relative transition-transform group-hover:scale-105">
                  <div className="w-2.5 h-2.5 rounded-full bg-white border-2 border-teal-400 absolute -top-1.5 left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 mt-2">Fri</span>
              </div>
            </div>
          </div>
        </div>
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
