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
      // F2 or '/' to Focus Search
      if (e.key === 'F2' || (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA')) {
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
    <div className="space-y-4 text-left font-sans">
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
        <div className="p-3.5 bg-[#E7F6F3] border border-[#C5E8E0] text-[#004D40] text-xs font-bold rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#00A887] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="cursor-pointer text-[#004D40] hover:text-[#002F34]">
            ✕
          </button>
        </div>
      )}

      {/* Top POS Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-[#E2EBE8] rounded-[24px] shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#002F34] text-white flex items-center justify-center shadow-md shadow-[#002F34]/20">
            <svg className="w-6 h-6 text-[#97D8D0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-[#002F34] tracking-tight">Point of Sale Counter</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E7F6F3] text-[#007062] border border-[#C5E8E0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00A887] ring-2 ring-[#00A887]/30"></span>
                Fast Counter
              </span>
            </div>
            <p className="text-[11px] text-[#5F7D7A] font-medium mt-0.5">High-speed barcode scanner & keyboard dispensing terminal</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              loadHeldBills();
              setShowHeldDrawer(true);
            }}
            className="px-4 py-2 bg-[#F4F7F6] hover:bg-[#E8F0ED] text-[#002F34] text-xs font-bold rounded-xl border border-[#D5E3DE] flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4 text-[#006059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="px-4 py-2 bg-white hover:bg-[#F4F7F6] text-[#5F7D7A] hover:text-[#002F34] text-xs font-bold rounded-xl border border-[#D5E3DE] flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4 text-[#7A9894]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Hold Cart (F8)</span>
          </button>
        </div>
      </div>

      {/* Main POS Interface (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (Search, Customer Bar & Cart - 8 Cols) */}
        <div className="lg:col-span-8 space-y-4 flex flex-col">
          {/* Medicine Search Bar with F2 Autofocus */}
          <POSItemSearch onSelectItem={handleSelectItem} inputRef={searchInputRef} />

          {/* Customer Quick Info Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-white border border-[#E2EBE8] rounded-[22px] shadow-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A9894]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Customer Name (Optional / Walk-in)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-[#F8FAF9] border border-[#D5E3DE] rounded-xl text-xs font-semibold text-[#002F34] placeholder:text-[#8AA6A1] focus:bg-white focus:border-[#002F34] focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A9894]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Mobile 01XXXXXXXXX (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-[#F8FAF9] border border-[#D5E3DE] rounded-xl text-xs font-semibold font-mono text-[#002F34] placeholder:text-[#8AA6A1] focus:bg-white focus:border-[#002F34] focus:outline-none transition-all shadow-2xs"
              />
            </div>
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
          <div className="p-6 bg-white border border-[#E2EBE8] rounded-[28px] shadow-sm space-y-5 sticky top-20">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EEF3F2] pb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00A887]"></span>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#002F34]">
                  Payment Summary
                </h2>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#007062] bg-[#E1F6F0] border border-[#BCE8DD] px-2.5 py-0.5 rounded-full">
                {lines.length} Items · {calculations.totalPieces} Pcs
              </span>
            </div>

            {/* Financial Calculations Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-[#5F7D7A] font-medium">
                <span>Subtotal Amount:</span>
                <span className="font-mono font-bold text-[#002F34] text-sm">
                  ৳ {calculations.subtotal}
                </span>
              </div>

              {/* Discount Input & Quick Pills */}
              <div className="pt-2.5 border-t border-[#EEF3F2] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#002F34] font-bold">Special Discount (%):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="w-16 h-8 text-right px-2 bg-[#F8FAF9] border border-[#D5E3DE] rounded-lg text-xs font-mono font-bold text-[#002F34] focus:bg-white focus:border-[#002F34] focus:outline-none"
                    />
                    <span className="text-[#5F7D7A] font-bold">%</span>
                  </div>
                </div>

                {/* Quick Discount Presets */}
                <div className="flex items-center gap-1.5 justify-end">
                  {['0', '5', '7.5', '10'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiscountPercent(d)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                        discountPercent === d
                          ? 'bg-[#002F34] text-white border-[#002F34]'
                          : 'bg-[#F8FAF9] text-[#5F7D7A] border-[#D5E3DE] hover:bg-[#E7F6F3]'
                      }`}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              </div>

              {parseFloat(calculations.discountAmount) > 0 && (
                <div className="flex justify-between text-[#007062] font-semibold">
                  <span>Discount Saved:</span>
                  <span className="font-mono font-bold">- ৳ {calculations.discountAmount}</span>
                </div>
              )}

              {/* Charges / VAT Breakdown */}
              {calculations.charges.map((ch, i) => (
                <div key={i} className="flex justify-between text-[#5F7D7A] font-medium">
                  <span>{ch.name}:</span>
                  <span className="font-mono font-bold text-[#002F34]">+ ৳ {ch.amount}</span>
                </div>
              ))}
            </div>

            {/* Grand Total Display Card */}
            <div className="p-5 bg-[#F0FAF7] border border-[#CEE8E2] rounded-[22px] text-center space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#006059] block">
                Total Payable Amount
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-xl font-bold text-[#007062]">৳</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-[#002F34] tracking-tight">
                  {calculations.grandTotal}
                </span>
              </div>
            </div>

            {/* Proceed to Checkout Action */}
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              disabled={lines.length === 0 || !isOnline}
              className="w-full py-3.5 rounded-2xl bg-[#002F34] text-white text-sm font-bold shadow-lg shadow-[#002F34]/25 hover:bg-[#012428] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none"
            >
              <svg className="w-5 h-5 text-[#97D8D0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Pay & Checkout (F4)</span>
            </button>

            {/* Keyboard Shortcuts Helper Card */}
            <div className="p-3.5 bg-[#F8FAF9] rounded-2xl border border-[#E8EFEA] text-[11px] text-[#5F7D7A] space-y-2">
              <span className="font-bold text-[#002F34] block uppercase tracking-wider text-[10px]">
                Keyboard Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-[#E2EBE8]">
                  <span>Search:</span>
                  <kbd className="font-mono font-bold text-[#004D40] bg-[#E7F6F3] px-1.5 py-0.2 rounded border border-[#C5E8E0]">F2</kbd>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-[#E2EBE8]">
                  <span>Pay:</span>
                  <kbd className="font-mono font-bold text-[#004D40] bg-[#E7F6F3] px-1.5 py-0.2 rounded border border-[#C5E8E0]">F4</kbd>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-[#E2EBE8]">
                  <span>Hold:</span>
                  <kbd className="font-mono font-bold text-[#004D40] bg-[#E7F6F3] px-1.5 py-0.2 rounded border border-[#C5E8E0]">F8</kbd>
                </div>
                <div className="flex items-center justify-between bg-white px-2 py-1 rounded-lg border border-[#E2EBE8]">
                  <span>Resume:</span>
                  <kbd className="font-mono font-bold text-[#004D40] bg-[#E7F6F3] px-1.5 py-0.2 rounded border border-[#C5E8E0]">F9</kbd>
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
