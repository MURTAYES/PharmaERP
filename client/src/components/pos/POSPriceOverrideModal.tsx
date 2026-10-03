import React, { useState } from 'react';
import Decimal from 'decimal.js';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#002F34]/40 backdrop-blur-[6px] transition-all">
      <div className="relative w-full max-w-[460px] bg-white rounded-[28px] shadow-2xl border border-white/80 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-[#E8F0ED] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002F34] text-white flex items-center justify-center shadow-md shadow-[#002F34]/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#002F34]">Override Unit Price</h2>
              <p className="text-xs text-[#5F7D7A] truncate max-w-[280px]">{tradeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F2F7F5] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          <div className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#E8EFEA] space-y-2 text-xs">
            <div className="flex justify-between text-[#5F7D7A]">
              <span>Standard Catalog Rate (per {unit}):</span>
              <span className="font-mono font-bold text-[#002F34]">৳ {catalogPrice}</span>
            </div>
            <div className="flex justify-between text-[#5F7D7A]">
              <span>Variance from Standard:</span>
              <span
                className={`font-mono font-bold ${
                  isDiscount ? 'text-[#007062]' : 'text-amber-800'
                }`}
              >
                {isDiscount ? '' : '+'}৳ {varianceText}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#002F34] mb-1.5">
              Custom Selling Price (৳ per {unit})
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-[#007062]">৳</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                autoFocus
                required
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#D5E3DE] rounded-xl text-lg font-bold font-mono text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[#E8F0ED]">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-[#006059] hover:underline font-bold cursor-pointer"
            >
              Reset to Catalog (৳{catalogPrice})
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#D5E3DE] text-xs font-bold text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F4F7F6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#002F34] text-white text-xs font-bold shadow-md shadow-[#002F34]/20 hover:bg-[#012428]"
              >
                Apply Override
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
