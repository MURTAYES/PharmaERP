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
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-400 text-3xl">medication</span>
            Medicine & Inventory Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Batch-wise stock control with multi-unit hierarchy, FEFO tracking, and real-time alert filters.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => {
              setItemToEdit(null);
              setIsItemModalOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-lg mr-1.5">add_circle</span>
            Add Medicine
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              setPreselectedItem(null);
              setIsReceivingModalOpen(true);
            }}
          >
            <span className="material-symbols-outlined text-lg mr-1.5">inventory_2</span>
            Receive Stock
          </Button>
        </div>
      </div>

      {/* Top Alert KPI Chips (1-Click Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('all');
            setPage(1);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeAlertFilter === 'all'
              ? 'bg-slate-800 border-teal-500/80 ring-2 ring-teal-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            All Items
          </div>
          <div className="text-xl font-mono font-bold text-slate-100 mt-1">{totalItems}</div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('expired');
            setPage(1);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeAlertFilter === 'expired'
              ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-rose-900/60'
          }`}
        >
          <div className="text-xs text-rose-400 font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Expired</span>
            <span className="material-symbols-outlined text-sm">dangerous</span>
          </div>
          <div className="text-xl font-mono font-bold text-rose-300 mt-1">
            {alertSummary?.expiredCount || 0}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('critical');
            setPage(1);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeAlertFilter === 'critical'
              ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-amber-900/60'
          }`}
        >
          <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>&lt;30d Critical</span>
            <span className="material-symbols-outlined text-sm">warning</span>
          </div>
          <div className="text-xl font-mono font-bold text-amber-300 mt-1">
            {alertSummary?.critical30Count || 0}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('warning');
            setPage(1);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeAlertFilter === 'warning'
              ? 'bg-yellow-950/40 border-yellow-500 ring-2 ring-yellow-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-yellow-900/60'
          }`}
        >
          <div className="text-xs text-yellow-400 font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>&lt;60d Warning</span>
            <span className="material-symbols-outlined text-sm">schedule</span>
          </div>
          <div className="text-xl font-mono font-bold text-yellow-300 mt-1">
            {alertSummary?.warning60Count || 0}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('notice');
            setPage(1);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeAlertFilter === 'notice'
              ? 'bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-teal-900/60'
          }`}
        >
          <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>&lt;90d Notice</span>
            <span className="material-symbols-outlined text-sm">event_upcoming</span>
          </div>
          <div className="text-xl font-mono font-bold text-teal-300 mt-1">
            {alertSummary?.notice90Count || 0}
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveAlertFilter('low_stock');
            setPage(1);
          }}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeAlertFilter === 'low_stock'
              ? 'bg-rose-950/40 border-rose-400 ring-2 ring-rose-400/20'
              : 'bg-slate-900/60 border-slate-800 hover:border-rose-900/60'
          }`}
        >
          <div className="text-xs text-rose-300 font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Low Stock</span>
            <span className="material-symbols-outlined text-sm">production_quantity_limits</span>
          </div>
          <div className="text-xl font-mono font-bold text-rose-300 mt-1">
            {alertSummary?.lowStockCount || 0}
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/90">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-500 material-symbols-outlined text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Type-ahead search by brand name, generic name, code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
      <Card className="overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/90 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Code & Medicine Name</th>
                <th className="px-4 py-3.5">Category & Shelf</th>
                <th className="px-4 py-3.5">Unit Packaging & MRP</th>
                <th className="px-4 py-3.5">Sellable Stock</th>
                <th className="px-4 py-3.5">Earliest Expiry</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <span className="material-symbols-outlined text-3xl animate-spin text-teal-400 block mb-2">
                      progress_activity
                    </span>
                    Loading inventory catalog...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <span className="material-symbols-outlined text-4xl text-slate-600 block mb-2">
                      inventory
                    </span>
                    No medicines found matching the selected criteria.
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
                        className={`hover:bg-slate-800/40 transition-colors ${
                          !item.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Code and Brand Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-teal-400 bg-teal-950/70 px-1.5 py-0.5 rounded border border-teal-800/40">
                              {item.itemCode}
                            </span>
                            <div>
                              <span className="font-semibold text-slate-100">{item.tradeName}</span>
                              <div className="text-xs text-slate-400">{item.genericName}</div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Shelf */}
                        <td className="px-4 py-3">
                          <div className="text-xs text-slate-300">{item.category}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-xs">location_on</span>
                            {item.shelfLocation || 'Unassigned'}
                          </div>
                        </td>

                        {/* Unit Packaging & MRP */}
                        <td className="px-4 py-3">
                          <div className="text-xs font-mono text-slate-200">
                            Unit: <span className="text-teal-300 font-bold">৳ {item.mrpPerPiece}</span>
                            <span className="text-slate-500 ml-1">
                              (Strip: ৳ {item.stripPrice} | Box: ৳ {item.boxPrice})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {stripsPerBox} strips × {pcsPerStrip} pcs ({totalPcsBox} pcs/box)
                          </div>
                        </td>

                        {/* Sellable Stock with Low Stock tag */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-100">
                              {sellable} pcs
                            </span>
                            {item.isLowStock && (
                              <Badge variant="error">Low (&lt;{item.lowStockThresholdPieces})</Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {Math.floor(sellable / totalPcsBox)} box,{' '}
                            {Math.floor((sellable % totalPcsBox) / pcsPerStrip)} strip,{' '}
                            {sellable % pcsPerStrip} pc
                          </div>
                        </td>

                        {/* Earliest Expiry */}
                        <td className="px-4 py-3">{getExpiryBadge(item.earliestExpiry)}</td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleItemBatches(item._id)}
                              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
                                isExpanded
                                  ? 'bg-teal-600 text-white border-teal-500'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                              }`}
                              title="View & manage individual batches"
                            >
                              <span className="material-symbols-outlined text-xs">
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
                              className="p-1 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded transition-colors"
                              title="Receive stock for this medicine"
                            >
                              <span className="material-symbols-outlined text-sm">add_box</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setItemToEdit(item);
                                setIsItemModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded transition-colors"
                              title="Edit medicine master"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>

                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(item._id)}
                                className={`p-1 rounded transition-colors ${
                                  item.isActive
                                    ? 'text-slate-400 hover:text-rose-400'
                                    : 'text-rose-400 hover:text-emerald-400'
                                }`}
                                title={item.isActive ? 'Deactivate medicine' : 'Activate medicine'}
                              >
                                <span className="material-symbols-outlined text-sm">
                                  {item.isActive ? 'block' : 'check_circle'}
                                </span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Batch Drawer Row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800">
                          <td colSpan={6} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-teal-400 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-sm">layers</span>
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
                                  <span className="material-symbols-outlined text-xs mr-1">
                                    add
                                  </span>
                                  Receive New Batch
                                </Button>
                              </div>

                              {loadingBatches ? (
                                <div className="text-center py-4 text-xs text-slate-400 animate-pulse">
                                  Loading batches...
                                </div>
                              ) : expandedBatches.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-500 bg-slate-900/40 rounded-lg border border-slate-800">
                                  No stock batches found for this item. Click "Receive New Batch" to add stock.
                                </div>
                              ) : (
                                <div className="overflow-x-auto rounded-lg border border-slate-800">
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                                      <tr>
                                        <th className="px-3 py-2">Batch No</th>
                                        <th className="px-3 py-2">Expiry Date</th>
                                        <th className="px-3 py-2">Sellable</th>
                                        <th className="px-3 py-2">Damaged</th>
                                        <th className="px-3 py-2">Expired</th>
                                        {isOwner && <th className="px-3 py-2">Cost / Pc</th>}
                                        <th className="px-3 py-2">Supplier</th>
                                        <th className="px-3 py-2 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 bg-slate-950">
                                      {expandedBatches.map((batch) => (
                                        <tr key={batch._id} className="hover:bg-slate-900/60">
                                          <td className="px-3 py-2 font-mono font-bold text-slate-200">
                                            {batch.batchNumber}
                                          </td>
                                          <td className="px-3 py-2">
                                            {getExpiryBadge(batch.expiryDate)}
                                          </td>
                                          <td className="px-3 py-2 font-mono text-emerald-400 font-semibold">
                                            {batch.qtySellable} pcs
                                          </td>
                                          <td className="px-3 py-2 font-mono text-amber-400">
                                            {batch.qtyDamaged} pcs
                                          </td>
                                          <td className="px-3 py-2 font-mono text-rose-400">
                                            {batch.qtyExpired} pcs
                                          </td>

                                          {/* Cost per piece (Owner only) */}
                                          {isOwner && (
                                            <td className="px-3 py-2 font-mono">
                                              {batch.isCostMissing ? (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setSelectedBatchForCost(batch);
                                                    setSelectedItemForAdj(item);
                                                    setIsCostModalOpen(true);
                                                  }}
                                                  className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] hover:bg-amber-500/30"
                                                >
                                                  Cost Missing ✏️
                                                </button>
                                              ) : (
                                                <span className="text-slate-300">
                                                  ৳ {batch.purchasePricePerPiece}
                                                </span>
                                              )}
                                            </td>
                                          )}

                                          <td className="px-3 py-2 text-slate-400">
                                            {batch.supplierName || '—'}
                                          </td>

                                          <td className="px-3 py-2 text-right">
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
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing page <span className="font-bold text-slate-200">{page}</span> of{' '}
              <span className="font-bold text-slate-200">{totalPages}</span> ({totalItems} total)
            </div>
            <div className="flex gap-1.5">
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
