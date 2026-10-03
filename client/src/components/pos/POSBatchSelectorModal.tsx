import React from 'react';
import { format } from 'date-fns';
import { Batch } from '../../types';

interface POSBatchSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeName: string;
  batches: (Batch & { isFefo?: boolean })[];
  currentBatchId: string;
  onSelectBatch: (batch: Batch & { isFefo?: boolean }) => void;
}

export const POSBatchSelectorModal: React.FC<POSBatchSelectorModalProps> = ({
  isOpen,
  onClose,
  tradeName,
  batches,
  currentBatchId,
  onSelectBatch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#002F34]/40 backdrop-blur-[6px] transition-all">
      <div className="relative w-full max-w-[520px] bg-white rounded-[28px] shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-[#E8F0ED] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002F34] text-white flex items-center justify-center shadow-md shadow-[#002F34]/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#002F34]">Select Batch</h2>
              <p className="text-xs text-[#5F7D7A] font-medium truncate max-w-[320px]">{tradeName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F2F7F5] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-3">
          <div className="p-3 bg-[#F0FAF7] border border-[#CEE8E2] rounded-xl text-xs text-[#1F544D]">
            System auto-suggests earliest-expiring batch (<strong>FEFO</strong>). Select an alternative only if physically dispensing another batch at the counter.
          </div>

          <div className="divide-y divide-[#EEF3F2] rounded-2xl border border-[#D5E3DE] overflow-hidden bg-white">
            {batches.map((batch) => {
              const isSelected = batch._id === currentBatchId;
              const expiryDateObj = new Date(batch.expiryDate);
              const formattedExpiry = format(expiryDateObj, 'MM/yyyy');
              const isFefo = batch.isFefo;

              return (
                <div
                  key={batch._id}
                  onClick={() => {
                    onSelectBatch(batch);
                    onClose();
                  }}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#F0FAF7] border-l-4 border-[#00A887]' : 'hover:bg-[#F8FAF9]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-[#002F34] bg-[#002F34]' : 'border-[#9FB7B2]'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#002F34]">
                          {batch.batchNumber}
                        </span>
                        {isFefo ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E1F6F0] text-[#007062] px-2 py-0.5 rounded-full border border-[#BCE8DD]">
                            FEFO Recommended
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                            Non-FEFO
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#5F7D7A] block mt-0.5">
                        Expires: <strong className="text-[#002F34] font-mono">{formattedExpiry}</strong>
                        {batch.supplierName ? ` · ${batch.supplierName}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-[#007062]">
                      {batch.qtySellable} pcs
                    </span>
                    <span className="block text-[11px] text-[#7A9894]">Available</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E8F0ED] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-[#D5E3DE] text-xs font-bold text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F4F7F6] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
