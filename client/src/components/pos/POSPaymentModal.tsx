import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Payment & Checkout (F4)" maxWidth="md">
      <div className="space-y-4 text-left">
        {/* Grand Total Highlight Banner */}
        <div className="p-4 bg-primary-container/20 border border-primary/20 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-primary block uppercase tracking-wider">
              Amount Payable
            </span>
            <span className="text-2xl font-black font-mono text-primary">
              ৳ {parseFloat(grandTotal).toFixed(2)}
            </span>
          </div>
          {(customerName || customerPhone) && (
            <div className="text-right text-xs">
              <span className="font-bold text-on-surface block">{customerName || 'Customer'}</span>
              <span className="text-on-surface-variant font-mono">{customerPhone}</span>
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { id: 'cash', label: 'Cash', icon: 'payments' },
              { id: 'mfs', label: 'MFS (bKash)', icon: 'smartphone' },
              { id: 'card', label: 'Card', icon: 'credit_card' },
              { id: 'split', label: 'Split', icon: 'call_split' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                method === m.id
                  ? 'bg-primary text-on-primary border-primary shadow-sm font-bold'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
              <span className="text-xs">{m.label}</span>
            </button>
          ))}
        </div>

        {/* Method 1: Cash Tab */}
        {method === 'cash' && (
          <div className="space-y-3 p-4 bg-surface-container-low rounded-2xl border border-surface-container">
            <Input
              label="Cash Tendered (৳)"
              type="number"
              step="0.5"
              min="0"
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value)}
              autoFocus
              required
            />

            {/* Quick Cash Presets */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickCash('exact')}
                className="px-2.5 py-1 text-xs font-bold bg-surface-container-lowest border border-outline-variant/40 rounded-lg hover:border-primary text-primary transition-colors cursor-pointer"
              >
                Exact (৳ {parseFloat(grandTotal).toFixed(0)})
              </button>
              {[50, 100, 200, 500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickCash(amt)}
                  className="px-2.5 py-1 text-xs font-semibold bg-surface-container-lowest border border-outline-variant/40 rounded-lg hover:border-primary text-on-surface transition-colors cursor-pointer"
                >
                  ৳ {amt}
                </button>
              ))}
            </div>

            {/* Change Due Display */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isSufficient
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-error-container/30 border-error/30 text-error'
              }`}
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                {isSufficient ? 'Change Due to Customer:' : 'Underpaid Shortage:'}
              </span>
              <span className="text-lg font-black font-mono">
                ৳ {isSufficient ? changeDue : balanceRemaining}
              </span>
            </div>
          </div>
        )}

        {/* Method 2: MFS (bKash/Nagad/Rocket) Tab */}
        {method === 'mfs' && (
          <div className="space-y-3 p-4 bg-surface-container-low rounded-2xl border border-surface-container">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                MFS Provider
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['bkash', 'nagad', 'rocket', 'upay'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setMfsProvider(p)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all uppercase cursor-pointer ${
                      mfsProvider === p
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Transaction Reference / TrxID (Optional)"
              placeholder="e.g. 9J82KL09"
              value={mfsTransactionId}
              onChange={(e) => setMfsTransactionId(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Method 3: Card Tab */}
        {method === 'card' && (
          <div className="space-y-3 p-4 bg-surface-container-low rounded-2xl border border-surface-container">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Card Network
              </label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full h-11 px-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl text-on-surface text-sm focus:border-primary focus:outline-none"
              >
                <option value="Visa / Mastercard">Visa / Mastercard</option>
                <option value="DBBL Nexus">DBBL Nexus</option>
                <option value="Amex">American Express</option>
                <option value="UnionPay">UnionPay</option>
              </select>
            </div>

            <Input
              label="Card Last 4 Digits (Optional)"
              placeholder="e.g. 4082"
              maxLength={4}
              value={cardLast4}
              onChange={(e) => setCardLast4(e.target.value.replace(/[^0-9]/g, ''))}
              autoFocus
            />
          </div>
        )}

        {/* Method 4: Split Payment Tab */}
        {method === 'split' && (
          <div className="space-y-3 p-4 bg-surface-container-low rounded-2xl border border-surface-container">
            <Input
              label="Cash Amount (৳)"
              type="number"
              min="0"
              placeholder="0.00"
              value={splitCash}
              onChange={(e) => setSplitCash(e.target.value)}
            />
            <Input
              label="MFS (bKash / Nagad) Amount (৳)"
              type="number"
              min="0"
              placeholder="0.00"
              value={splitMfs}
              onChange={(e) => setSplitMfs(e.target.value)}
            />
            <Input
              label="Card Amount (৳)"
              type="number"
              min="0"
              placeholder="0.00"
              value={splitCard}
              onChange={(e) => setSplitCard(e.target.value)}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit(false)}
            isLoading={loading}
          >
            Complete Sale
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => handleSubmit(true)}
            isLoading={loading}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Complete & Print
          </Button>
        </div>
      </div>
    </Modal>
  );
};
