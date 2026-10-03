import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { CheckoutPayload } from '../../services/posApi';

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

  useEffect(() => {
    setCashTendered(grandTotal);
    setMfsTransactionId('');
    setCardLast4('');
    setSplitCash('');
    setSplitMfs('');
    setSplitCard('');
  }, [grandTotal, isOpen]);

  if (!isOpen) return null;

  // Cash change due calculation
  const grandTotalDec = new Decimal(grandTotal || 0);
  const cashTenderedDec = new Decimal(cashTendered || 0);
  const isSufficient = cashTenderedDec.greaterThanOrEqualTo(grandTotalDec);
  const changeDue = isSufficient ? cashTenderedDec.minus(grandTotalDec).toFixed(2) : '0.00';
  const balanceRemaining = !isSufficient ? grandTotalDec.minus(cashTenderedDec).toFixed(2) : '0.00';

  const handleQuickCash = (amount: number | 'exact') => {
    if (amount === 'exact') {
      setCashTendered(grandTotal);
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
      const totalSplit = new Decimal(splitCash || 0)
        .plus(new Decimal(splitMfs || 0))
        .plus(new Decimal(splitCard || 0));

      if (!totalSplit.equals(grandTotalDec)) {
        alert(
          `Split amounts (৳ ${totalSplit.toFixed(2)}) must exactly equal Grand Total (৳ ${grandTotal})`
        );
        return;
      }

      paymentData = {
        method: 'split',
        splitDetails: {
          cashAmount: splitCash ? parseFloat(splitCash).toFixed(2) : undefined,
          mfsAmount: splitMfs ? parseFloat(splitMfs).toFixed(2) : undefined,
          cardAmount: splitCard ? parseFloat(splitCard).toFixed(2) : undefined,
        },
      };
    }

    onConfirmCheckout(paymentData, autoPrint);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#002F34]/40 backdrop-blur-[6px] transition-all">
      <div className="relative w-full max-w-[560px] bg-white rounded-[28px] shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-[#E8F0ED] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002F34] text-white flex items-center justify-center shadow-md shadow-[#002F34]/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#002F34]">Payment & Checkout (F4)</h2>
              <p className="text-xs text-[#5F7D7A]">Finalize billing transaction and tender cash/digital payment</p>
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
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
          {/* Total Payable Highlight Card */}
          <div className="p-4.5 bg-[#F1F6F4] border border-[#D5E3DE] rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#5C7470] uppercase tracking-wider block">
                Total Amount Payable
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg font-bold text-[#007062]">৳</span>
                <span className="text-3xl font-black font-mono text-[#002F34] tracking-tight">
                  {parseFloat(grandTotal).toFixed(2)}
                </span>
              </div>
            </div>
            {(customerName || customerPhone) && (
              <div className="text-right">
                <span className="text-xs font-bold text-[#002F34] block">{customerName || 'Walk-in Customer'}</span>
                <span className="text-xs text-[#5F7D7A] font-mono">{customerPhone}</span>
              </div>
            )}
          </div>

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-bold text-[#002F34] mb-2">Select Payment Method</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'cash', label: 'Cash', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'mfs', label: 'MFS (bKash)', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
                { id: 'card', label: 'Card / POS', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                { id: 'split', label: 'Split Pay', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id as any)}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    method === m.id
                      ? 'bg-[#002F34] text-white border-[#002F34] shadow-sm font-bold'
                      : 'bg-[#F8FAF9] text-[#5F7D7A] border-[#D5E3DE] hover:bg-[#F0FAF7] hover:text-[#002F34]'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={m.icon} />
                  </svg>
                  <span className="text-xs">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method 1: Cash */}
          {method === 'cash' && (
            <div className="space-y-4 p-4.5 bg-[#F8FAF9] rounded-2xl border border-[#E8EFEA]">
              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5">
                  Cash Tendered (৳)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-[#007062] text-base">৳</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    autoFocus
                    className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#D5E3DE] rounded-xl text-lg font-bold font-mono text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
                  />
                </div>
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickCash('exact')}
                  className="px-3 py-1.5 text-xs font-bold bg-white border border-[#97D8D0] text-[#006059] rounded-xl hover:bg-[#E7F6F3] transition-colors cursor-pointer shadow-2xs"
                >
                  Exact (৳{parseFloat(grandTotal).toFixed(0)})
                </button>
                {[50, 100, 200, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#D5E3DE] text-[#002F34] rounded-xl hover:border-[#002F34] transition-colors cursor-pointer shadow-2xs"
                  >
                    ৳{amt}
                  </button>
                ))}
              </div>

              {/* Change Due / Shortage Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  isSufficient
                    ? 'bg-[#E1F6F0] border-[#BCE8DD] text-[#004D40]'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider">
                  {isSufficient ? 'Change Due to Customer:' : 'Shortage (Underpaid):'}
                </span>
                <span className="text-xl font-bold font-mono">
                  ৳ {isSufficient ? changeDue : balanceRemaining}
                </span>
              </div>
            </div>
          )}

          {/* Method 2: MFS */}
          {method === 'mfs' && (
            <div className="space-y-4 p-4.5 bg-[#F8FAF9] rounded-2xl border border-[#E8EFEA]">
              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-2">MFS Provider</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'bkash', label: 'bKash', color: 'hover:border-pink-500' },
                    { id: 'nagad', label: 'Nagad', color: 'hover:border-orange-500' },
                    { id: 'rocket', label: 'Rocket', color: 'hover:border-purple-500' },
                    { id: 'upay', label: 'Upay', color: 'hover:border-blue-500' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMfsProvider(p.id as any)}
                      className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer uppercase ${
                        mfsProvider === p.id
                          ? 'bg-[#002F34] text-white border-[#002F34]'
                          : `bg-white text-[#5F7D7A] border-[#D5E3DE] ${p.color}`
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5">
                  Transaction TrxID / Reference <span className="text-[#7A9894] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9J82KL09"
                  value={mfsTransactionId}
                  onChange={(e) => setMfsTransactionId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#D5E3DE] rounded-xl text-sm font-mono font-bold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
                />
              </div>
            </div>
          )}

          {/* Method 3: Card */}
          {method === 'card' && (
            <div className="space-y-4 p-4.5 bg-[#F8FAF9] rounded-2xl border border-[#E8EFEA]">
              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5">Card Network</label>
                <select
                  value={cardType}
                  onChange={(e) => setCardType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#D5E3DE] rounded-xl text-sm font-semibold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
                >
                  <option value="Visa / Mastercard">Visa / Mastercard</option>
                  <option value="DBBL Nexus">DBBL Nexus</option>
                  <option value="Amex">American Express</option>
                  <option value="UnionPay">UnionPay</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5">
                  Card Last 4 Digits <span className="text-[#7A9894] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4082"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => setCardLast4(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-2.5 bg-white border border-[#D5E3DE] rounded-xl text-sm font-mono font-bold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
                />
              </div>
            </div>
          )}

          {/* Method 4: Split */}
          {method === 'split' && (
            <div className="space-y-3 p-4.5 bg-[#F8FAF9] rounded-2xl border border-[#E8EFEA]">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#002F34] mb-1">Cash (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D5E3DE] rounded-xl text-sm font-mono font-bold text-[#002F34] focus:outline-none focus:border-[#002F34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#002F34] mb-1">MFS (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={splitMfs}
                    onChange={(e) => setSplitMfs(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D5E3DE] rounded-xl text-sm font-mono font-bold text-[#002F34] focus:outline-none focus:border-[#002F34]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#002F34] mb-1">Card (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D5E3DE] rounded-xl text-sm font-mono font-bold text-[#002F34] focus:outline-none focus:border-[#002F34]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E8F0ED] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-[#D5E3DE] text-xs font-bold text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F4F7F6] transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-[#002F34] text-xs font-bold text-[#002F34] hover:bg-[#002F34]/5 transition-colors"
            >
              Complete Sale
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-[#002F34] text-white text-xs font-bold shadow-md shadow-[#002F34]/20 hover:bg-[#012428] transition-all flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Complete & Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
