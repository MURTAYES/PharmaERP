import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SalesReturnModal } from '../components/returns/SalesReturnModal';
import { CreditNoteReceiptModal } from '../components/returns/CreditNoteReceiptModal';
import { SupplierReturnModal } from '../components/returns/SupplierReturnModal';
import { returnApi } from '../services/returnApi';
import { CreditNote, SupplierReturn } from '../types';
import { useAuth } from '../context/AuthContext';

export const Returns: React.FC = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [activeTab, setActiveTab] = useState<'sales_returns' | 'supplier_returns'>('sales_returns');

  // Customer Credit Notes State
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [loadingCreditNotes, setLoadingCreditNotes] = useState(true);
  const [creditNoteSearch, setCreditNoteSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Supplier Returns State (Owner)
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>([]);
  const [loadingSupplierReturns, setLoadingSupplierReturns] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  // Modals
  const [isSalesReturnOpen, setIsSalesReturnOpen] = useState(false);
  const [isSupplierReturnOpen, setIsSupplierReturnOpen] = useState(false);
  const [selectedCreditNoteForPrint, setSelectedCreditNoteForPrint] = useState<CreditNote | null>(null);

  const fetchCreditNotes = useCallback(async () => {
    setLoadingCreditNotes(true);
    try {
      const res = await returnApi.getCreditNotes({
        page,
        limit: 15,
        search: creditNoteSearch || undefined,
      });
      setCreditNotes(res.creditNotes || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch {
      setCreditNotes([]);
    } finally {
      setLoadingCreditNotes(false);
    }
  }, [page, creditNoteSearch]);

  const fetchSupplierReturns = useCallback(async () => {
    if (!isOwner) return;
    setLoadingSupplierReturns(true);
    try {
      const res = await returnApi.getSupplierReturns({
        page: 1,
        limit: 20,
        search: supplierSearch || undefined,
      });
      setSupplierReturns(res.supplierReturns || []);
    } catch {
      setSupplierReturns([]);
    } finally {
      setLoadingSupplierReturns(false);
    }
  }, [isOwner, supplierSearch]);

  useEffect(() => {
    if (activeTab === 'sales_returns') {
      fetchCreditNotes();
    } else {
      fetchSupplierReturns();
    }
  }, [activeTab, fetchCreditNotes, fetchSupplierReturns]);

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Header Banner */}
      <div className="w-full bg-surface-container-lowest rounded-3xl p-6 sm:p-8 shadow-clinical border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-container/15 flex items-center justify-center text-primary shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[28px]">assignment_return</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              Returns & Credit Management
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
              Customer sales returns against previous invoices, proportional refunds, and supplier batch credit vouchers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            onClick={() => setIsSalesReturnOpen(true)}
            className="gap-1.5"
          >
            <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
            New Sales Return
          </Button>

          {isOwner && (
            <Button
              variant="outline"
              onClick={() => setIsSupplierReturnOpen(true)}
              className="gap-1.5"
            >
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              Supplier Return
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-surface-container pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('sales_returns')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sales_returns'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">receipt</span>
          Customer Credit Notes
        </button>

        {isOwner && (
          <button
            type="button"
            onClick={() => setActiveTab('supplier_returns')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'supplier_returns'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">inventory</span>
            Supplier Returns (SRT)
          </button>
        )}
      </div>

      {/* Tab Content: Customer Credit Notes */}
      {activeTab === 'sales_returns' && (
        <div className="space-y-4">
          {/* Search Filter */}
          <Card className="p-4 bg-surface-container-lowest">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-on-surface-variant/60 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search by Credit Note #, Original Invoice #, or Customer details..."
                value={creditNoteSearch}
                onChange={(e) => {
                  setCreditNoteSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </Card>

          {/* Table */}
          <Card className="overflow-hidden p-0 border-outline-variant/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-surface-container-low text-xs text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-container">
                  <tr>
                    <th className="px-5 py-4">Credit Note #</th>
                    <th className="px-5 py-4">Original Invoice</th>
                    <th className="px-5 py-4">Date & Time</th>
                    <th className="px-5 py-4">Customer & Staff</th>
                    <th className="px-5 py-4">Reason</th>
                    <th className="px-5 py-4 text-right">Refund Total</th>
                    <th className="px-5 py-4 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {loadingCreditNotes ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-on-surface-variant">
                        <span className="material-symbols-outlined text-4xl animate-spin text-primary block mb-2 mx-auto">
                          progress_activity
                        </span>
                        Loading credit notes...
                      </td>
                    </tr>
                  ) : creditNotes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-on-surface-variant">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block mb-2 mx-auto">
                          receipt_long
                        </span>
                        No credit notes recorded yet.
                      </td>
                    </tr>
                  ) : (
                    creditNotes.map((cn) => {
                      const dateStr = format(new Date(cn.createdAt), 'dd/MM/yyyy hh:mm a');
                      const totalPcs = cn.lines.reduce((acc, l) => acc + l.returnedQuantityPieces, 0);

                      return (
                        <tr key={cn._id} className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-primary text-xs">
                            {cn.creditNoteNumber}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-on-surface font-semibold">
                            {cn.invoiceNumber}
                          </td>
                          <td className="px-5 py-4 text-xs font-mono text-on-surface-variant">{dateStr}</td>
                          <td className="px-5 py-4">
                            <div className="text-xs font-bold text-on-surface">
                              {cn.customerName || 'Counter Customer'}
                            </div>
                            <div className="text-[11px] text-on-surface-variant">
                              By {cn.processedByName} • {cn.lines.length} med ({totalPcs} pcs)
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant="warning">{cn.reasonCategory}</Badge>
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-black text-sm text-emerald-900">
                            ৳ {parseFloat(cn.grandTotalRefund).toFixed(2)}
                            <span className="block text-[10px] text-on-surface-variant font-sans uppercase">
                              via {cn.refundMethod}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCreditNoteForPrint(cn)}
                              className="gap-1 px-2.5 py-1 text-xs"
                            >
                              <span className="material-symbols-outlined text-[16px]">print</span>
                              Slip
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 bg-surface-container-low border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                <div>
                  Showing page <span className="font-bold text-on-surface">{page}</span> of{' '}
                  <span className="font-bold text-on-surface">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab Content: Supplier Returns (Owner Only) */}
      {activeTab === 'supplier_returns' && isOwner && (
        <div className="space-y-4">
          <Card className="p-4 bg-surface-container-lowest">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-on-surface-variant/60 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search by Return Number (SRT), Supplier Name, or Memo Ref..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </Card>

          <Card className="overflow-hidden p-0 border-outline-variant/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-surface-container-low text-xs text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-container">
                  <tr>
                    <th className="px-5 py-4">Return Voucher #</th>
                    <th className="px-5 py-4">Supplier / Distributor</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Items Returned</th>
                    <th className="px-5 py-4">Memo / Reason</th>
                    <th className="px-5 py-4 text-right">Est. Credit Memo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {loadingSupplierReturns ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-on-surface-variant">
                        <span className="material-symbols-outlined text-4xl animate-spin text-primary block mb-2 mx-auto">
                          progress_activity
                        </span>
                        Loading supplier returns...
                      </td>
                    </tr>
                  ) : supplierReturns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-on-surface-variant">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 block mb-2 mx-auto">
                          inventory_2
                        </span>
                        No supplier return vouchers created yet.
                      </td>
                    </tr>
                  ) : (
                    supplierReturns.map((srt) => {
                      const dateStr = format(new Date(srt.createdAt), 'dd/MM/yyyy');

                      return (
                        <tr key={srt._id} className="hover:bg-surface-container-low/60 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-primary text-xs">
                            {srt.supplierReturnNumber}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-on-surface block text-xs">{srt.supplierName}</span>
                            {srt.supplierInvoiceRef && (
                              <span className="text-[11px] text-on-surface-variant font-mono">
                                Ref: {srt.supplierInvoiceRef}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-xs font-mono text-on-surface-variant">{dateStr}</td>
                          <td className="px-5 py-4 text-xs font-mono">
                            {srt.lines.length} batches ({srt.totalQuantityPieces} pcs)
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-on-surface block">{srt.reasonCategory}</span>
                            {srt.reasonDetail && (
                              <span className="text-[11px] text-on-surface-variant italic">
                                {srt.reasonDetail}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right font-mono font-extrabold text-sm text-on-surface">
                            {srt.totalEstimatedCredit
                              ? `৳ ${parseFloat(srt.totalEstimatedCredit).toFixed(2)}`
                              : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modals */}
      <SalesReturnModal
        isOpen={isSalesReturnOpen}
        onClose={() => setIsSalesReturnOpen(false)}
        onSuccess={(creditNote) => {
          fetchCreditNotes();
          setSelectedCreditNoteForPrint(creditNote);
        }}
      />

      <SupplierReturnModal
        isOpen={isSupplierReturnOpen}
        onClose={() => setIsSupplierReturnOpen(false)}
        onSuccess={() => fetchSupplierReturns()}
      />

      {selectedCreditNoteForPrint && (
        <CreditNoteReceiptModal
          isOpen={!!selectedCreditNoteForPrint}
          onClose={() => setSelectedCreditNoteForPrint(null)}
          creditNote={selectedCreditNoteForPrint}
        />
      )}
    </div>
  );
};
