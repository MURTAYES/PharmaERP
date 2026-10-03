import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Batch, Item } from '../../types';
import { transferStock, writeOffStock } from '../../services/stockAdjustmentApi';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batch: Batch | null;
  item: Item | null;
}

const REASON_CATEGORIES = [
  'Damaged in Transit',
  'Shelf Spill/Breakage',
  'Physical Count Audit Variance',
  'Customer Return Quarantine',
  'Expired Stock Quarantine',
  'Supplier Return Prep',
  'Direct Adjustment',
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batch,
  item,
}) => {
  const [actionType, setActionType] = useState<'transfer' | 'write_off'>('transfer');
  const [fromBucket, setFromBucket] = useState<'sellable' | 'damaged' | 'expired'>('sellable');
  const [toBucket, setToBucket] = useState<'sellable' | 'damaged' | 'expired'>('damaged');
  const [quantityPieces, setQuantityPieces] = useState('1');
  const [reasonCategory, setReasonCategory] = useState(REASON_CATEGORIES[0]);
  const [reasonDetail, setReasonDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActionType('transfer');
    setFromBucket('sellable');
    setToBucket('damaged');
    setQuantityPieces('1');
    setReasonCategory(REASON_CATEGORIES[0]);
    setReasonDetail('');
    setError(null);
  }, [batch, isOpen]);

  if (!batch || !item) return null;

  const getAvailableQty = (bucket: 'sellable' | 'damaged' | 'expired') => {
    if (bucket === 'sellable') return batch.qtySellable;
    if (bucket === 'damaged') return batch.qtyDamaged;
    return batch.qtyExpired;
  };

  const availableInSource = getAvailableQty(fromBucket);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const qtyNum = parseInt(quantityPieces, 10);
      if (qtyNum <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      if (qtyNum > availableInSource) {
        throw new Error(`Cannot exceed available quantity (${availableInSource} pcs in ${fromBucket})`);
      }

      if (actionType === 'transfer') {
        if (fromBucket === toBucket) {
          throw new Error('Source and destination buckets must be different');
        }
        await transferStock({
          batchId: batch._id,
          fromBucket,
          toBucket,
          quantityPieces: qtyNum,
          reasonCategory,
          reasonDetail,
        });
      } else {
        if (fromBucket === 'sellable') {
          throw new Error('Please transfer to Damaged/Expired before writing off sellable stock');
        }
        await writeOffStock({
          batchId: batch._id,
          fromBucket: fromBucket as 'damaged' | 'expired',
          quantityPieces: qtyNum,
          reasonCategory,
          reasonDetail,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Bucket Adjustment & Audit" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3 bg-error-container text-on-error-container text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Batch Info Summary */}
        <div className="p-4 bg-surface-container-low border border-surface-container rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface">{item.tradeName}</span>
            <span className="text-xs font-mono font-bold text-primary bg-primary-container/15 px-2.5 py-1 rounded-lg border border-primary/20">
              Batch: {batch.batchNumber}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-surface-container-lowest rounded-xl border border-surface-container">
              <span className="text-on-surface-variant block text-[11px] font-semibold">Sellable</span>
              <span className="font-mono font-extrabold text-emerald-700 text-sm">{batch.qtySellable} pcs</span>
            </div>
            <div className="p-2 bg-surface-container-lowest rounded-xl border border-surface-container">
              <span className="text-on-surface-variant block text-[11px] font-semibold">Damaged</span>
              <span className="font-mono font-extrabold text-amber-700 text-sm">{batch.qtyDamaged} pcs</span>
            </div>
            <div className="p-2 bg-surface-container-lowest rounded-xl border border-surface-container">
              <span className="text-on-surface-variant block text-[11px] font-semibold">Expired</span>
              <span className="font-mono font-extrabold text-error text-sm">{batch.qtyExpired} pcs</span>
            </div>
          </div>
        </div>

        {/* Action Type Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setActionType('transfer');
              setFromBucket('sellable');
              setToBucket('damaged');
            }}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              actionType === 'transfer'
                ? 'bg-primary text-on-primary border-primary shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
            }`}
          >
            Transfer Between Buckets
          </button>
          <button
            type="button"
            onClick={() => {
              setActionType('write_off');
              setFromBucket('damaged');
            }}
            className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              actionType === 'write_off'
                ? 'bg-error text-on-error border-error shadow-sm'
                : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
            }`}
          >
            Write-Off Spoiled Stock
          </button>
        </div>

        {/* Bucket Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              From (Avail: {availableInSource} pcs)
            </label>
            <select
              value={fromBucket}
              onChange={(e) => setFromBucket(e.target.value as any)}
              className="w-full h-11 px-3 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              {actionType === 'transfer' && <option value="sellable">Sellable ({batch.qtySellable})</option>}
              <option value="damaged">Damaged ({batch.qtyDamaged})</option>
              <option value="expired">Expired ({batch.qtyExpired})</option>
            </select>
          </div>

          {actionType === 'transfer' ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                To Destination Bucket
              </label>
              <select
                value={toBucket}
                onChange={(e) => setToBucket(e.target.value as any)}
                className="w-full h-11 px-3 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="sellable">Sellable</option>
                <option value="damaged">Damaged</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Disposal Action
              </label>
              <div className="h-11 px-3 bg-red-50 border border-error/30 text-error rounded-xl text-xs font-bold flex items-center">
                Permanent Disposal / Write-Off
              </div>
            </div>
          )}
        </div>

        {/* Quantity */}
        <Input
          label="Quantity (Pieces - Whole Number)"
          type="number"
          step="1"
          min="1"
          max={availableInSource}
          value={quantityPieces}
          onKeyDown={(e) => {
            if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-') {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '');
            setQuantityPieces(val);
          }}
          helperText={`Maximum adjustable pieces: ${availableInSource}`}
          required
        />

        {/* Structured Reason Category */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Audit Reason Category <span className="text-primary font-bold">*</span>
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full h-11 px-3 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          >
            {REASON_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Detail Note */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Mandatory Explanation Note <span className="text-primary font-bold">*</span>
          </label>
          <textarea
            rows={2}
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value)}
            placeholder="Explain why this stock is being adjusted or written off..."
            className="w-full p-3 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={actionType === 'write_off' ? 'danger' : 'primary'}
            isLoading={loading}
          >
            {actionType === 'write_off' ? 'Confirm Write-Off' : 'Execute Transfer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
