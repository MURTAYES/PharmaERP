import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ItemModal } from '../components/inventory/ItemModal';
import { StockReceivingModal } from '../components/inventory/StockReceivingModal';
import { StockAdjustmentModal } from '../components/inventory/StockAdjustmentModal';
import { BatchCostModal } from '../components/inventory/BatchCostModal';
import { Item, Batch, AlertSummary } from '../types';
import { getItems, toggleItemActive } from '../services/itemApi';
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

  // Expanded item for batch drawer
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
        // Extract unique items from expiring batches
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
    getSettings()
      .then((res: { settings?: any }) => {
        if (res.settings?.categories) setCategories(res.settings.categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Expand batches for an item
  const toggleItemBatches = async (itemId: string) => {
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
    } catch {
      setExpandedBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleItemActive(id);
      loadData();
    } catch {}
  };

  const getExpiryBadge = (expiryStr?: string) => {
    if (!expiryStr) return <span className="text-slate-500 text-xs">No batches</span>;
    const expDate = new Date(expiryStr);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return <Badge variant="error">Expired</Badge>;
    if (diffDays <= 30) return <Badge variant="error">{diffDays}d left</Badge>;
    if (diffDays <= 60) return <Badge variant="warning">{diffDays}d left</Badge>;
    if (diffDays <= 90) return <Badge variant="secondary">{diffDays}d left</Badge>;
    return (
      <span className="text-xs font-mono text-slate-400">
        {expDate.toLocaleDateString('en-GB')}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Top Header & Fast Actions */}
      <div className="w-full bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-clinical border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-container/15 flex items-center justify-center text-primary shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[28px]">medication</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              Medicine & Inventory Control
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Batch-wise stock management with multi-unit hierarchy, FEFO tracking, and live expiry alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => {
              setItemToEdit(null);
              setIsItemModalOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5">add_circle</span>
            Add Medicine
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setPreselectedItem(null);
              setIsReceivingModalOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-[18px] mr-1.5">inventory_2</span>
            Receive Stock
          </Button>
        </div>
      </div>

      {/* Top Alert KPI Chips (1-Click Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('all');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeAlertFilter === 'all'
              ? 'bg-primary-container/10 border-primary shadow-sm ring-2 ring-primary/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant'
          }`}
        >
          <div className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            All Items
          </div>
          <div className="text-2xl font-mono font-extrabold text-on-surface mt-1">{totalItems}</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('expired');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeAlertFilter === 'expired'
              ? 'bg-red-50 border-error ring-2 ring-error/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-error/50'
          }`}
        >
          <div className="text-[11px] font-bold text-error uppercase tracking-wider flex items-center justify-between">
            <span>Expired</span>
            <span className="material-symbols-outlined text-[16px]">dangerous</span>
          </div>
          <div className="text-2xl font-mono font-extrabold text-error mt-1">
            {alertSummary?.expiredCount || 0}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('critical');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeAlertFilter === 'critical'
              ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-600/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-amber-500/50'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center justify-between">
            <span>&lt;30d Critical</span>
            <span className="material-symbols-outlined text-[16px]">warning</span>
          </div>
          <div className="text-2xl font-mono font-extrabold text-amber-700 mt-1">
            {alertSummary?.critical30Count || 0}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('warning');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeAlertFilter === 'warning'
              ? 'bg-yellow-50 border-yellow-600 ring-2 ring-yellow-600/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-yellow-500/50'
          }`}
        >
          <div className="text-[11px] font-bold text-yellow-800 uppercase tracking-wider flex items-center justify-between">
            <span>&lt;60d Warning</span>
            <span className="material-symbols-outlined text-[16px]">schedule</span>
          </div>
          <div className="text-2xl font-mono font-extrabold text-yellow-800 mt-1">
            {alertSummary?.warning60Count || 0}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('notice');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeAlertFilter === 'notice'
              ? 'bg-teal-50 border-primary ring-2 ring-primary/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-primary/50'
          }`}
        >
          <div className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center justify-between">
            <span>&lt;90d Notice</span>
            <span className="material-symbols-outlined text-[16px]">event_upcoming</span>
          </div>
          <div className="text-2xl font-mono font-extrabold text-primary mt-1">
            {alertSummary?.notice90Count || 0}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('low_stock');
            setPage(1);
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeAlertFilter === 'low_stock'
              ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-600/20'
              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-rose-500/50'
          }`}
        >
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider flex items-center justify-between">
            <span>Low Stock</span>
            <span className="material-symbols-outlined text-[16px]">production_quantity_limits</span>
          </div>
          <div className="text-2xl font-mono font-extrabold text-rose-700 mt-1">
            {alertSummary?.lowStockCount || 0}
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-surface-container-lowest">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-3 text-on-surface-variant/60 material-symbols-outlined text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Type-ahead search by brand name, generic formulation, medicine code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="w-full sm:w-64">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Medicines Table */}
      <Card className="overflow-hidden p-0 border-outline-variant/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-surface-container-low text-xs text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-container">
              <tr>
                <th className="px-5 py-4">Code & Medicine</th>
                <th className="px-5 py-4">Category & Location</th>
                <th className="px-5 py-4">Packaging & MRP</th>
                <th className="px-5 py-4">Sellable Stock</th>
                <th className="px-5 py-4">Earliest Expiry</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl animate-spin text-primary block mb-2 mx-auto">
                      progress_activity
                    </span>
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block mb-2 mx-auto">
                      inventory_2
                    </span>
                    No medicines found matching the selected filter.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isExpanded = expandedItemId === item._id;
                  const pcsPerStrip = item.unitHierarchy?.piecesPerStrip || 1;
                  const stripsPerBox = item.unitHierarchy?.stripsPerBox || 1;
                  const totalPcsBox = pcsPerStrip * stripsPerBox;
                  const sellable = item.totalSellablePieces || 0;

                  return (
                    <React.Fragment key={item._id}>
                      <tr
                        className={`hover:bg-surface-container-low/60 transition-colors ${
                          !item.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Code and Brand Name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs text-primary font-bold bg-primary-container/10 px-2 py-1 rounded-lg border border-primary/20">
                              {item.itemCode}
                            </span>
                            <div>
                              <span className="font-bold text-on-surface">{item.tradeName}</span>
                              <div className="text-xs text-on-surface-variant">{item.genericName}</div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Shelf */}
                        <td className="px-5 py-4">
                          <div className="text-xs font-semibold text-on-surface">{item.category}</div>
                          <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">location_on</span>
                            {item.shelfLocation || 'Unassigned'}
                          </div>
                        </td>

                        {/* Unit Packaging & MRP */}
                        <td className="px-5 py-4">
                          <div className="text-xs font-mono text-on-surface">
                            Unit: <span className="text-primary font-bold">৳ {item.mrpPerPiece}</span>
                            <span className="text-on-surface-variant ml-1">
                              (Strip: ৳ {item.stripPrice} | Box: ৳ {item.boxPrice})
                            </span>
                          </div>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">
                            {stripsPerBox} strips × {pcsPerStrip} pcs ({totalPcsBox} pcs/box)
                          </div>
                        </td>

                        {/* Sellable Stock with Low Stock tag */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-on-surface">
                              {sellable} pcs
                            </span>
                            {item.isLowStock && (
                              <Badge variant="error">Low (&lt;{item.lowStockThresholdPieces})</Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-on-surface-variant font-mono">
                            {Math.floor(sellable / totalPcsBox)} box,{' '}
                            {Math.floor((sellable % totalPcsBox) / pcsPerStrip)} strip,{' '}
                            {sellable % pcsPerStrip} pc
                          </div>
                        </td>

                        {/* Earliest Expiry */}
                        <td className="px-5 py-4">{getExpiryBadge(item.earliestExpiry)}</td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleItemBatches(item._id)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                                isExpanded
                                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                                  : 'bg-surface-container-low text-on-surface border-outline-variant/40 hover:bg-surface-container'
                              }`}
                              title="View & manage individual batches"
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                              Batches ({item.batchCount || 0})
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setPreselectedItem(item);
                                setIsReceivingModalOpen(true);
                              }}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                              title="Receive stock for this medicine"
                            >
                              <span className="material-symbols-outlined text-[20px]">add_box</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setItemToEdit(item);
                                setIsItemModalOpen(true);
                              }}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                              title="Edit medicine master"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>

                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(item._id)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  item.isActive
                                    ? 'text-on-surface-variant hover:text-error hover:bg-error-container/30'
                                    : 'text-error hover:text-emerald-700 hover:bg-emerald-100'
                                }`}
                                title={item.isActive ? 'Deactivate medicine' : 'Activate medicine'}
                              >
                                <span className="material-symbols-outlined text-[20px]">
                                  {item.isActive ? 'block' : 'check_circle'}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Batch Drawer Row */}
                      {isExpanded && (
                        <tr className="bg-surface-container-low/50 border-b border-surface-container">
                          <td colSpan={6} className="p-5">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[18px]">layers</span>
                                  Active Batches for {item.tradeName} (FEFO Ordered)
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreselectedItem(item);
                                    setIsReceivingModalOpen(true);
                                  }}
                                >
                                  <span className="material-symbols-outlined text-[16px] mr-1">
                                    add
                                  </span>
                                  Receive New Batch
                                </Button>
                              </div>

                              {loadingBatches ? (
                                <div className="text-center py-6 text-xs text-on-surface-variant animate-pulse">
                                  Loading batch inventory...
                                </div>
                              ) : expandedBatches.length === 0 ? (
                                <div className="p-6 text-center text-xs text-on-surface-variant bg-surface-container-lowest rounded-xl border border-surface-container">
                                  No active batches recorded for this medicine. Click "Receive New Batch" to add stock.
                                </div>
                              ) : (
                                <div className="overflow-x-auto rounded-xl border border-surface-container bg-surface-container-lowest">
                                  <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-container">
                                      <tr>
                                        <th className="px-4 py-3">Batch No</th>
                                        <th className="px-4 py-3">Expiry Date</th>
                                        <th className="px-4 py-3">Sellable</th>
                                        <th className="px-4 py-3">Damaged</th>
                                        <th className="px-4 py-3">Expired</th>
                                        {isOwner && <th className="px-4 py-3">Cost / Pc</th>}
                                        <th className="px-4 py-3">Supplier</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-surface-container">
                                      {expandedBatches.map((batch) => (
                                        <tr key={batch._id} className="hover:bg-surface-container-low/40">
                                          <td className="px-4 py-3 font-mono font-bold text-on-surface">
                                            {batch.batchNumber}
                                          </td>
                                          <td className="px-4 py-3">
                                            {getExpiryBadge(batch.expiryDate)}
                                          </td>
                                          <td className="px-4 py-3 font-mono text-emerald-700 font-bold">
                                            {batch.qtySellable} pcs
                                          </td>
                                          <td className="px-4 py-3 font-mono text-amber-700 font-medium">
                                            {batch.qtyDamaged} pcs
                                          </td>
                                          <td className="px-4 py-3 font-mono text-error font-medium">
                                            {batch.qtyExpired} pcs
                                          </td>

                                          {/* Cost per piece (Owner only) */}
                                          {isOwner && (
                                            <td className="px-4 py-3 font-mono">
                                              {batch.isCostMissing ? (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setSelectedBatchForCost(batch);
                                                    setSelectedItemForAdj(item);
                                                    setIsCostModalOpen(true);
                                                  }}
                                                  className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold hover:bg-amber-200 cursor-pointer"
                                                >
                                                  Cost Missing ✏️
                                                </button>
                                              ) : (
                                                <span className="text-on-surface font-semibold">
                                                  ৳ {batch.purchasePricePerPiece}
                                                </span>
                                              )}
                                            </td>
                                          )}

                                          <td className="px-4 py-3 text-on-surface-variant">
                                            {batch.supplierName || '—'}
                                          </td>

                                          <td className="px-4 py-3 text-right">
                                            {isOwner && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                  setSelectedBatchForAdj(batch);
                                                  setSelectedItemForAdj(item);
                                                  setIsAdjustmentModalOpen(true);
                                                }}
                                              >
                                                Adjust
                                              </Button>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-surface-container-low border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
            <div>
              Showing page <span className="font-bold text-on-surface">{page}</span> of{' '}
              <span className="font-bold text-on-surface">{totalPages}</span> ({totalItems} total)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={() => {
          loadData();
          fetchAlerts();
        }}
        itemToEdit={itemToEdit}
      />

      <StockReceivingModal
        isOpen={isReceivingModalOpen}
        onClose={() => setIsReceivingModalOpen(false)}
        onSuccess={() => {
          loadData();
          fetchAlerts();
          if (expandedItemId) toggleItemBatches(expandedItemId);
        }}
        preselectedItem={preselectedItem}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={() => {
          loadData();
          fetchAlerts();
          if (expandedItemId) toggleItemBatches(expandedItemId);
        }}
        batch={selectedBatchForAdj}
        item={selectedItemForAdj}
      />

      <BatchCostModal
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        onSuccess={() => {
          loadData();
          if (expandedItemId) toggleItemBatches(expandedItemId);
        }}
        batch={selectedBatchForCost}
        item={selectedItemForAdj}
      />
    </div>
  );
};
