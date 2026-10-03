import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CreditNote } from '../../types';

interface CreditNoteReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditNote: CreditNote | null;
}

export const CreditNoteReceiptModal: React.FC<CreditNoteReceiptModalProps> = ({
  isOpen,
  onClose,
  creditNote,
}) => {
  const printContainerRef = useRef<HTMLDivElement>(null);

  if (!creditNote) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = format(new Date(creditNote.createdAt), 'dd/MM/yyyy hh:mm a');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Credit Note & Refund Slip" maxWidth="md">
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-surface-container no-print">
          <span className="text-xs text-on-surface-variant font-medium">
            Print thermal customer refund slip
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" variant="primary" onClick={handlePrint} className="gap-1.5">
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Slip
            </Button>
          </div>
        </div>

        {/* Thermal Receipt Paper Layout */}
        <div
          ref={printContainerRef}
          className="receipt-print-area bg-white text-slate-900 font-mono text-xs p-6 rounded-2xl border border-slate-200 shadow-sm mx-auto max-w-[80mm] leading-relaxed"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-base font-extrabold uppercase tracking-tight">PharmaERP Pharmacy</h2>
            <p className="text-[11px] text-slate-600">Sales Return & Credit Voucher</p>
            <div className="mt-2 text-[10px] text-slate-500 font-mono">
              <span>Date: {formattedDate}</span>
            </div>
          </div>

          {/* Metadata */}
          <div className="py-2.5 text-[11px] border-b border-dashed border-slate-300 space-y-1">
            <div className="flex justify-between font-bold">
              <span>Credit Note #:</span>
              <span>{creditNote.creditNoteNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Original Invoice:</span>
              <span>{creditNote.invoiceNumber}</span>
            </div>
            {creditNote.customerName && (
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{creditNote.customerName}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Processed By:</span>
              <span>{creditNote.processedByName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Refund Method:</span>
              <span className="uppercase">{creditNote.refundMethod}</span>
            </div>
          </div>

          {/* Returned Items */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <div className="flex justify-between font-bold text-[10px] uppercase text-slate-500 mb-1.5">
              <span>Item Description</span>
              <span>Total</span>
            </div>

            <div className="space-y-2">
              {creditNote.lines.map((line, idx) => (
                <div key={idx} className="text-[11px]">
                  <div className="font-bold flex justify-between">
                    <span>{line.tradeName}</span>
                    <span>৳ {parseFloat(line.returnedLineTotal).toFixed(2)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>
                      {line.returnedQuantity} {line.unit} ({line.returnedQuantityPieces} pcs) @ ৳
                      {parseFloat(line.originalUnitPricePerPiece).toFixed(2)}/pc
                    </span>
                    <span className="capitalize">[{line.destinationBucket}]</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>Subtotal Returned:</span>
              <span>৳ {parseFloat(creditNote.subtotalRefund).toFixed(2)}</span>
            </div>
            {parseFloat(creditNote.discountRefund) > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Discount Deduction:</span>
                <span>-৳ {parseFloat(creditNote.discountRefund).toFixed(2)}</span>
              </div>
            )}
            {creditNote.chargesRefund?.map((c, i) => (
              <div key={i} className="flex justify-between text-slate-600">
                <span>Tax/Charge Refund ({c.name}):</span>
                <span>+৳ {parseFloat(c.refundAmount).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-dashed border-slate-300 text-slate-950">
              <span>TOTAL REFUNDED:</span>
              <span>৳ {parseFloat(creditNote.grandTotalRefund).toFixed(2)}</span>
            </div>
          </div>

          {/* Reason & Footer */}
          <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
            <p>Reason: {creditNote.reasonCategory}</p>
            {creditNote.reasonDetail && <p className="italic">"{creditNote.reasonDetail}"</p>}
            <p className="mt-2 font-bold uppercase text-slate-800">Refund Authorized</p>
            <p>Thank you for your visit!</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
