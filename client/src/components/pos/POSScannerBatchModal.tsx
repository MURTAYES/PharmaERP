import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Item, Batch } from '../../types';

interface POSScannerBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  activeBatches: Batch[];
  onSelectBatch: (item: Item, batch: Batch) => void;
}

export const POSScannerBatchModal: React.FC<POSScannerBatchModalProps> = ({
  isOpen,
  onClose,
  item,
  activeBatches,
  onSelectBatch,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [isOpen, activeBatches]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(activeBatches.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (item && activeBatches[selectedIndex]) {
          onSelectBatch(item, activeBatches[selectedIndex]);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, activeBatches, item, onSelectBatch, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002F34]/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E7F6F3] text-[#006059] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#002F34]">Select Scanned Batch</h2>
              <p className="text-xs text-slate-400">Multiple active batches available in dispensary</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Medicine Overview Banner */}
        <div className="p-4 bg-[#F8FAF9] border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#002F34]">{item.tradeName}</h3>
            <p className="text-xs text-slate-500 font-medium">{item.genericName}</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#006059] bg-[#E7F6F3] px-2.5 py-1 rounded-full border border-[#C5E8E0]">
            {activeBatches.length} Batches in Stock
          </span>
        </div>

        {/* Batch Options List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {activeBatches.map((batch, idx) => {
            const isFefo = idx === 0;
            const isSelected = selectedIndex === idx;
            const expDate = batch.expiryDate ? new Date(batch.expiryDate) : null;
            const formattedExp = expDate ? format(expDate, 'MM/yy') : 'N/A';

            return (
              <div
                key={batch._id}
                onClick={() => {
                  onSelectBatch(item, batch);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-[#002F34] bg-[#002F34]/5 shadow-xs ring-1 ring-[#002F34]'
                    : 'border-slate-200 bg-white hover:border-[#97D8D0] hover:bg-[#F8FAF9]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#002F34]">
                        {batch.batchNumber}
                      </span>
                      {isFefo && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full uppercase tracking-wider">
                          FEFO (Earliest)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Expires: {formattedExp}
                    </span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-4">
                  <div>
                    <span className="text-sm font-bold font-mono text-[#002F34] block">
                      {batch.qtySellable} pcs
                    </span>
                    <span className="text-[10px] text-slate-400">Available</span>
                  </div>
                  <span className="text-xs font-bold text-[#006059] bg-[#E7F6F3] px-2.5 py-1 rounded-xl">
                    Select ↵
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Use ↑ ↓ arrow keys and Enter to select</span>
          <button
            onClick={onClose}
            className="px-3 py-1 font-semibold text-slate-500 hover:text-slate-800"
          >
            Cancel (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
