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
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3 bg-error-container text-on-error-container text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-surface-container-low border border-surface-container rounded-xl text-xs space-y-1">
          <div className="font-bold text-on-surface">{item.tradeName}</div>
          <div className="text-on-surface-variant">
            Batch: <span className="font-mono text-primary font-bold">{batch.batchNumber}</span>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Unit For Entered Cost
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['box', 'strip', 'piece'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all capitalize cursor-pointer ${
                  unit === u
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
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

        <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
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
