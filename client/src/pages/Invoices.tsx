import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Invoice } from '../types';
import { getInvoices } from '../services/posApi';
import { ThermalReceiptModal } from '../components/pos/ThermalReceiptModal';
import { Button } from '../components/common/Button';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Receipt Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [page, search, startDate, endDate]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await getInvoices({
        page,
        limit: 15,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setInvoices(res.invoices);
      setTotalPages(res.pagination.totalPages);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowReceiptModal(true);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-surface-container-low border border-surface-container rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-bold">
            <span className="material-symbols-outlined text-[22px]">receipt_long</span>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-on-surface">Invoice History & Receipts</h1>
            <p className="text-xs text-on-surface-variant">View sales snapshots and reprint thermal receipts</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-surface-container-lowest border border-surface-container rounded-2xl">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search invoice #, customer name, phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 pl-9 pr-3 bg-surface-container-low border border-transparent rounded-xl text-xs text-on-surface focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-semibold">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 bg-surface-container-low border border-transparent rounded-xl text-xs text-on-surface focus:bg-surface-container-lowest focus:border-primary focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant font-semibold">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 px-3 bg-surface-container-low border border-transparent rounded-xl text-xs text-on-surface focus:bg-surface-container-lowest focus:border-primary focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-on-surface-variant">
            <span className="animate-spin material-symbols-outlined text-3xl text-primary block mx-auto mb-2">
              progress_activity
            </span>
            <p className="text-xs font-semibold">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline-variant block mx-auto mb-2">
              receipt
            </span>
            <p className="text-sm font-bold text-on-surface">No invoices found</p>
            <p className="text-xs text-on-surface-variant">Invoices generated at POS will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-low text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Billed By</th>
                  <th className="py-3 px-4">Items / Pcs</th>
                  <th className="py-3 px-4">Flags</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {invoices.map((inv) => {
                  const dateStr = format(new Date(inv.createdAt), 'dd/MM/yyyy hh:mm a');
                  const totalPcs = inv.lines.reduce((acc, l) => acc + l.quantityPieces, 0);

                  return (
                    <tr key={inv._id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant font-mono">{dateStr}</td>
                      <td className="py-3 px-4">
                        {inv.customerName ? (
                          <div>
                            <span className="font-semibold text-on-surface block">{inv.customerName}</span>
                            {inv.customerPhone && (
                              <span className="text-[10px] text-on-surface-variant font-mono">
                                {inv.customerPhone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-on-surface-variant italic">Counter Sale</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-on-surface font-medium">{inv.billedByName}</td>
                      <td className="py-3 px-4 font-mono">
                        {inv.lines.length} med ({totalPcs} pcs)
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {inv.hasNonFefoBatch && (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded uppercase">
                              Non-FEFO
                            </span>
                          )}
                          {inv.hasPriceOverride && (
                            <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded uppercase">
                              Override
                            </span>
                          )}
                          {!inv.hasNonFefoBatch && !inv.hasPriceOverride && (
                            <span className="text-[9px] font-medium text-on-surface-variant">Standard</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold uppercase tracking-wider text-[10px] bg-surface-container-low px-2 py-0.5 rounded-md border border-outline-variant/30">
                          {inv.payment.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-sm text-on-surface">
                        ৳ {parseFloat(inv.grandTotal).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReceipt(inv)}
                          className="gap-1 px-2.5 py-1 text-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">print</span>
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 bg-surface-container-low border-t border-surface-container flex items-center justify-between text-xs">
            <span className="text-on-surface-variant">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <ThermalReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          invoice={selectedInvoice}
        />
      )}
    </div>
  );
};
