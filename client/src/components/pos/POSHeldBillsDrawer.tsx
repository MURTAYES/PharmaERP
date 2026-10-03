import React from 'react';
import { format } from 'date-fns';
import { HeldBill } from '../../types';

interface POSHeldBillsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  heldBills: HeldBill[];
  onResumeBill: (bill: HeldBill) => void;
  onDiscardBill: (billId: string) => void;
  loading?: boolean;
}

export const POSHeldBillsDrawer: React.FC<POSHeldBillsDrawerProps> = ({
  isOpen,
  onClose,
  heldBills,
  onResumeBill,
  onDiscardBill,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#002F34]/40 backdrop-blur-[6px] transition-all">
      <div className="relative w-full max-w-[640px] bg-white rounded-[28px] shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-[#E8F0ED] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002F34] text-white flex items-center justify-center shadow-md shadow-[#002F34]/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#002F34]">Held Bills</h2>
                <span className="text-xs font-mono font-bold text-[#007062] bg-[#E1F6F0] px-2 py-0.5 rounded-full border border-[#BCE8DD]">
                  {heldBills.length} Active
                </span>
              </div>
              <p className="text-xs text-[#5F7D7A]">Resume or discard temporarily held counter sales</p>
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
          {heldBills.length === 0 ? (
            <div className="py-12 text-center text-[#7A9894] flex flex-col items-center gap-2 bg-[#F8FAF9] rounded-2xl border border-[#E8EFEA]">
              <svg className="w-12 h-12 text-[#9FB7B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-bold text-[#002F34]">No Held Bills Found</p>
              <p className="text-xs text-[#5F7D7A]">
                You can hold any active cart by pressing <kbd className="font-mono font-bold bg-[#E7F6F3] text-[#004D40] px-1.5 py-0.5 rounded border border-[#C5E8E0]">F8</kbd>.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EEF3F2] rounded-2xl border border-[#D5E3DE] overflow-hidden bg-white">
              {heldBills.map((bill) => {
                const formattedTime = format(new Date(bill.createdAt), 'hh:mm a, dd MMM');
                const totalItems = bill.lines.reduce((acc, l) => acc + l.quantity, 0);

                return (
                  <div
                    key={bill._id}
                    className="p-4 flex items-center justify-between hover:bg-[#F8FAF9] transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#007062] bg-[#E1F6F0] px-2.5 py-0.5 rounded-full border border-[#BCE8DD]">
                          {bill.billReference}
                        </span>
                        {bill.customerName && (
                          <span className="font-bold text-sm text-[#002F34]">
                            {bill.customerName}
                          </span>
                        )}
                        {bill.customerPhone && (
                          <span className="text-xs text-[#5F7D7A] font-mono">
                            ({bill.customerPhone})
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#7A9894] flex items-center gap-2">
                        <span>Held by {bill.heldByName}</span>
                        <span>•</span>
                        <span>{formattedTime}</span>
                        <span>•</span>
                        <span className="font-semibold text-[#002F34]">
                          {bill.lines.length} medicines · {totalItems} units
                        </span>
                      </div>

                      {bill.notes && (
                        <p className="text-xs italic text-[#5F7D7A] bg-[#F4F7F6] px-2.5 py-1 rounded-lg inline-block mt-1">
                          Note: {bill.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pl-3">
                      <button
                        type="button"
                        onClick={() => onDiscardBill(bill._id)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-xl border border-[#D5E3DE] text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onResumeBill(bill);
                          onClose();
                        }}
                        disabled={loading}
                        className="px-4 py-1.5 rounded-xl bg-[#002F34] text-white text-xs font-bold shadow-sm hover:bg-[#012428] transition-colors cursor-pointer"
                      >
                        Resume Bill
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E8F0ED] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-[#D5E3DE] text-xs font-bold text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F4F7F6]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
