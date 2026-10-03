import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { returnApi, SalesReturnPayload } from '../../services/returnApi';
import { Invoice } from '../../types';

interface SalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (creditNote: any) => void;
  initialInvoice?: Invoice | null;
}

const REASON_CATEGORIES = [
  'Wrong Medicine Dispensed',
  'Customer Adverse Reaction',
  'Doctor Changed Prescription',
  'Damaged / Defective Packaging',
  'Customer Over-purchased',
  'Near Expiry Returned by Customer',
  'Other / Counter Discretion',
];

interface ReturnLineDraft {
  itemId: string;
  tradeName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  unit: 'piece' | 'strip' | 'box';
  unitHierarchySnapshot: {
    piecesPerStrip: number;
    stripsPerBox: number;
  };
  quantity: number;
  quantityPieces: number;
  maxReturnablePieces: number;
  unitPricePerPiece: string;
  destinationBucket: 'sellable' | 'damaged' | 'expired';
}

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [lineStatuses, setLineStatuses] = useState<any[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Return drafts selected by the user
  const [returnDrafts, setReturnDrafts] = useState<Record<string, ReturnLineDraft>>({});

  const [refundMethod, setRefundMethod] = useState<'cash' | 'original_payment'>('cash');
  const [reasonCategory, setReasonCategory] = useState(REASON_CATEGORIES[0]);
  const [reasonDetail, setReasonDetail] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialInvoice) {
      loadInvoiceSummary(initialInvoice._id);
    } else {
      setSelectedInvoice(null);
      setLineStatuses([]);
      setReturnDrafts({});
      setSearchQuery('');
      setSearchResults([]);
    }
    setError(null);
    setReasonCategory(REASON_CATEGORIES[0]);
    setReasonDetail('');
    setRefundMethod('cash');
  }, [initialInvoice, isOpen]);

  // Handle live search for past invoices
  useEffect(() => {
    if (!searchQuery.trim() || selectedInvoice) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await returnApi.searchInvoices(searchQuery);
        setSearchResults(res.invoices || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedInvoice]);

  const loadInvoiceSummary = async (invId: string) => {
    setLoadingSummary(true);
    setError(null);
    try {
      const summary = await returnApi.getInvoiceReturnSummary(invId);
      setSelectedInvoice(summary.invoice);
      setLineStatuses(summary.lineStatuses || []);
      setReturnDrafts({});
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load invoice');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleToggleItemForReturn = (line: any) => {
    const key = `${line.itemId}_${line.batchId}`;
    if (returnDrafts[key]) {
      // Remove from drafts
      const next = { ...returnDrafts };
      delete next[key];
      setReturnDrafts(next);
    } else {
      // Add to drafts with default 1 piece or 1 strip/box
      const draft: ReturnLineDraft = {
        itemId: line.itemId,
        tradeName: line.tradeName,
        genericName: line.genericName,
        batchId: line.batchId,
        batchNumber: line.batchNumber,
        unit: line.unit,
        unitHierarchySnapshot: line.unitHierarchySnapshot,
        quantity: 1,
        quantityPieces: 1,
        maxReturnablePieces: line.remainingReturnablePieces,
        unitPricePerPiece: line.unitPricePerPiece,
        destinationBucket: 'sellable',
      };
      setReturnDrafts({ ...returnDrafts, [key]: draft });
    }
  };

  const handleUpdateDraft = (
    key: string,
    updates: Partial<ReturnLineDraft>
  ) => {
    const existing = returnDrafts[key];
    if (!existing) return;

    const merged = { ...existing, ...updates };

    const pcsPerStrip = merged.unitHierarchySnapshot.piecesPerStrip || 1;
    const stripsPerBox = merged.unitHierarchySnapshot.stripsPerBox || 1;
    const totalPcsBox = pcsPerStrip * stripsPerBox;

    let calcPieces = merged.quantity;
    if (merged.unit === 'strip') calcPieces = merged.quantity * pcsPerStrip;
    if (merged.unit === 'box') calcPieces = merged.quantity * totalPcsBox;

    merged.quantityPieces = calcPieces;
    setReturnDrafts({ ...returnDrafts, [key]: merged });
  };

  // Compute live estimated refund totals
  const draftsArray = Object.values(returnDrafts);
  let liveSubtotalRefundDec = new Decimal(0);

  for (const draft of draftsArray) {
    const lineVal = new Decimal(draft.unitPricePerPiece || 0).times(draft.quantityPieces);
    liveSubtotalRefundDec = liveSubtotalRefundDec.plus(lineVal);
  }

  let liveDiscountRefundDec = new Decimal(0);
  if (selectedInvoice && liveSubtotalRefundDec.greaterThan(0)) {
    const origSubtotal = new Decimal(selectedInvoice.subtotal || 0);
    const origDiscount = new Decimal(selectedInvoice.discountAmount || 0);
    if (origSubtotal.greaterThan(0) && origDiscount.greaterThan(0)) {
      const ratio = liveSubtotalRefundDec.dividedBy(origSubtotal);
      liveDiscountRefundDec = origDiscount.times(ratio);
    }
  }

  const liveNetRefundDec = liveSubtotalRefundDec.minus(liveDiscountRefundDec);

  let liveChargesRefundDec = new Decimal(0);
  if (selectedInvoice && selectedInvoice.charges) {
    for (const charge of selectedInvoice.charges) {
      if (charge.type === 'percentage') {
        const rateDec = new Decimal(charge.rate || 0);
        const chargeRefund = liveNetRefundDec.times(rateDec.dividedBy(100));
        liveChargesRefundDec = liveChargesRefundDec.plus(chargeRefund);
      }
    }
  }

  const liveGrandTotalRefund = liveNetRefundDec.plus(liveChargesRefundDec).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (draftsArray.length === 0) {
      setError('Please select at least one medicine item to return');
      return;
    }

    // Check for over-return in drafts
    for (const draft of draftsArray) {
      if (draft.quantityPieces <= 0) {
        setError(`Please specify a valid return quantity for ${draft.tradeName}`);
        return;
      }
      if (draft.quantityPieces > draft.maxReturnablePieces) {
        setError(
          `Cannot return ${draft.quantityPieces} pcs of ${draft.tradeName}. Only ${draft.maxReturnablePieces} pcs available for return.`
        );
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: SalesReturnPayload = {
        invoiceId: selectedInvoice._id,
        lines: draftsArray.map((d) => ({
          itemId: d.itemId,
          batchId: d.batchId,
          unit: d.unit,
          quantity: d.quantity,
          destinationBucket: d.destinationBucket,
        })),
        refundMethod,
        reasonCategory,
        reasonDetail,
      };

      const res = await returnApi.processSalesReturn(payload);
      onSuccess(res.creditNote);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to process sales return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Customer Sales Return"
      subtitle="Lookup invoice, select returned units, route stock buckets, and issue credit note"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3.5 bg-red-50 text-error border border-red-200 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Search Bar */}
        {!selectedInvoice && (
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-3 text-on-surface-variant/60 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by Invoice Number (e.g. INV-202610-00001), Customer Phone, or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-surface-container-lowest border border-outline-variant/50 rounded-2xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              autoFocus
            />

            {searching && (
              <span className="absolute right-4 top-3 text-xs text-primary animate-pulse font-semibold">
                Searching invoices...
              </span>
            )}

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-14 z-30 w-full bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-surface-container">
                {searchResults.map((inv) => (
                  <button
                    key={inv._id}
                    type="button"
                    onClick={() => loadInvoiceSummary(inv._id)}
                    className="w-full text-left p-3.5 hover:bg-surface-container-low flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary text-xs">{inv.invoiceNumber}</span>
                        <span className="text-xs text-on-surface font-semibold">
                          {inv.customerName || 'Counter Customer'}
                        </span>
                        {inv.customerPhone && (
                          <span className="text-[11px] text-on-surface-variant font-mono">
                            ({inv.customerPhone})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-on-surface-variant mt-0.5">
                        {inv.lines.length} medicines • Billed by {inv.billedByName}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-extrabold text-sm text-on-surface">
                        ৳ {parseFloat(inv.grandTotal).toFixed(2)}
                      </span>
                      <span className="block text-[10px] text-on-surface-variant uppercase font-mono">
                        {inv.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Invoice Banner */}
        {selectedInvoice && (
          <div className="p-4 bg-primary-container/10 border border-primary/20 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary text-sm">
                  {selectedInvoice.invoiceNumber}
                </span>
                <Badge variant="primary">{selectedInvoice.status}</Badge>
                <span className="text-xs text-on-surface font-semibold">
                  Customer: {selectedInvoice.customerName || 'Counter Sale'}
                </span>
              </div>
              <div className="text-xs text-on-surface-variant mt-1 font-mono">
                Original Grand Total: ৳ {parseFloat(selectedInvoice.grandTotal).toFixed(2)} (Subtotal: ৳{' '}
                {parseFloat(selectedInvoice.subtotal).toFixed(2)}, Discount: ৳{' '}
                {parseFloat(selectedInvoice.discountAmount || 0).toFixed(2)})
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedInvoice(null);
                setLineStatuses([]);
                setReturnDrafts({});
              }}
            >
              Change Invoice
            </Button>
          </div>
        )}

        {/* Invoice Lines Table with Selectors */}
        {selectedInvoice && (
          <div className="space-y-3">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
              Select Medicines to Return:
            </span>

            {loadingSummary ? (
              <div className="py-12 text-center text-xs text-on-surface-variant animate-pulse">
                Loading returnable quantities...
              </div>
            ) : lineStatuses.length === 0 ? (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                No items recorded on this invoice.
              </div>
            ) : (
              <div className="border border-outline-variant/30 rounded-2xl overflow-hidden divide-y divide-surface-container bg-surface-container-lowest">
                {lineStatuses.map((line) => {
                  const key = `${line.itemId}_${line.batchId}`;
                  const isSelected = !!returnDrafts[key];
                  const draft = returnDrafts[key];
                  const isFullyReturned = line.remainingReturnablePieces <= 0;

                  return (
                    <div
                      key={key}
                      className={`p-4 transition-colors ${
                        isSelected ? 'bg-primary-container/5' : ''
                      } ${isFullyReturned ? 'opacity-45 bg-slate-50' : ''}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isFullyReturned}
                            onChange={() => handleToggleItemForReturn(line)}
                            className="w-5 h-5 rounded-lg text-primary focus:ring-primary mt-0.5 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-on-surface">{line.tradeName}</span>
                              <span className="text-xs text-on-surface-variant">({line.genericName})</span>
                              <span className="text-[11px] font-mono text-primary font-bold bg-primary-container/10 px-2 py-0.5 rounded border border-primary/20">
                                Batch: {line.batchNumber}
                              </span>
                            </div>
                            <div className="text-xs text-on-surface-variant mt-0.5 font-mono">
                              Sold: {line.soldQuantityPieces} pcs • Already Returned: {line.alreadyReturnedPieces} pcs •{' '}
                              <span className="text-emerald-700 font-bold">
                                Available: {line.remainingReturnablePieces} pcs
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-on-surface">
                            ৳ {parseFloat(line.unitPricePerPiece).toFixed(2)} / pc
                          </span>
                        </div>
                      </div>

                      {/* Controls when item is selected */}
                      {isSelected && draft && (
                        <div className="mt-3 pt-3 border-t border-surface-container grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-container-low/50 p-3 rounded-xl">
                          {/* Unit Selector */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                              Return Unit
                            </label>
                            <div className="grid grid-cols-3 gap-1">
                              {(['piece', 'strip', 'box'] as const).map((u) => (
                                <button
                                  key={u}
                                  type="button"
                                  onClick={() => handleUpdateDraft(key, { unit: u })}
                                  className={`py-1 text-xs font-bold rounded-lg border capitalize cursor-pointer ${
                                    draft.unit === u
                                      ? 'bg-primary text-on-primary border-primary shadow-sm'
                                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                                  }`}
                                >
                                  {u}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Quantity */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                              Quantity ({draft.quantityPieces} pcs)
                            </label>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={draft.quantity}
                              onChange={(e) =>
                                handleUpdateDraft(key, {
                                  quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                                })
                              }
                              className="h-9 px-3 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-xs font-mono font-bold text-on-surface focus:border-primary focus:outline-none"
                            />
                          </div>

                          {/* Destination Bucket */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-on-surface-variant uppercase">
                              Restock Destination
                            </label>
                            <select
                              value={draft.destinationBucket}
                              onChange={(e) =>
                                handleUpdateDraft(key, {
                                  destinationBucket: e.target.value as any,
                                })
                              }
                              className="h-9 px-2 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-xs font-semibold text-on-surface focus:border-primary focus:outline-none"
                            >
                              <option value="sellable">Sellable (Restock to Shelf)</option>
                              <option value="damaged">Damaged (Quarantine)</option>
                              <option value="expired">Expired (Quarantine)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reason, Method & Estimated Refund Summary */}
        {selectedInvoice && draftsArray.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Return Reason Category <span className="text-primary font-bold">*</span>
                </label>
                <select
                  value={reasonCategory}
                  onChange={(e) => setReasonCategory(e.target.value)}
                  className="w-full h-11 px-3 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
                >
                  {REASON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Refund Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundMethod('cash')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      refundMethod === 'cash'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    Cash Refund
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundMethod('original_payment')}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      refundMethod === 'original_payment'
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    Original Payment
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Explanation Note <span className="text-primary font-bold">*</span>
              </label>
              <textarea
                rows={2}
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder="Mandatory note describing condition of returned medicines or customer reason..."
                className="w-full p-3 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
                required
              />
            </div>

            {/* Live Proportional Refund Breakdown Box */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">
                  Proportional Refund Calculation
                </span>
                <div className="text-xs text-emerald-800 font-mono mt-0.5 flex flex-wrap gap-2">
                  <span>Items Value: ৳ {liveSubtotalRefundDec.toFixed(2)}</span>
                  {liveDiscountRefundDec.greaterThan(0) && (
                    <span>• Discount Adj: -৳ {liveDiscountRefundDec.toFixed(2)}</span>
                  )}
                  {liveChargesRefundDec.greaterThan(0) && (
                    <span>• Tax/VAT Adj: +৳ {liveChargesRefundDec.toFixed(2)}</span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-900 block">Total Refund Due</span>
                <span className="font-mono text-2xl font-black text-emerald-950">৳ {liveGrandTotalRefund}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            disabled={!selectedInvoice || draftsArray.length === 0}
          >
            Issue Credit Note & Restock
          </Button>
        </div>
      </form>
    </Modal>
  );
};
