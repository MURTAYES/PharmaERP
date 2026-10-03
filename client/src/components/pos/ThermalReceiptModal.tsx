import React, { useState } from 'react';
import { format } from 'date-fns';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
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

  if (!invoice) return null;

  const invoiceDate = new Date(invoice.createdAt);
  const formattedDate = format(invoiceDate, 'dd/MM/yyyy hh:mm a');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt & Print Center" maxWidth="md">
      <div className="space-y-4 text-left">
        {/* Width Toggle & Print Controls */}
        <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-2xl border border-surface-container">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">Paper Width:</span>
            {(['80mm', '58mm'] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setReceiptWidth(w)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  receiptWidth === w
                    ? 'bg-primary text-on-primary border-primary shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          <Button size="sm" variant="primary" onClick={handlePrint} className="gap-1.5">
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Receipt
          </Button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="flex justify-center p-4 bg-surface-container rounded-2xl overflow-y-auto max-h-[60vh]">
          <div
            id="thermal-receipt"
            className={`bg-white text-black p-4 font-mono text-[11px] leading-tight shadow-md select-text ${
              receiptWidth === '58mm' ? 'w-[58mm] text-[10px]' : 'w-[80mm]'
            }`}
          >
            {/* Pharmacy Header */}
            <div className="text-center pb-2 border-b border-black border-dashed">
              <h2 className="font-extrabold text-sm uppercase tracking-wide">
                {settings?.pharmacyName || 'PharmaERP Pharmacy'}
              </h2>
              {settings?.address && <p className="text-[10px] mt-0.5">{settings.address}</p>}
              {settings?.phone && <p className="text-[10px]">Tel: {settings.phone}</p>}
              {settings?.receiptHeader && (
                <p className="text-[9px] italic mt-1">{settings.receiptHeader}</p>
              )}
            </div>

            {/* Invoice & Biller Metadata */}
            <div className="py-2 border-b border-black border-dashed text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Inv: <strong>{invoice.invoiceNumber}</strong></span>
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
            <table className="w-full my-2 text-left border-collapse text-[10px]">
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
                    <td className="py-1 text-right">{parseFloat(line.unitPrice).toFixed(2)}</td>
                    <td className="py-1 text-right font-bold">
                      {parseFloat(line.lineTotal).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Financial Summary */}
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

              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-black">
                <span>GRAND TOTAL:</span>
                <span>৳ {parseFloat(invoice.grandTotal).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment & Change Due */}
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
                  <span>Card Last 4:</span>
                  <span>**** {invoice.payment.cardLast4}</span>
                </div>
              )}
            </div>

            {/* Receipt Footer */}
            <div className="text-center pt-2 text-[9px] text-gray-700">
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
            }
            @page {
              size: ${receiptWidth} auto;
              margin: 0;
            }
          }
        `}} />

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handlePrint} className="gap-1.5">
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};
