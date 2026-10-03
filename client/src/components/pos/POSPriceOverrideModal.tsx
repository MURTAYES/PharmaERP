import React, { useState } from 'react';
import Decimal from 'decimal.js';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface POSPriceOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeName: string;
  unit: string;
  catalogPrice: string;
  currentPrice: string;
  onApplyOverride: (newPrice: string) => void;
}

export const POSPriceOverrideModal: React.FC<POSPriceOverrideModalProps> = ({
  isOpen,
  onClose,
  tradeName,
  unit,
  catalogPrice,
  currentPrice,
  onApplyOverride,
}) => {
  const [priceInput, setPriceInput] = useState(currentPrice);

  const catalogDec = new Decimal(catalogPrice || 0);
  let varianceText = '0.00';
  let isDiscount = false;

  try {
    const inputDec = new Decimal(priceInput || 0);
    const diff = inputDec.minus(catalogDec);
    varianceText = diff.toFixed(2);
    isDiscount = diff.isNegative();
  } catch {}

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(priceInput);
    if (isNaN(num) || num < 0) return;
    onApplyOverride(parseFloat(priceInput).toFixed(2));
    onClose();
  };

  const handleReset = () => {
    onApplyOverride(catalogPrice);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Override Unit Price: ${tradeName}`} maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container space-y-1 text-xs">
          <div className="flex justify-between text-on-surface-variant">
            <span>Catalog Price (per {unit}):</span>
            <span className="font-mono font-bold text-on-surface">৳ {catalogPrice}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>Current Override Variance:</span>
            <span
              className={`font-mono font-bold ${
                isDiscount ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              ৳ {varianceText}
            </span>
          </div>
        </div>

        <Input
          label={`Selling Price (৳ per ${unit})`}
          type="number"
          step="0.01"
          min="0"
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          autoFocus
          required
        />

        <div className="flex justify-between items-center pt-2 border-t border-surface-container">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-primary hover:underline font-semibold cursor-pointer"
          >
            Reset to Catalog (৳ {catalogPrice})
          </button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Price
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
