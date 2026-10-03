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

export const POS: React.FC = () => {
  const { settings } = useSettings();
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);
  const genericSearchInputRef = useRef<HTMLInputElement | null>(null);

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
      // F2 or '/' to Focus Product Name Search
      if (
        e.key === 'F2' ||
        (e.key === '/' &&
          (e.target as HTMLElement).tagName !== 'INPUT' &&
          (e.target as HTMLElement).tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        productSearchInputRef.current?.focus();
      }
      // F3 to Focus Generic Formulation Search
      else if (e.key === 'F3') {
        e.preventDefault();
        genericSearchInputRef.current?.focus();
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
        setError(`No sellable stock available in inventory for "${item.tradeName}"`);
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
      setError(err.response?.data?.error || err.message || 'Failed to add medicine');
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
        setSuccessMsg(`Sale completed: Invoice #${res.invoice.invoiceNumber}`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7 max-w-[1440px] w-full mx-auto text-left">
      {/* Offline Warning Banner */}
      {!isOnline && (
        <div className="p-4 bg-rose-600 text-white font-bold text-xs rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-2.828m0 0l2.828-2.828M3 3l18 18" />
            </svg>
            <span>Internet Connection Lost. POS checkout is locked to prevent concurrency discrepancies.</span>
          </div>
          <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded">Offline Mode</span>
        </div>
      )}

      {/* Error & Success Toasts */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="cursor-pointer text-rose-600 hover:text-rose-900">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="cursor-pointer text-emerald-900 hover:text-black">
            ✕
          </button>
        </div>
      )}

      {/* Overview Title and Action Buttons Row (Matching Dashboard / Inventory) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#002F34]">Point of Sale</h1>
          <p className="text-xs text-slate-500 mt-0.5">High-speed counter billing & barcode dispensing terminal</p>
        </div>

        {/* Action Buttons in Dashboard Style */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#00A887]"></span>
            <span>Counter Active</span>
          </div>

          <button
            type="button"
            onClick={() => {
              loadHeldBills();
              setShowHeldDrawer(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#002F34] bg-[#F3F7F6] hover:bg-slate-200/70 rounded-full transition-all cursor-pointer shadow-sm"
          >
            <svg className="w-3.5 h-3.5 text-[#006059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Held Bills (F9)</span>
            {heldBills.length > 0 && (
              <span className="bg-[#002F34] text-white text-[10px] px-2 py-0.2 rounded-full font-mono font-bold">
                {heldBills.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowHoldModal(true)}
            disabled={lines.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#002F34] hover:bg-[#073D43] rounded-full shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Hold Cart (F8)</span>
          </button>
        </div>
      </div>

      {/* Main POS Layout (2 Columns matching Dashboard / Inventory Card System) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dispensing & Cart Card (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-[#002F34]">Dispensing Counter</h2>
              <p className="text-[11px] text-slate-400">Scan barcode or search medicine to add items</p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400 font-mono">
              Terminal: POS-01
            </span>
          </div>

          {/* Dual Medicine Search Bars */}
          <POSItemSearch
            onSelectItem={handleSelectItem}
            productInputRef={productSearchInputRef}
            genericInputRef={genericSearchInputRef}
          />

          {/* Customer Quick Inputs in Dashboard Pill Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Customer Name (Optional / Walk-in)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-[#F3F7F6] border-none text-xs rounded-full py-2.5 px-4 focus:ring-1 focus:ring-[#002F34] focus:bg-white text-[#002F34] placeholder-slate-400 font-medium transition-all"
            />
            <input
              type="text"
              placeholder="Mobile 01XXXXXXXXX (Optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-[#F3F7F6] border-none text-xs rounded-full py-2.5 px-4 focus:ring-1 focus:ring-[#002F34] focus:bg-white text-[#002F34] placeholder-slate-400 font-mono font-medium transition-all"
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

        {/* Right Column: Payment & Financial Summary Card (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-card border border-slate-100 flex flex-col justify-between space-y-5 sticky top-22 self-start">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-[#002F34]">Payment Summary</h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#97D8D0]/30 text-[#002F34] border border-[#97D8D0]/50">
                {lines.length} Items • {calculations.totalPieces} Pcs
              </span>
            </div>

            {/* Financial Calculations */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Subtotal Amount</span>
                <span className="font-mono font-bold text-[#002F34] text-sm">
                  ৳ {calculations.subtotal}
                </span>
              </div>

              {/* Discount Section */}
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Special Discount</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-14 h-7 text-right px-2 bg-[#F3F7F6] border-none rounded-lg text-xs font-mono font-bold text-[#002F34] focus:ring-1 focus:ring-[#002F34]"
                    />
                    <span className="text-slate-400 font-bold">%</span>
                  </div>
                </div>

                {/* Quick Discount Pills */}
                <div className="flex items-center gap-1.5 justify-end">
                  {['0', '5', '7.5', '10'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscountPercent(d)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-all cursor-pointer ${
                        discountPercent === d
                          ? 'bg-[#002F34] text-white'
                          : 'bg-[#F3F7F6] text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>

              {parseFloat(calculations.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount Saved</span>
                  <span className="font-mono font-bold">- ৳ {calculations.discountAmount}</span>
                </div>
              )}

              {/* Charges / VAT */}
              {calculations.charges.map((ch, i) => (
                <div key={i} className="flex justify-between text-slate-500 font-medium">
                  <span>{ch.name}</span>
                  <span className="font-mono font-bold text-[#002F34]">+ ৳ {ch.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {/* Grand Total Accent Card matching Dashboard's Soft Mint hero pills */}
            <div className="bg-[#97D8D0]/25 border border-[#97D8D0]/50 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#006059] block">
                Total Payable Amount
              </span>
              <span className="text-3xl font-extrabold text-[#002F34] tracking-tight font-mono block">
                ৳ {calculations.grandTotal}
              </span>
            </div>

            {/* Proceed to Pay CTA */}
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              disabled={lines.length === 0 || !isOnline}
              className="w-full py-3.5 rounded-full bg-[#002F34] text-white text-xs font-bold shadow-md hover:bg-[#073D43] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
            >
              <svg className="w-4 h-4 text-[#97D8D0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Pay & Checkout (F4)</span>
            </button>

            {/* Keyboard Shortcuts Helper Card */}
            <div className="p-3.5 bg-[#F8FAF9] rounded-2xl border border-slate-100 text-[10px] text-slate-500 space-y-2">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[9px]">
                Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-slate-100">
                  <span>Brand:</span>
                  <kbd className="font-mono font-bold text-[#002F34]">F2</kbd>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-slate-100">
                  <span>Generic:</span>
                  <kbd className="font-mono font-bold text-[#002F34]">F3</kbd>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-slate-100">
                  <span>Pay:</span>
                  <kbd className="font-mono font-bold text-[#002F34]">F4</kbd>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-slate-100">
                  <span>Hold:</span>
                  <kbd className="font-mono font-bold text-[#002F34]">F8</kbd>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-md border border-slate-100 col-span-2">
                  <span>Resume Bills:</span>
                  <kbd className="font-mono font-bold text-[#002F34]">F9</kbd>
                </div>
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
