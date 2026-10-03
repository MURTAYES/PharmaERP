import React, { useState } from 'react';
import { format } from 'date-fns';
import { Invoice } from '../../types';
import { useSettings } from '../../context/SettingsContext.tsx';

interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  const { settings } = useSettings();
  const [receiptWidth, setReceiptWidth] = useState<'80mm' | '58mm'>(
    settings?.receiptWidth || '80mm'
  );

  if (!isOpen || !invoice) return null;

  const invoiceDate = new Date(invoice.createdAt);
  const formattedDate = format(invoiceDate, 'dd/MM/yyyy hh:mm a');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#002F34]/40 backdrop-blur-[6px] transition-all">
      <div className="relative w-full max-w-[560px] bg-white rounded-[28px] shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-[#E8F0ED] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002F34] text-white flex items-center justify-center shadow-md shadow-[#002F34]/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#002F34]">Thermal Receipt Preview</h2>
              <p className="text-xs text-[#5F7D7A] font-mono">Invoice #{invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F2F7F5] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Paper Selector & Print Bar */}
        <div className="p-4 bg-[#F8FAF9] border-b border-[#E8F0ED] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#002F34]">Paper Size:</span>
            {(['80mm', '58mm'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setReceiptWidth(w)}
                className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  receiptWidth === w
                    ? 'bg-[#002F34] text-white border-[#002F34] shadow-xs'
                    : 'bg-white text-[#5F7D7A] border-[#D5E3DE] hover:bg-[#E7F6F3]'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 rounded-xl bg-[#002F34] text-white text-xs font-bold shadow-md shadow-[#002F34]/20 hover:bg-[#012428] flex items-center gap-1.5 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Now
          </button>
        </div>

        {/* Receipt Container */}
        <div className="p-6 bg-[#EEF3F2] flex justify-center overflow-y-auto max-h-[55vh] custom-scrollbar">
          <div
            id="thermal-receipt"
            className={`bg-white text-black p-5 font-mono text-[11px] leading-tight shadow-md border border-gray-200 select-text ${
              receiptWidth === '58mm' ? 'w-[58mm] text-[10px]' : 'w-[80mm]'
            }`}
          >
            {/* Pharmacy Header */}
            <div className="text-center pb-3 border-b border-black border-dashed">
              <h2 className="font-extrabold text-sm uppercase tracking-wide">
                {settings?.pharmacyName || 'PharmaERP Pharmacy'}
              </h2>
              {settings?.address && <p className="text-[10px] mt-0.5">{settings.address}</p>}
              {settings?.phone && <p className="text-[10px]">Tel: {settings.phone}</p>}
              {settings?.receiptHeader && (
                <p className="text-[9px] italic mt-1">{settings.receiptHeader}</p>
              )}
            </div>

            {/* Invoice & Biller Info */}
            <div className="py-2.5 border-b border-black border-dashed text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Invoice: <strong>{invoice.invoiceNumber}</strong></span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Billed by: {invoice.billedByName}</span>
                <span>Status: {invoice.status}</span>
              </div>
              {invoice.customerName && (
                <div className="flex justify-between">
                  <span>Customer: {invoice.customerName}</span>
                  {invoice.customerPhone && <span>{invoice.customerPhone}</span>}
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <table className="w-full my-2.5 text-left border-collapse text-[10px]">
              <thead>
                <tr className="border-b border-black">
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="py-1">
                      <div className="font-bold">{line.tradeName}</div>
                      <div className="text-[8.5px] text-gray-700">
                        B: {line.batchNumber} • Exp: {format(new Date(line.expiryDate), 'MM/yy')}
                      </div>
                    </td>
                    <td className="py-1 text-center font-bold">
                      {line.quantity} {line.unit.slice(0, 1).toUpperCase()}
                    </td>
                    <td className="py-1 text-right">৳{parseFloat(line.unitPrice).toFixed(2)}</td>
                    <td className="py-1 text-right font-bold">
                      ৳{parseFloat(line.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="pt-2 border-t border-black border-dashed text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>৳ {parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>

              {parseFloat(invoice.discountAmount) > 0 && (
                <div className="flex justify-between text-gray-800">
                  <span>Discount ({parseFloat(invoice.discountPercent).toFixed(1)}%):</span>
                  <span>- ৳ {parseFloat(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}

              {invoice.charges?.map((c, i) => (
                <div key={i} className="flex justify-between text-gray-800">
                  <span>{c.name}:</span>
                  <span>+ ৳ {parseFloat(c.amount).toFixed(2)}</span>
                </div>
              ))}

              <div className="flex justify-between font-extrabold text-xs pt-1 border-t border-black">
                <span>GRAND TOTAL:</span>
                <span>৳ {parseFloat(invoice.grandTotal).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="py-2 border-t border-b border-black border-dashed text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-bold uppercase">{invoice.payment.method}</span>
              </div>
              {invoice.payment.cashTendered && (
                <div className="flex justify-between">
                  <span>Cash Tendered:</span>
                  <span>৳ {parseFloat(invoice.payment.cashTendered).toFixed(2)}</span>
                </div>
              )}
              {invoice.payment.changeDue && (
                <div className="flex justify-between font-bold">
                  <span>Change Due:</span>
                  <span>৳ {parseFloat(invoice.payment.changeDue).toFixed(2)}</span>
                </div>
              )}
              {invoice.payment.mfsProvider && (
                <div className="flex justify-between">
                  <span>MFS Provider:</span>
                  <span className="uppercase">{invoice.payment.mfsProvider} ({invoice.payment.mfsTransactionId || 'N/A'})</span>
                </div>
              )}
              {invoice.payment.cardLast4 && (
                <div className="flex justify-between">
                  <span>Card:</span>
                  <span>**** {invoice.payment.cardLast4}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-2.5 text-[9px] text-gray-700">
              <p>{settings?.receiptFooter || 'Thank you for choosing us! Get well soon.'}</p>
              <p className="mt-1 font-mono text-[8px] tracking-widest text-gray-500">
                * * * POWERED BY PHARMAERP * * *
              </p>
            </div>
          </div>
        </div>

        {/* Global Print Stylesheet */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #thermal-receipt, #thermal-receipt * {
              visibility: visible;
            }
            #thermal-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: ${receiptWidth};
              padding: 4mm;
              box-shadow: none;
              border: none;
            }
            @page {
              size: ${receiptWidth} auto;
              margin: 0;
            }
          }
        `}} />

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-[#E8F0ED] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-[#D5E3DE] text-xs font-bold text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F4F7F6]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
