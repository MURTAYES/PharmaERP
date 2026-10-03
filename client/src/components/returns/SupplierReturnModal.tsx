import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { returnApi, SupplierReturnPayload } from '../../services/returnApi';
import { getItems } from '../../services/itemApi';
import { getBatchesByItem } from '../../services/batchApi';
import { Item, Batch } from '../../types';

interface SupplierReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SupplierReturnModal: React.FC<SupplierReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [supplierInvoiceRef, setSupplierInvoiceRef] = useState('');
  const [reasonCategory, setReasonCategory] = useState('Damaged/Expired Distributor Return');
  const [reasonDetail, setReasonDetail] = useState('');

  // Item & Batch Selection
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Return Line Drafts
  const [lines, setLines] = useState<
    Array<{
      batchId: string;
      batchNumber: string;
      fromBucket: 'damaged' | 'expired';
      maxAvailable: number;
      quantityPieces: number;
    }>
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getItems({ limit: 100 })
      .then((res) => setItems(res.items || []))
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (selectedItemId) {
      setLoadingBatches(true);
      getBatchesByItem(selectedItemId)
        .then((res) => setBatches(res.batches || []))
        .catch(() => setBatches([]))
        .finally(() => setLoadingBatches(false));
    } else {
      setBatches([]);
    }
  }, [selectedItemId]);

  const handleAddBatchLine = (batch: Batch, fromBucket: 'damaged' | 'expired') => {
    const maxAvailable = fromBucket === 'damaged' ? batch.qtyDamaged : batch.qtyExpired;
    if (maxAvailable <= 0) return;

    if (lines.some((l) => l.batchId === batch._id && l.fromBucket === fromBucket)) return;

    setLines([
      ...lines,
      {
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        fromBucket,
        maxAvailable,
        quantityPieces: maxAvailable,
      },
    ]);
  };

  const handleRemoveLine = (batchId: string, fromBucket: string) => {
    setLines(lines.filter((l) => !(l.batchId === batchId && l.fromBucket === fromBucket)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      setError('Supplier name is required');
      return;
    }
    if (lines.length === 0) {
      setError('Please add at least one damaged or expired batch to return');
      return;
    }

    for (const l of lines) {
      if (l.quantityPieces <= 0 || l.quantityPieces > l.maxAvailable) {
        setError(`Invalid quantity for batch ${l.batchNumber}`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const payload: SupplierReturnPayload = {
        supplierName: supplierName.trim(),
        supplierInvoiceRef: supplierInvoiceRef.trim() || undefined,
        lines: lines.map((l) => ({
          batchId: l.batchId,
          fromBucket: l.fromBucket,
          quantityPieces: l.quantityPieces,
        })),
        reasonCategory,
        reasonDetail: reasonDetail.trim() || 'Distributor Batch Return Voucher',
      };

      await returnApi.createSupplierReturn(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create supplier return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Supplier Return Invoice (SRT)"
      subtitle="Return damaged or expired batches to pharmaceutical distributor"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3 bg-red-50 text-error border border-red-200 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Supplier / Distributor Name"
            placeholder="e.g. Beximco Pharma Regional Depot"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Supplier Memo / Invoice Ref"
            placeholder="e.g. SUP-MEMO-9912"
            value={supplierInvoiceRef}
            onChange={(e) => setSupplierInvoiceRef(e.target.value)}
          />
        </div>

        {/* Batch Selection Box */}
        <div className="p-4 bg-surface-container-low border border-surface-container rounded-2xl space-y-3">
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
            Select Medicine & Batch with Damaged / Expired Stock:
          </span>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-on-surface-variant">Select Medicine</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="">-- Choose medicine to view batches --</option>
              {items.map((itm) => (
                <option key={itm._id} value={itm._id}>
                  {itm.tradeName} ({itm.genericName})
                </option>
              ))}
            </select>
          </div>

          {loadingBatches && (
            <div className="text-center py-4 text-xs text-on-surface-variant animate-pulse">
              Loading batches...
            </div>
          )}

          {batches.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-on-surface-variant">Available Batches:</span>
              <div className="max-h-40 overflow-y-auto divide-y divide-surface-container rounded-xl border border-surface-container bg-surface-container-lowest">
                {batches.map((b) => (
                  <div key={b._id} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-primary mr-2">Batch: {b.batchNumber}</span>
                      <span className="text-amber-800 font-mono text-[11px] mr-2">
                        Damaged: {b.qtyDamaged} pcs
                      </span>
                      <span className="text-rose-800 font-mono text-[11px]">
                        Expired: {b.qtyExpired} pcs
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      {b.qtyDamaged > 0 && (
                        <button
                          type="button"
                          onClick={() => handleAddBatchLine(b, 'damaged')}
                          className="px-2 py-1 bg-amber-100 text-amber-900 rounded-lg text-[10px] font-bold hover:bg-amber-200 cursor-pointer"
                        >
                          + Return Damaged
                        </button>
                      )}
                      {b.qtyExpired > 0 && (
                        <button
                          type="button"
                          onClick={() => handleAddBatchLine(b, 'expired')}
                          className="px-2 py-1 bg-rose-100 text-rose-900 rounded-lg text-[10px] font-bold hover:bg-rose-200 cursor-pointer"
                        >
                          + Return Expired
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Lines for Return */}
        {lines.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Items to Return to Supplier ({lines.length}):
            </span>
            <div className="divide-y divide-surface-container border border-surface-container rounded-xl bg-surface-container-lowest overflow-hidden">
              {lines.map((line, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-primary">Batch {line.batchNumber}</span>
                    <span className="text-on-surface-variant ml-2 capitalize">
                      (From: <strong className="text-on-surface">{line.fromBucket}</strong> bucket)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-on-surface-variant">Qty (pcs):</span>
                      <input
                        type="number"
                        min="1"
                        max={line.maxAvailable}
                        value={line.quantityPieces}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                          const next = [...lines];
                          next[idx].quantityPieces = val;
                          setLines(next);
                        }}
                        className="w-16 h-8 px-2 bg-surface-container-low border border-outline-variant/40 rounded-lg text-xs font-mono font-bold text-on-surface focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.batchId, line.fromBucket)}
                      className="p-1 text-on-surface-variant hover:text-error cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Supplier Return Category
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full h-11 px-3 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
          >
            <option value="Damaged/Expired Distributor Return">Damaged/Expired Distributor Return</option>
            <option value="Near-Expiry Distributor Credit Claim">Near-Expiry Distributor Credit Claim</option>
            <option value="Distributor Batch Recall">Distributor Batch Recall</option>
            <option value="Overstock Return">Overstock Return</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Explanation / Claim Reference Note
          </label>
          <textarea
            rows={2}
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value)}
            placeholder="e.g. Return of expired stock per distributor quarterly credit agreement..."
            className="w-full p-3 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} disabled={lines.length === 0}>
            Issue Supplier Return
          </Button>
        </div>
      </form>
    </Modal>
  );
};
