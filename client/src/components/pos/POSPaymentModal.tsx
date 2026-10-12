import React, { useState, useEffect } from 'react';
import { CheckoutPayload } from '../../services/posApi';
import { safeDecimal, formatMoney } from '../../utils/money';

interface POSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: string;
  customerName: string;
  customerPhone: string;
  onConfirmCheckout: (paymentPayload: CheckoutPayload['payment'], autoPrint: boolean) => void;
  loading?: boolean;
}

export const POSPaymentModal: React.FC<POSPaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  customerName,
  customerPhone,
  onConfirmCheckout,
  loading = false,
}) => {
  const [method, setMethod] = useState<'cash' | 'card' | 'mfs' | 'split'>('cash');

  // Cash State
  const [cashTendered, setCashTendered] = useState(grandTotal);

  // MFS State
  const [mfsProvider, setMfsProvider] = useState<'bkash' | 'nagad' | 'rocket' | 'upay'>('bkash');
  const [mfsTransactionId, setMfsTransactionId] = useState('');

  // Card State
  const [cardLast4, setCardLast4] = useState('');
  const [cardType, setCardType] = useState('Visa / Mastercard');

  // Split State
  const [splitCash, setSplitCash] = useState('');
  const [splitMfs, setSplitMfs] = useState('');
  const [splitCard, setSplitCard] = useState('');

  const safeGrandTotalStr = formatMoney(grandTotal);

  useEffect(() => {
    setCashTendered(safeGrandTotalStr);
    setMfsTransactionId('');
    setCardLast4('');
    setSplitCash('');
    setSplitMfs('');
    setSplitCard('');
  }, [safeGrandTotalStr, isOpen]);

  // Calculations
  const grandTotalDec = safeDecimal(grandTotal);
  const cashTenderedDec = safeDecimal(cashTendered);
  const isSufficient = cashTenderedDec.greaterThanOrEqualTo(grandTotalDec);
  const changeDue = isSufficient ? cashTenderedDec.minus(grandTotalDec).toFixed(2) : '0.00';
  const balanceRemaining = !isSufficient ? grandTotalDec.minus(cashTenderedDec).toFixed(2) : '0.00';

  const handleQuickCash = (amount: number | 'exact') => {
    if (amount === 'exact') {
      setCashTendered(safeGrandTotalStr);
    } else {
      setCashTendered(amount.toFixed(2));
    }
  };

  const handleSubmit = (autoPrint: boolean) => {
    let paymentData: CheckoutPayload['payment'];

    if (method === 'cash') {
      if (!isSufficient) {
        alert('Tendered cash amount cannot be less than Grand Total');
        return;
      }
      paymentData = {
        method: 'cash',
        cashTendered: cashTenderedDec.toFixed(2),
        changeDue,
      };
    } else if (method === 'card') {
      paymentData = {
        method: 'card',
        cardLast4: cardLast4.trim() || undefined,
        cardType,
      };
    } else if (method === 'mfs') {
      paymentData = {
        method: 'mfs',
        mfsProvider,
        mfsTransactionId: mfsTransactionId.trim() || undefined,
      };
    } else {
      // Split payment
      const totalSplit = safeDecimal(splitCash)
        .plus(safeDecimal(splitMfs))
        .plus(safeDecimal(splitCard));

      if (!totalSplit.equals(grandTotalDec)) {
        alert(
          `Split amounts (৳ ${totalSplit.toFixed(2)}) must exactly equal Grand Total (৳ ${safeGrandTotalStr})`
        );
        return;
      }

      paymentData = {
        method: 'split',
        splitDetails: {
          cashAmount: splitCash ? safeDecimal(splitCash).toFixed(2) : undefined,
          mfsAmount: splitMfs ? safeDecimal(splitMfs).toFixed(2) : undefined,
          cardAmount: splitCard ? safeDecimal(splitCard).toFixed(2) : undefined,
        },
      };
    }

    onConfirmCheckout(paymentData, autoPrint);
  };

  // Keyboard navigation for fast POS checkout
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (loading) return;
        if (e.ctrlKey || e.metaKey) {
          handleSubmit(false);
        } else {
          handleSubmit(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, method, cashTendered, isSufficient, splitCash, splitMfs, splitCard, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002F34]/40 backdrop-blur-xs transition-all animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Clean Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-base font-bold text-[#002F34]">Payment & Checkout</h2>
            <p className="text-xs text-slate-400">Select method and tender payment</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Hero Payable Card */}
        <div className="mx-6 mt-5 p-4 bg-[#E7F6F3]/50 rounded-2xl flex items-center justify-between border border-[#C5E8E0]/40">
          <div>
            <span className="text-[10px] font-bold text-[#006059] uppercase tracking-wider block">
              Total Payable
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold font-mono text-[#002F34]">
                ৳ {safeGrandTotalStr}
              </span>
            </div>
          </div>
          {(customerName || customerPhone) && (
            <div className="text-right">
              <span className="text-xs font-bold text-[#002F34] block">{customerName || 'Walk-in'}</span>
              {customerPhone && <span className="text-[11px] text-slate-400 font-mono">{customerPhone}</span>}
            </div>
          )}
        </div>

        {/* Method Segmented Pills */}
        <div className="px-6 mt-4">
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
            {[
              { id: 'cash', label: 'Cash' },
              { id: 'mfs', label: 'MFS' },
              { id: 'card', label: 'Card' },
              { id: 'split', label: 'Split' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id as any)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  method === m.id
                    ? 'bg-[#002F34] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* Method: Cash */}
          {method === 'cash' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cash Tendered (৳)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-slate-400 text-sm">৳</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    autoFocus
                    className="w-full pl-7 pr-3 py-2 bg-[#F8FAF9] focus:bg-white border border-slate-200 focus:border-[#002F34] rounded-xl text-base font-bold font-mono text-[#002F34] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Quick Cash Chips */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCash('exact')}
                  className="px-2.5 py-1 text-xs font-bold bg-[#E7F6F3] text-[#006059] hover:bg-[#D5EFEA] rounded-lg transition-colors cursor-pointer"
                >
                  Exact
                </button>
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>

              {/* Change Due / Shortage Banner */}
              <div
                className={`p-3 rounded-xl flex items-center justify-between ${
                  isSufficient
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80'
                    : 'bg-rose-50 text-rose-800 border border-rose-200/80'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isSufficient ? 'Change Due' : 'Shortage'}
                </span>
                <span className="text-lg font-bold font-mono">
                  ৳ {isSufficient ? changeDue : balanceRemaining}
                </span>
              </div>
            </div>
          )}

          {/* Method: MFS */}
          {method === 'mfs' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">MFS Provider</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'bkash', label: 'bKash' },
                    { id: 'nagad', label: 'Nagad' },
                    { id: 'rocket', label: 'Rocket' },
                    { id: 'upay', label: 'Upay' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMfsProvider(p.id as any)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        mfsProvider === p.id
                          ? 'bg-[#002F34] text-white border-[#002F34]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  TrxID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9J82KL09"
                  value={mfsTransactionId}
                  onChange={(e) => setMfsTransactionId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF9] focus:bg-white border border-slate-200 focus:border-[#002F34] rounded-xl text-xs font-mono font-bold text-[#002F34] focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Method: Card */}
          {method === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Card Network</label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAF9] focus:bg-white border border-slate-200 focus:border-[#002F34] rounded-xl text-xs font-semibold text-[#002F34] focus:outline-none transition-all"
                >
                  <option value="Visa / Mastercard">Visa / Mastercard</option>
                  <option value="DBBL Nexus">DBBL Nexus</option>
                  <option value="Amex">American Express</option>
                  <option value="UnionPay">UnionPay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Last 4 Digits <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4082"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-3 py-2 bg-[#F8FAF9] focus:bg-white border border-slate-200 focus:border-[#002F34] rounded-xl text-xs font-mono font-bold text-[#002F34] focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Method: Split */}
          {method === 'split' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Cash (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAF9] focus:bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#002F34] focus:outline-none focus:border-[#002F34]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">MFS (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={splitMfs}
                    onChange={(e) => setSplitMfs(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAF9] focus:bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#002F34] focus:outline-none focus:border-[#002F34]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Card (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#F8FAF9] focus:bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#002F34] focus:outline-none focus:border-[#002F34]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clean Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel (Esc)
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-[#002F34] bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Complete Sale
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-white bg-[#002F34] hover:bg-[#073D43] rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Complete & Print</span>
              <kbd className="text-[10px] bg-white/20 px-1 rounded font-mono">↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
