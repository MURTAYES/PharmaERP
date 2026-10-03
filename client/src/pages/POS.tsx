import React, { useState, useEffect, useRef, useMemo } from 'react';
import Decimal from 'decimal.js';
import { Item, Batch, Invoice, HeldBill } from '../types';
import { useSettings } from '../context/SettingsContext.tsx';
import {
  getBatchesForItem,
  checkout,
  saveHeldBill,
  getHeldBills,
  deleteHeldBill,
  CheckoutPayload,
} from '../services/posApi';
import { POSItemSearch } from '../components/pos/POSItemSearch';
import { POSCartTable } from '../components/pos/POSCartTable';
import { CartLineItem } from '../components/pos/POSCartRow';
import { POSPaymentModal } from '../components/pos/POSPaymentModal';
import { POSHoldBillModal } from '../components/pos/POSHoldBillModal';
import { POSHeldBillsDrawer } from '../components/pos/POSHeldBillsDrawer';
import { ThermalReceiptModal } from '../components/pos/ThermalReceiptModal';
import { Button } from '../components/common/Button';

export const POS: React.FC = () => {
  const { settings } = useSettings();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Cart State
  const [lines, setLines] = useState<CartLineItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0.00');

  // Held Bills State
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showHeldDrawer, setShowHeldDrawer] = useState(false);

  // Checkout & Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Completed Invoice & Receipt State
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Network Status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch initial held bills
  useEffect(() => {
    loadHeldBills();
  }, []);

  const loadHeldBills = async () => {
    try {
      const res = await getHeldBills();
      setHeldBills(res.heldBills);
    } catch {}
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Focus Search
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F4: Open Payment
      else if (e.key === 'F4') {
        e.preventDefault();
        if (lines.length > 0 && !showPaymentModal && !showHoldModal && !showHeldDrawer) {
          setShowPaymentModal(true);
        }
      }
      // F8: Hold Bill
      else if (e.key === 'F8') {
        e.preventDefault();
        if (lines.length > 0 && !showHoldModal) {
          setShowHoldModal(true);
        }
      }
      // F9: Resume / View Held Bills
      else if (e.key === 'F9') {
        e.preventDefault();
        loadHeldBills();
        setShowHeldDrawer(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lines, showPaymentModal, showHoldModal, showHeldDrawer]);

  // Handle Adding Item from Search
  const handleSelectItem = async (item: Item) => {
    setError(null);
    try {
      const res = await getBatchesForItem(item._id);
      const batches = res.batches;

      if (!batches || batches.length === 0) {
        setError(`No sellable stock available for ${item.tradeName}`);
        return;
      }

      // Default to the first (FEFO) batch
      const fefoBatch = batches[0];
      const pcsPerStrip = item.unitHierarchy?.piecesPerStrip || 1;
      const stripsPerBox = item.unitHierarchy?.stripsPerBox || 1;
      const mrpPerPiece = item.mrpPerPiece.toString();

      // Check if already in cart with same batch
      const existingIdx = lines.findIndex(
        (l) => l.itemId === item._id && l.batchId === fefoBatch._id
      );

      if (existingIdx >= 0) {
        const updated = [...lines];
        const currentLine = updated[existingIdx];
        const newQty = currentLine.quantity + 1;
        const lineTotal = new Decimal(currentLine.unitPrice).times(newQty).toFixed(2);
        let qtyPieces = newQty;
        if (currentLine.unit === 'strip') qtyPieces = newQty * pcsPerStrip;
        if (currentLine.unit === 'box') qtyPieces = newQty * pcsPerStrip * stripsPerBox;

        updated[existingIdx] = {
          ...currentLine,
          quantity: newQty,
          quantityPieces: qtyPieces,
          lineTotal,
        };
        setLines(updated);
      } else {
        const newLine: CartLineItem = {
          id: Math.random().toString(36).substring(2, 9),
          itemId: item._id,
          tradeName: item.tradeName,
          genericName: item.genericName,
          unitHierarchy: {
            piecesPerStrip: pcsPerStrip,
            stripsPerBox: stripsPerBox,
          },
          mrpPerPiece,
          batchId: fefoBatch._id,
          batchNumber: fefoBatch.batchNumber,
          expiryDate: fefoBatch.expiryDate,
          availableStockPieces: fefoBatch.qtySellable,
          isFefo: true,
          isNonFefo: false,
          availableBatches: batches,
          unit: 'piece',
          quantity: 1,
          quantityPieces: 1,
          catalogUnitPrice: mrpPerPiece,
          unitPrice: mrpPerPiece,
          isPriceOverridden: false,
          lineTotal: mrpPerPiece,
        };
        setLines((prev) => [newLine, ...prev]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to select medicine');
    }
  };

  // Cart Operations
  const handleUpdateQuantity = (id: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        let qtyPieces = qty;
        if (l.unit === 'strip') qtyPieces = qty * l.unitHierarchy.piecesPerStrip;
        if (l.unit === 'box')
          qtyPieces = qty * l.unitHierarchy.piecesPerStrip * l.unitHierarchy.stripsPerBox;

        const lineTotal = new Decimal(l.unitPrice).times(qty).toFixed(2);
        return {
          ...l,
          quantity: qty,
          quantityPieces: qtyPieces,
          lineTotal,
        };
      })
    );
  };

  const handleUpdateUnit = (id: string, unit: 'piece' | 'strip' | 'box') => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const pcsPerStrip = l.unitHierarchy.piecesPerStrip;
        const stripsPerBox = l.unitHierarchy.stripsPerBox;
        const totalPcsBox = pcsPerStrip * stripsPerBox;
        const mrpDec = new Decimal(l.mrpPerPiece);

        let newCatalogPrice = mrpDec.toFixed(2);
        if (unit === 'strip') newCatalogPrice = mrpDec.times(pcsPerStrip).toFixed(2);
        if (unit === 'box') newCatalogPrice = mrpDec.times(totalPcsBox).toFixed(2);

        let qtyPieces = l.quantity;
        if (unit === 'strip') qtyPieces = l.quantity * pcsPerStrip;
        if (unit === 'box') qtyPieces = l.quantity * totalPcsBox;

        const newUnitPrice = l.isPriceOverridden ? l.unitPrice : newCatalogPrice;
        const lineTotal = new Decimal(newUnitPrice).times(l.quantity).toFixed(2);

        return {
          ...l,
          unit,
          catalogUnitPrice: newCatalogPrice,
          unitPrice: newUnitPrice,
          quantityPieces: qtyPieces,
          lineTotal,
        };
      })
    );
  };

  const handleUpdateBatch = (id: string, batch: Batch & { isFefo?: boolean }) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        return {
          ...l,
          batchId: batch._id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate,
          availableStockPieces: batch.qtySellable,
          isFefo: !!batch.isFefo,
          isNonFefo: !batch.isFefo,
        };
      })
    );
  };

  const handleUpdatePrice = (id: string, newPrice: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const isOverridden = parseFloat(newPrice) !== parseFloat(l.catalogUnitPrice);
        const lineTotal = new Decimal(newPrice).times(l.quantity).toFixed(2);
        return {
          ...l,
          unitPrice: newPrice,
          isPriceOverridden: isOverridden,
          lineTotal,
        };
      })
    );
  };

  const handleRemoveLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleClearCart = () => {
    if (lines.length > 0 && !window.confirm('Clear current billing cart?')) return;
    setLines([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountPercent('0.00');
    setError(null);
  };

  // Calculations
  const calculations = useMemo(() => {
    let subtotalDec = new Decimal(0);
    let totalPcs = 0;

    for (const line of lines) {
      subtotalDec = subtotalDec.plus(new Decimal(line.lineTotal || 0));
      totalPcs += line.quantityPieces;
    }

    const discountDec = new Decimal(discountPercent || 0);
    const discountAmountDec = subtotalDec.times(discountDec.dividedBy(100));
    const netAfterDiscountDec = subtotalDec.minus(discountAmountDec);

    let totalChargesDec = new Decimal(0);
    const chargeBreakdown: Array<{ name: string; amount: string }> = [];

    if (settings?.charges) {
      for (const ch of settings.charges) {
        if (!ch.isActive) continue;
        let amt = new Decimal(0);
        if (ch.type === 'percentage') {
          amt = netAfterDiscountDec.times(new Decimal(ch.rate).dividedBy(100));
        } else {
          amt = new Decimal(ch.rate);
        }
        totalChargesDec = totalChargesDec.plus(amt);
        chargeBreakdown.push({ name: ch.name, amount: amt.toFixed(2) });
      }
    }

    const grandTotalDec = netAfterDiscountDec
      .plus(totalChargesDec)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      subtotal: subtotalDec.toFixed(2),
      discountAmount: discountAmountDec.toFixed(2),
      netAfterDiscount: netAfterDiscountDec.toFixed(2),
      charges: chargeBreakdown,
      totalCharges: totalChargesDec.toFixed(2),
      grandTotal: grandTotalDec.toFixed(2),
      totalPieces: totalPcs,
    };
  }, [lines, discountPercent, settings?.charges]);

  // Hold Bill Handler
  const handleHoldBill = async (data: {
    customerName?: string;
    customerPhone?: string;
    notes?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      await saveHeldBill({
        customerName: data.customerName || customerName,
        customerPhone: data.customerPhone || customerPhone,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          tradeName: l.tradeName,
          genericName: l.genericName,
          batchId: l.batchId,
          batchNumber: l.batchNumber,
          expiryDate: l.expiryDate,
          unit: l.unit,
          unitHierarchy: l.unitHierarchy,
          quantity: l.quantity,
          quantityPieces: l.quantityPieces,
          unitPrice: l.unitPrice,
          mrpPerPiece: l.mrpPerPiece,
          isPriceOverridden: l.isPriceOverridden,
          originalUnitPrice: l.catalogUnitPrice,
          isNonFefo: l.isNonFefo,
        })),
        discountPercent,
        notes: data.notes,
      });

      setLines([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountPercent('0.00');
      setShowHoldModal(false);
      await loadHeldBills();
      setSuccessMsg('Bill held successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to hold bill');
    } finally {
      setLoading(false);
    }
  };

  // Resume Bill Handler
  const handleResumeBill = async (heldBill: HeldBill) => {
    setCustomerName(heldBill.customerName || '');
    setCustomerPhone(heldBill.customerPhone || '');
    setDiscountPercent(heldBill.discountPercent || '0.00');

    const resumedLines: CartLineItem[] = [];
    for (const hl of heldBill.lines) {
      try {
        const batchRes = await getBatchesForItem(hl.itemId);
        resumedLines.push({
          id: Math.random().toString(36).substring(2, 9),
          itemId: hl.itemId,
          tradeName: hl.tradeName,
          genericName: hl.genericName,
          unitHierarchy: hl.unitHierarchy,
          mrpPerPiece: hl.mrpPerPiece,
          batchId: hl.batchId,
          batchNumber: hl.batchNumber,
          expiryDate: hl.expiryDate,
          availableStockPieces: 0,
          isFefo: !hl.isNonFefo,
          isNonFefo: hl.isNonFefo,
          availableBatches: batchRes.batches,
          unit: hl.unit,
          quantity: hl.quantity,
          quantityPieces: hl.quantityPieces,
          catalogUnitPrice: hl.originalUnitPrice || hl.unitPrice,
          unitPrice: hl.unitPrice,
          isPriceOverridden: hl.isPriceOverridden,
          lineTotal: new Decimal(hl.unitPrice).times(hl.quantity).toFixed(2),
        });
      } catch {}
    }

    setLines(resumedLines);
    await deleteHeldBill(heldBill._id);
    await loadHeldBills();
  };

  // Discard Held Bill
  const handleDiscardHeldBill = async (id: string) => {
    if (!window.confirm('Discard this held bill permanently?')) return;
    try {
      await deleteHeldBill(id);
      await loadHeldBills();
    } catch {}
  };

  // Final Checkout & Payment
  const handleConfirmCheckout = async (
    paymentPayload: CheckoutPayload['payment'],
    autoPrint: boolean
  ) => {
    if (!isOnline) {
      setError('Cannot finalize sale while offline. Please check your internet connection.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await checkout({
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        discountPercent,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          batchId: l.batchId,
          unit: l.unit,
          quantity: l.quantity,
          unitPrice: l.isPriceOverridden ? l.unitPrice : undefined,
        })),
        payment: paymentPayload,
      });

      setCompletedInvoice(res.invoice);
      setShowPaymentModal(false);

      // Reset active cart
      setLines([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountPercent('0.00');

      if (autoPrint) {
        setShowReceiptModal(true);
        setTimeout(() => {
          window.print();
        }, 500);
      } else {
        setSuccessMsg(`Sale completed: ${res.invoice.invoiceNumber}`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Offline Warning Banner */}
      {!isOnline && (
        <div className="p-3.5 bg-red-600 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-lg animate-pulse">
          <span className="material-symbols-outlined text-[20px]">wifi_off</span>
          <span>Internet Connection Lost. POS checkout is locked to prevent corrupted inventory snapshots.</span>
        </div>
      )}

      {/* Error & Success Toasts */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 text-xs font-bold rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-red-600">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="cursor-pointer text-red-600 hover:text-red-900">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top POS Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-teal-100 rounded-3xl shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center font-black shadow-pill">
            <span className="material-symbols-outlined text-[24px]">point_of_sale</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900">Point of Sale Counter</h1>
            <p className="text-[11px] font-medium text-slate-500">High-speed keyboard & touch billing terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              loadHeldBills();
              setShowHeldDrawer(true);
            }}
            className="gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">pause_circle</span>
            Held Bills (F9)
            {heldBills.length > 0 && (
              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-black">
                {heldBills.length}
              </span>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHoldModal(true)}
            disabled={lines.length === 0}
            className="gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Hold Cart (F8)
          </Button>
        </div>
      </div>

      {/* Main POS Interface (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Search, Customer Bar & Cart - 8 Cols) */}
        <div className="lg:col-span-8 space-y-4 flex flex-col">
          {/* Medicine Search Bar with F2 Autofocus */}
          <POSItemSearch onSelectItem={handleSelectItem} inputRef={searchInputRef} />

          {/* Customer Quick Info Bar */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-teal-100 rounded-3xl shadow-card">
            <input
              type="text"
              placeholder="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-10 px-4 bg-teal-50/40 border border-teal-100/80 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
            />
            <input
              type="text"
              placeholder="Customer Phone (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="h-10 px-4 bg-teal-50/40 border border-teal-100/80 rounded-2xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all font-mono"
            />
          </div>

          {/* Cart Table */}
          <POSCartTable
            lines={lines}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateUnit={handleUpdateUnit}
            onUpdateBatch={handleUpdateBatch}
            onUpdatePrice={handleUpdatePrice}
            onRemoveLine={handleRemoveLine}
            onClearCart={handleClearCart}
          />
        </div>

        {/* Right Column (Summary & Checkout - 4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 bg-white border border-teal-100 rounded-4xl shadow-card space-y-5 sticky top-22">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Payment Summary
              </h2>
              <span className="text-[11px] font-mono font-bold text-primary bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                {lines.length} Items • {calculations.totalPieces} Pcs
              </span>
            </div>

            {/* Live Amounts Breakdown */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>Subtotal Amount:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ৳ {calculations.subtotal}
                </span>
              </div>

              {/* Discount Input */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-600 font-semibold">Special Discount (%):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-16 h-8 text-right px-2.5 bg-teal-50/50 border border-teal-200 rounded-xl text-xs font-mono font-black text-slate-900 focus:bg-white focus:border-primary focus:outline-none"
                  />
                  <span className="text-slate-500 font-bold">%</span>
                </div>
              </div>

              {parseFloat(calculations.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-800 font-semibold">
                  <span>Discount Amount:</span>
                  <span className="font-mono font-bold">- ৳ {calculations.discountAmount}</span>
                </div>
              )}

              {/* Charges / VAT Breakdown */}
              {calculations.charges.map((ch, i) => (
                <div key={i} className="flex justify-between text-slate-600 font-medium">
                  <span>{ch.name}:</span>
                  <span className="font-mono font-bold text-slate-900">+ ৳ {ch.amount}</span>
                </div>
              ))}
            </div>

            {/* Grand Total Display */}
            <div className="p-5 bg-gradient-to-br from-teal-50 via-teal-50/70 to-emerald-50 border-2 border-teal-200/80 rounded-3xl text-center space-y-1 shadow-inner">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-primary-800 block">
                Grand Total Payable
              </span>
              <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 block tracking-tight">
                ৳ {calculations.grandTotal}
              </span>
            </div>

            {/* Proceed to Checkout Action */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowPaymentModal(true)}
              disabled={lines.length === 0 || !isOnline}
              className="w-full py-4 text-sm font-black shadow-pill hover:shadow-float gap-2 select-none"
            >
              <span className="material-symbols-outlined text-[22px]">payments</span>
              Pay & Checkout (F4)
            </Button>

            {/* Keyboard Shortcuts Helper */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1.5">
              <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
                Keyboard Shortcuts:
              </span>
              <div className="flex justify-between">
                <span>Focus Search:</span>
                <kbd className="font-mono font-bold text-primary bg-white px-2 py-0.5 rounded border border-slate-200">F2</kbd>
              </div>
              <div className="flex justify-between">
                <span>Proceed to Pay:</span>
                <kbd className="font-mono font-bold text-primary bg-white px-2 py-0.5 rounded border border-slate-200">F4</kbd>
              </div>
              <div className="flex justify-between">
                <span>Hold Current Bill:</span>
                <kbd className="font-mono font-bold text-primary bg-white px-2 py-0.5 rounded border border-slate-200">F8</kbd>
              </div>
              <div className="flex justify-between">
                <span>View Held Bills:</span>
                <kbd className="font-mono font-bold text-primary bg-white px-2 py-0.5 rounded border border-slate-200">F9</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <POSPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          grandTotal={calculations.grandTotal}
          customerName={customerName}
          customerPhone={customerPhone}
          onConfirmCheckout={handleConfirmCheckout}
          loading={loading}
        />
      )}

      {/* Hold Bill Modal */}
      {showHoldModal && (
        <POSHoldBillModal
          isOpen={showHoldModal}
          onClose={() => setShowHoldModal(false)}
          onConfirm={handleHoldBill}
          initialCustomerName={customerName}
          initialCustomerPhone={customerPhone}
          loading={loading}
        />
      )}

      {/* Held Bills Drawer */}
      {showHeldDrawer && (
        <POSHeldBillsDrawer
          isOpen={showHeldDrawer}
          onClose={() => setShowHeldDrawer(false)}
          heldBills={heldBills}
          onResumeBill={handleResumeBill}
          onDiscardBill={handleDiscardHeldBill}
          loading={loading}
        />
      )}

      {/* Thermal Receipt Modal */}
      {showReceiptModal && (
        <ThermalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          invoice={completedInvoice}
        />
      )}
    </div>
  );
};
