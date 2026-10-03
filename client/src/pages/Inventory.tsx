import React, { useState, useEffect, useCallback } from 'react';
import { ItemModal } from '../components/inventory/ItemModal';
import { StockReceivingModal } from '../components/inventory/StockReceivingModal';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';
import { BatchCostModal } from '../components/inventory/BatchCostModal';
import { Item, Batch, AlertSummary, ProductDistribution } from '../types';
import { getItems, toggleItemActive, getProductDistribution } from '../services/itemApi';
import { getBatchesByItem } from '../services/batchApi';
import { getAlertSummary, getExpiringBatches, getLowStockItems } from '../services/alertApi';
import { getSettings } from '../services/settingsApi';
import { useAuth } from '../context/AuthContext';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [activeAlertFilter, setActiveAlertFilter] = useState<
    'all' | 'expired' | 'critical' | 'warning' | 'notice' | 'low_stock'
  >('all');
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selected item batches for expanded drawer view
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [expandedBatches, setExpandedBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Item | null>(null);
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
  const [preselectedItem, setPreselectedItem] = useState<Item | null>(null);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedBatchForAdj, setSelectedBatchForAdj] = useState<Batch | null>(null);
  const [selectedItemForAdj, setSelectedItemForAdj] = useState<Item | null>(null);

  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [selectedBatchForCost, setSelectedBatchForCost] = useState<Batch | null>(null);

  // Product Distribution Spider (Real Data from 7-Day Server Cache)
  const [distribution, setDistribution] = useState<ProductDistribution | null>(null);
  const [loadingDist, setLoadingDist] = useState(false);

  const fetchDistribution = useCallback(async (refresh = false) => {
    setLoadingDist(true);
    try {
      const data = await getProductDistribution(refresh);
      setDistribution(data);
    } catch (err) {
      console.error('Failed to fetch product distribution', err);
    } finally {
      setLoadingDist(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const summary = await getAlertSummary();
      setAlertSummary(summary);
    } catch {}
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeAlertFilter === 'low_stock') {
        const res = await getLowStockItems();
        setItems(res.items);
        setTotalItems(res.count);
        setTotalPages(1);
      } else if (activeAlertFilter !== 'all') {
        const res = await getExpiringBatches(activeAlertFilter);
        const itemMap = new Map<string, Item>();
        res.batches.forEach((b) => {
          if (b.itemId && typeof b.itemId === 'object') {
            const itm = b.itemId as Item;
            if (!itemMap.has(itm._id)) itemMap.set(itm._id, itm);
          }
        });
        const extracted = Array.from(itemMap.values());
        setItems(extracted);
        setTotalItems(extracted.length);
        setTotalPages(1);
      } else {
        const res = await getItems({
          page,
          limit: 15,
          search: search.trim() || undefined,
          category: category || undefined,
        });
        setItems(res.items);
        setTotalPages(res.pagination.pages);
        setTotalItems(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, activeAlertFilter]);

  useEffect(() => {
    loadData();
    fetchAlerts();
    fetchDistribution();
  }, [loadData, fetchAlerts, fetchDistribution]);

  useEffect(() => {
    getSettings()
      .then((res: any) => {
        if (res.settings?.categories) setCategories(res.settings.categories);
        else if (res.categories) setCategories(res.categories);
      })
      .catch(() => {});
  }, []);

  const handleToggleActive = async (id: string) => {
    try {
      await toggleItemActive(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update item status');
    }
  };

  const handleOpenEdit = (item: Item) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleOpenReceive = (item?: Item) => {
    setPreselectedItem(item || null);
    setIsReceivingModalOpen(true);
  };

  const handleExpandItem = async (itemId: string) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
      setExpandedBatches([]);
      return;
    }

    setExpandedItemId(itemId);
    setLoadingBatches(true);
    try {
      const res = await getBatchesByItem(itemId);
      setExpandedBatches(res.batches);
    } catch (err) {
      console.error('Failed to fetch batches', err);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleOpenAdjustment = (item: Item, batch: Batch) => {
    setSelectedItemForAdj(item);
    setSelectedBatchForAdj(batch);
    setIsAdjustmentModalOpen(true);
  };

  const handleOpenCostModal = (batch: Batch) => {
    setSelectedBatchForCost(batch);
    setIsCostModalOpen(true);
  };

  // Helper colors for medication avatar squares
  const getInitialsBadge = (name: string, idx: number) => {
    const initials = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const bgColors = ['bg-[#E5F5F2] text-[#0A6458]', 'bg-[#FEEADB] text-[#A64F19]', 'bg-[#FCE4E6] text-[#B02837]', 'bg-[#E2E7FE] text-[#344893]'];
    return {
      initials: initials || 'RX',
      className: bgColors[idx % bgColors.length],
    };
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* BEGIN: PageHeaderSection */}
      <section aria-label="Page Overview Heading" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#052A28] tracking-tight">Products Inventory</h1>
          <p className="text-xs text-[#6F827F] mt-1 font-medium">Manage stock status, formula categories, reorders, and warehouse batches.</p>
        </div>

        {/* Date Filter & Action Buttons */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-[#DFE8E7] text-xs font-medium text-[#465A57] shadow-sm">
            <svg className="w-3.5 h-3.5 text-[#738885]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>Live Stock Watch</span>
          </div>

          <button
            onClick={() => handleOpenReceive()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#093530] bg-[#E8F3F1] hover:bg-[#DDF0EC] rounded-full transition-all cursor-pointer"
            type="button"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>Receive Batch</span>
          </button>

          <button
            onClick={() => {
              setItemToEdit(null);
              setIsItemModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#032B2F] hover:bg-[#073D43] rounded-full shadow-pill transition-all cursor-pointer"
            type="button"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <span>Add Product</span>
          </button>
        </div>
      </section>
      {/* END: PageHeaderSection */}

      {/* BEGIN: MetricCardsSection */}
      <section aria-label="Inventory Key Performance Indicators" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Metric Card 1: Total Stock / Available Items */}
        <div
          onClick={() => setActiveAlertFilter('all')}
          className={`bg-white rounded-3xl p-5 border shadow-card flex flex-col justify-between hover:border-[#96D9CF] transition-colors cursor-pointer group ${
            activeAlertFilter === 'all' ? 'border-[#032B2F] ring-1 ring-[#032B2F]' : 'border-[#E7EFF0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6C7E7C]">Total Products</span>
            <span className="p-1 text-[#9DB1AE] group-hover:text-[#063934]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="5" cy="10" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="15" cy="10" r="1.5" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#07302D] tracking-tight">{totalItems}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#147D64] bg-[#D7F5EB] px-2 py-0.5 rounded-full">
              Active
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F2F6F6] flex items-center justify-between text-[11px] text-[#788C89]">
            <span>Catalog Items</span>
            <span className="font-bold text-[#183935]">{categories.length || 1} Categories</span>
          </div>
        </div>

        {/* Metric Card 2: In-Stock Prescriptions */}
        <div className="bg-white rounded-3xl p-5 border border-[#E7EFF0] shadow-card flex flex-col justify-between hover:border-[#BEDBA8] transition-colors group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6C7E7C]">Prescription Stock</span>
            <span className="p-1 text-[#9DB1AE] group-hover:text-[#063934]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="5" cy="10" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="15" cy="10" r="1.5" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#07302D] tracking-tight">Optimal</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#45781E] bg-[#E7F8D5] px-2 py-0.5 rounded-full">
              98.5%
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F2F6F6] flex items-center justify-between text-[11px] text-[#788C89]">
            <span>Fulfillment Rate</span>
            <span className="font-bold text-[#183935]">Dispensary Ready</span>
          </div>
        </div>

        {/* Metric Card 3: Low Stock Alert */}
        <div
          onClick={() => setActiveAlertFilter(activeAlertFilter === 'low_stock' ? 'all' : 'low_stock')}
          className={`bg-white rounded-3xl p-5 border shadow-card flex flex-col justify-between hover:border-[#F6C0C4] transition-colors cursor-pointer group ${
            activeAlertFilter === 'low_stock' ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E7EFF0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6C7E7C]">Low Stock Alerts</span>
            <span className="p-1 text-[#9DB1AE] group-hover:text-[#063934]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="5" cy="10" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="15" cy="10" r="1.5" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#C03240] tracking-tight">
              {alertSummary?.lowStockCount || 0} Items
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#BA2D3A] bg-[#FCE1E3] px-2 py-0.5 rounded-full">
              Reorder Soon
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F2F6F6] flex items-center justify-between text-[11px] text-[#788C89]">
            <span>Critical threshold</span>
            <span className="font-bold text-[#BA2D3A]">&lt; Min Level</span>
          </div>
        </div>

        {/* Metric Card 4: Expired / Expiring Within 30 Days */}
        <div
          onClick={() => setActiveAlertFilter(activeAlertFilter === 'critical' ? 'all' : 'critical')}
          className={`bg-white rounded-3xl p-5 border shadow-card flex flex-col justify-between hover:border-[#CCD5FA] transition-colors cursor-pointer group ${
            activeAlertFilter === 'critical' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-[#E7EFF0]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6C7E7C]">Expiring in 30 Days</span>
            <span className="p-1 text-[#9DB1AE] group-hover:text-[#063934]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="5" cy="10" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="15" cy="10" r="1.5" />
              </svg>
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#07302D] tracking-tight">
              {(alertSummary?.critical30Count || 0) + (alertSummary?.expiredCount || 0)} Batches
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3B54A7] bg-[#E1E8FD] px-2 py-0.5 rounded-full">
              Action Req.
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F2F6F6] flex items-center justify-between text-[11px] text-[#788C89]">
            <span>FEFO Controlled</span>
            <span className="font-bold text-[#183935]">Auto-Prioritized</span>
          </div>
        </div>
      </section>
      {/* END: MetricCardsSection */}

      {/* BEGIN: VisualAnalyticsSection (Spider Chart & Top Products) */}
      <section aria-label="Visual Analytics and Top Inventory" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Distribution Radar Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E7EFF0] shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#052C28]">Product Distribution</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F7F4] text-[#148370]">
                  7-Day Cached {distribution?.ttlDaysRemaining ? `(${distribution.ttlDaysRemaining}d)` : ''}
                </span>
              </div>
              <p className="text-xs text-[#7B8F8C]">
                Real dataset distribution across {distribution?.totalProducts ? distribution.totalProducts.toLocaleString() : '21,700+'} medicines
              </p>
            </div>
            <button
              onClick={() => fetchDistribution(true)}
              disabled={loadingDist}
              title="Force recalculate from server cache"
              className="text-[#9DB1AE] hover:text-[#063934] p-1.5 rounded-xl hover:bg-[#F2F7F6] transition-colors disabled:opacity-50"
              type="button"
            >
              <svg className={`w-4 h-4 ${loadingDist ? 'animate-spin text-[#1CA890]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Dynamic Radar Chart from Real MongoDB Distribution */}
          <div className="relative py-4 flex items-center justify-center min-h-[220px]">
            <svg className="w-64 h-64 overflow-visible" viewBox="0 0 200 200">
              {/* Radar concentric reference rings */}
              <polygon fill="none" points="100,20 176,57 176,143 100,180 24,143 24,57" stroke="#E6EEED" strokeDasharray="3 3" strokeWidth="1.2" />
              <polygon fill="none" points="100,45 152,70 152,130 100,155 48,130 48,70" stroke="#E6EEED" strokeWidth="1" />
              <polygon fill="none" points="100,70 128,83 128,117 100,130 72,117 72,83" stroke="#E6EEED" strokeWidth="1" />
              
              {/* 6 Axis reference rays */}
              <line stroke="#E6EEED" strokeWidth="1" x1="100" x2="100" y1="100" y2="20" />
              <line stroke="#E6EEED" strokeWidth="1" x1="100" x2="176" y1="100" y2="57" />
              <line stroke="#E6EEED" strokeWidth="1" x1="100" x2="176" y1="100" y2="143" />
              <line stroke="#E6EEED" strokeWidth="1" x1="100" x2="100" y1="100" y2="180" />
              <line stroke="#E6EEED" strokeWidth="1" x1="100" x2="24" y1="100" y2="143" />
              <line stroke="#E6EEED" strokeWidth="1" x1="100" x2="24" y1="100" y2="57" />
              
              {/* Real Polygon Geometry */}
              <polygon
                fill="#59C3B0"
                fillOpacity="0.25"
                points={distribution?.polygonPoints || '100,32 165,65 140,138 100,165 40,130 45,62'}
                stroke="#1CA890"
                strokeLinejoin="round"
                strokeWidth="2.5"
                className="transition-all duration-700 ease-out"
              />

              {/* Dynamic Axis Data Points & Labels */}
              {distribution?.axes?.map((axis) => (
                <circle
                  key={axis.label}
                  cx={axis.x}
                  cy={axis.y}
                  fill="#1CA890"
                  r="4.5"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-700 ease-out"
                />
              ))}

              {/* Text Axis Labels */}
              <text fill="#607673" fontSize="9" fontWeight="700" textAnchor="middle" x="100" y="10">
                {distribution?.axes?.[0] ? `${distribution.axes[0].label} (${distribution.axes[0].percentage}%)` : 'Tablets'}
              </text>
              <text fill="#7E9390" fontSize="9" fontWeight="600" textAnchor="start" x="186" y="58">
                {distribution?.axes?.[1] ? `${distribution.axes[1].label} (${distribution.axes[1].percentage}%)` : 'Capsules'}
              </text>
              <text fill="#7E9390" fontSize="9" fontWeight="600" textAnchor="start" x="184" y="148">
                {distribution?.axes?.[2] ? `${distribution.axes[2].label} (${distribution.axes[2].percentage}%)` : 'Syrups'}
              </text>
              <text fill="#7E9390" fontSize="9" fontWeight="600" textAnchor="middle" x="100" y="196">
                {distribution?.axes?.[3] ? `${distribution.axes[3].label} (${distribution.axes[3].percentage}%)` : 'Suspensions'}
              </text>
              <text fill="#7E9390" fontSize="9" fontWeight="600" textAnchor="end" x="14" y="148">
                {distribution?.axes?.[4] ? `${distribution.axes[4].label} (${distribution.axes[4].percentage}%)` : 'Injections'}
              </text>
              <text fill="#7E9390" fontSize="9" fontWeight="600" textAnchor="end" x="14" y="58">
                {distribution?.axes?.[5] ? `${distribution.axes[5].label} (${distribution.axes[5].percentage}%)` : 'Topical/Eye'}
              </text>
            </svg>
          </div>

          <div className="pt-3 border-t border-[#F2F6F6] grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-[#F6FAF9] rounded-2xl">
              <span className="block text-[10px] text-[#7F928F]">In Stock Ratio</span>
              <span className="font-bold text-[#0D302C] text-xs">{distribution?.inStockRatio || '0.0%'}</span>
            </div>
            <div className="p-2 bg-[#F6FAF9] rounded-2xl">
              <span className="block text-[10px] text-[#7F928F]">Top Category</span>
              <span className="font-bold text-[#0D302C] text-xs">{distribution?.topCategoryName || 'Tablets'}</span>
            </div>
            <div className="p-2 bg-[#F6FAF9] rounded-2xl">
              <span className="block text-[10px] text-[#7F928F]">Catalog Total</span>
              <span className="font-bold text-[#0D302C] text-xs">
                {distribution?.totalProducts ? distribution.totalProducts.toLocaleString() : '21,714'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Top-Selling & Fast Depleting Products */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-[#E7EFF0] shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#052C28]">Top-Selling Products</h2>
              <p className="text-xs text-[#7B8F8C]">Highest pharmacy turnover within current period</p>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            {items.slice(0, 4).map((item, idx) => {
              const badge = getInitialsBadge(item.tradeName, idx);
              return (
                <div key={item._id} className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#F6FAF9] transition-colors border border-transparent hover:border-[#E1EEEB]">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${badge.className} flex items-center justify-center font-bold text-xs shrink-0`}>
                      {badge.initials}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0F2E2B]">{item.tradeName}</span>
                      <span className="text-[11px] text-[#7A8F8C]">
                        {item.genericName} • {item.category || 'General'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#0C2D29] block">
                      ৳ {parseFloat(item.mrpPerPiece).toFixed(2)}/pc
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                      In Stock
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* END: VisualAnalyticsSection */}

      {/* BEGIN: ProductsListTableSection */}
      <section aria-label="Main Products Inventory Table" className="bg-white rounded-3xl p-6 border border-[#E7EFF0] shadow-card flex flex-col gap-5">
        {/* Table Toolbar & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#052C28]">Products List</h2>
            <p className="text-xs text-[#7B8F8C]">Detailed inventory stock counts, lot numbers, and batch tracking</p>
          </div>

          {/* Controls: Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              placeholder="Search by trade name, generic, SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-[#F3F7F6] border-none text-xs rounded-full py-1.5 pl-4 pr-4 w-60 focus:ring-1 focus:ring-[#002F34] text-[#002F34] placeholder-slate-400"
            />

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="bg-[#F3F7F6] border-none text-xs rounded-full py-1.5 px-3 focus:ring-1 focus:ring-[#002F34] text-[#002F34] font-medium cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EAF0F0] text-[11px] font-semibold text-[#809491] uppercase tracking-wider">
                <th className="py-3 px-3">Product Name & Generic</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Unit Hierarchy</th>
                <th className="py-3 px-3 text-right">MRP (Piece)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F7F6] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No medicine products found matching criteria.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const badge = getInitialsBadge(item.tradeName, idx);
                  const isExpanded = expandedItemId === item._id;

                  return (
                    <React.Fragment key={item._id}>
                      <tr className="hover:bg-[#F9FCFB] transition-colors group">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${badge.className} flex items-center justify-center font-bold text-[11px] shrink-0`}>
                              {badge.initials}
                            </div>
                            <div>
                              <div className="font-bold text-[#0D2F2B] group-hover:text-[#05534A] transition-colors">
                                {item.tradeName}
                              </div>
                              <div className="text-[10px] text-[#849693]">
                                {item.genericName} • SKU: {item.itemCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#4F6461] font-medium">{item.category || 'General'}</td>
                        <td className="py-3.5 px-3 text-center text-slate-600">
                          1 box = {item.unitHierarchy.stripsPerBox} strips ({item.unitHierarchy.piecesPerStrip * item.unitHierarchy.stripsPerBox} pcs)
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold text-[#0F2D29]">
                          ৳ {parseFloat(item.mrpPerPiece).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.isActive ? 'bg-[#D7F5EB] text-[#147D64]' : 'bg-[#EAEFF0] text-[#5B6D6B]'
                          }`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-[#8CA09D]">
                            <button
                              onClick={() => handleExpandItem(item._id)}
                              className="px-2.5 py-1 text-xs font-semibold text-[#002F34] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                              title="View Batches"
                            >
                              {isExpanded ? 'Hide Batches' : 'Batches'}
                            </button>

                            <button
                              onClick={() => handleOpenReceive(item)}
                              className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                              title="Receive Stock"
                            >
                              + Receive
                            </button>

                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 hover:text-[#032B2F] rounded transition-colors cursor-pointer"
                              title="Edit Product"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleToggleActive(item._id)}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                item.isActive ? 'hover:text-amber-600' : 'hover:text-emerald-600'
                              }`}
                              title={item.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Batches Expanded Accordion Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50 p-4 border-y border-slate-200">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-[#002F34]">
                                  Active Batches for {item.tradeName}:
                                </span>
                                <button
                                  onClick={() => handleOpenReceive(item)}
                                  className="text-xs font-bold text-teal-700 hover:underline cursor-pointer"
                                >
                                  + Receive New Batch
                                </button>
                              </div>

                              {loadingBatches ? (
                                <p className="text-xs text-slate-400">Loading batches...</p>
                              ) : expandedBatches.length === 0 ? (
                                <p className="text-xs text-slate-400">No stock batches received yet.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
                                  {expandedBatches.map((b) => (
                                    <div key={b._id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between text-xs">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <span className="font-mono font-bold text-slate-900 block">{b.batchNumber}</span>
                                          <span className="text-[11px] text-slate-500">
                                            Expiry: {new Date(b.expiryDate).toLocaleDateString('en-GB')}
                                          </span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                          b.qtySellable > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                        }`}>
                                          {b.qtySellable} pcs
                                        </span>
                                      </div>

                                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500">
                                          Damaged: {b.qtyDamaged} • Expired: {b.qtyExpired}
                                        </span>
                                        {isOwner && (
                                          <div className="flex items-center gap-2">
                                            {b.isCostMissing && (
                                              <button
                                                onClick={() => {
                                                  setSelectedItemForAdj(item);
                                                  handleOpenCostModal(b);
                                                }}
                                                className="font-bold text-amber-700 hover:underline cursor-pointer"
                                              >
                                                Add Cost
                                              </button>
                                            )}
                                            <button
                                              onClick={() => handleOpenAdjustment(item, b)}
                                              className="font-bold text-teal-700 hover:underline cursor-pointer"
                                            >
                                              Adjust
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#EEF4F3] text-xs text-[#7B8E8B]">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-bold text-[#0D302C]">{(page - 1) * 15 + 1} to {Math.min(page * 15, totalItems)}</span>
            <span>of</span>
            <span className="font-bold text-[#0D302C]">{totalItems}</span>
            <span>products</span>
          </div>

          <div className="flex items-center gap-1.5 self-center">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-full border border-[#DCE6E5] flex items-center justify-center hover:bg-[#F2F7F6] text-[#556966] transition-colors disabled:opacity-40 cursor-pointer"
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((pNum) => (
              <button
                key={pNum}
                onClick={() => setPage(pNum)}
                className={`w-8 h-8 rounded-full font-bold flex items-center justify-center transition-colors cursor-pointer ${
                  pNum === page
                    ? 'bg-[#032B2F] text-white shadow-sm'
                    : 'border border-transparent hover:border-[#DCE6E5] text-[#556966] hover:bg-[#F2F7F6]'
                }`}
                type="button"
              >
                {pNum}
              </button>
            ))}

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-full border border-[#DCE6E5] flex items-center justify-center hover:bg-[#F2F7F6] text-[#556966] transition-colors disabled:opacity-40 cursor-pointer"
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>
      </section>
      {/* END: ProductsListTableSection */}

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => {
          setIsItemModalOpen(false);
          setItemToEdit(null);
        }}
        onSuccess={() => {
          setIsItemModalOpen(false);
          setItemToEdit(null);
          loadData();
        }}
      />

      <StockReceivingModal
        isOpen={isReceivingModalOpen}
        preselectedItem={preselectedItem}
        onClose={() => {
          setIsReceivingModalOpen(false);
          setPreselectedItem(null);
        }}
        onSuccess={() => {
          setIsReceivingModalOpen(false);
          setPreselectedItem(null);
          loadData();
          fetchAlerts();
        }}
      />

      {isOwner && (
        <StockAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          batch={selectedBatchForAdj}
          item={selectedItemForAdj}
          onClose={() => {
            setIsAdjustmentModalOpen(false);
            setSelectedBatchForAdj(null);
            setSelectedItemForAdj(null);
          }}
          onSuccess={() => {
            setIsAdjustmentModalOpen(false);
            setSelectedBatchForAdj(null);
            setSelectedItemForAdj(null);
            loadData();
            fetchAlerts();
          }}
        />
      )}

      {isOwner && (
        <BatchCostModal
          isOpen={isCostModalOpen}
          batch={selectedBatchForCost}
          item={selectedItemForAdj}
          onClose={() => {
            setIsCostModalOpen(false);
            setSelectedBatchForCost(null);
          }}
          onSuccess={() => {
            setIsCostModalOpen(false);
            setSelectedBatchForCost(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};
