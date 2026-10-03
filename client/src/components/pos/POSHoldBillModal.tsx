import React, { useState } from 'react';

interface POSHoldBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { customerName?: string; customerPhone?: string; notes?: string }) => void;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  loading?: boolean;
}

export const POSHoldBillModal: React.FC<POSHoldBillModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialCustomerName = '',
  initialCustomerPhone = '',
  loading = false,
}) => {
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ customerName, customerPhone, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#002F34]/40 backdrop-blur-[6px] transition-all">
      <div className="relative w-full max-w-[460px] bg-white rounded-[28px] shadow-2xl border border-white/80 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-[#E8F0ED] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002F34] text-white flex items-center justify-center shadow-md shadow-[#002F34]/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#002F34]">Hold Current Bill (F8)</h2>
              <p className="text-xs text-[#5F7D7A]">Park active items to serve another counter customer</p>
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
          <div className="p-3.5 bg-[#F0FAF7] border border-[#CEE8E2] rounded-xl text-xs text-[#1F544D]">
            This bill will be safely stored and can be resumed anytime from the <strong>Held Bills (F9)</strong> drawer.
          </div>

          <div>
            <label className="block text-xs font-bold text-[#002F34] mb-1.5">
              Customer Name <span className="text-[#7A9894] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Karim Ahmed"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoFocus
              className="w-full px-4 py-2.5 bg-white border border-[#D5E3DE] rounded-xl text-sm font-semibold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#002F34] mb-1.5">
              Customer Mobile <span className="text-[#7A9894] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 01711223344"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#D5E3DE] rounded-xl text-sm font-mono font-bold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#002F34] mb-1.5">
              Hold Reason / Note <span className="text-[#7A9894] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer stepped away to ATM / prescription check"
              className="w-full p-3 bg-white border border-[#D5E3DE] rounded-xl text-xs font-medium text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E8F0ED]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-[#D5E3DE] text-xs font-bold text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F4F7F6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-[#002F34] text-white text-xs font-bold shadow-md shadow-[#002F34]/20 hover:bg-[#012428]"
            >
              Hold Bill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
