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
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Batch Info Summary */}
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100">{item.tradeName}</span>
            <span className="text-xs font-mono font-semibold text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800/40">
              Batch: {batch.batchNumber}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-1.5 bg-slate-800/60 rounded">
              <span className="text-slate-400 block">Sellable</span>
              <span className="font-mono font-bold text-emerald-400">{batch.qtySellable} pcs</span>
            </div>
            <div className="p-1.5 bg-slate-800/60 rounded">
              <span className="text-slate-400 block">Damaged</span>
              <span className="font-mono font-bold text-amber-400">{batch.qtyDamaged} pcs</span>
            </div>
            <div className="p-1.5 bg-slate-800/60 rounded">
              <span className="text-slate-400 block">Expired</span>
              <span className="font-mono font-bold text-rose-400">{batch.qtyExpired} pcs</span>
            </div>
          </div>
        </div>

        {/* Action Type Selector */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActionType('transfer');
              setFromBucket('sellable');
              setToBucket('damaged');
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
              actionType === 'transfer'
                ? 'bg-teal-600 text-white border-teal-500 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-700'
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
            className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
              actionType === 'write_off'
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-700'
            }`}
          >
            Write-Off Spoiled Stock
          </button>
        </div>

        {/* Bucket Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              From Bucket (Available: {availableInSource} pcs)
            </label>
            <select
              value={fromBucket}
              onChange={(e) => setFromBucket(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/60 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {actionType === 'transfer' && <option value="sellable">Sellable ({batch.qtySellable})</option>}
              <option value="damaged">Damaged ({batch.qtyDamaged})</option>
              <option value="expired">Expired ({batch.qtyExpired})</option>
            </select>
          </div>

          {actionType === 'transfer' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                To Destination Bucket
              </label>
              <select
                value={toBucket}
                onChange={(e) => setToBucket(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/60 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="sellable">Sellable</option>
                <option value="damaged">Damaged</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Disposal Action
              </label>
              <div className="px-3 py-2 bg-rose-950/40 border border-rose-800/40 text-rose-300 rounded-lg text-sm font-semibold">
                Permanent Disposal / Write-Off
              </div>
            </div>
          )}
        </div>

        {/* Quantity */}
        <Input
          label="Quantity (Pieces)"
          type="number"
          min="1"
          max={availableInSource}
          value={quantityPieces}
          onChange={(e) => setQuantityPieces(e.target.value)}
          helperText={`Maximum adjustable pieces: ${availableInSource}`}
          required
        />

        {/* Structured Reason Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Audit Reason Category <span className="text-teal-400">*</span>
          </label>
          <select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/60 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {REASON_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Detail Note */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Mandatory Explanation Note <span className="text-teal-400">*</span>
          </label>
          <textarea
            rows={2}
            value={reasonDetail}
            onChange={(e) => setReasonDetail(e.target.value)}
            placeholder="Explain why this stock is being adjusted or written off..."
            className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/60 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
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
