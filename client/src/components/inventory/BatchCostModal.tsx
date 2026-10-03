import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Batch, Item } from '../../types';
import { updateBatchCost } from '../../services/batchApi';

interface BatchCostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batch: Batch | null;
  item: Item | null;
}

export const BatchCostModal: React.FC<BatchCostModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  batch,
  item,
}) => {
  const [purchasePrice, setPurchasePrice] = useState('');
  const [unit, setUnit] = useState<'piece' | 'strip' | 'box'>('box');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!batch || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await updateBatchCost(batch._id, {
        purchasePrice,
        unit,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update cost');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Batch Purchase Cost" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1">
          <div className="font-semibold text-slate-200">{item.tradeName}</div>
          <div className="text-slate-400">
            Batch: <span className="font-mono text-teal-400 font-bold">{batch.batchNumber}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Unit For Entered Cost
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['box', 'strip', 'piece'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all capitalize ${
                  unit === u
                    ? 'bg-teal-600 text-white border-teal-500'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <Input
          label={`Purchase Cost (৳) [Per ${unit}]`}
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 800.00"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
          required
          autoFocus
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Update Cost
          </Button>
        </div>
      </form>
    </Modal>
  );
};
