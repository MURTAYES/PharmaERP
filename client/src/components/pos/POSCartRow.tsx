import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Batch } from '../../types';
import { POSBatchSelectorModal } from './POSBatchSelectorModal';
import { POSPriceOverrideModal } from './POSPriceOverrideModal';
import { formatMoney } from '../../utils/money';

export interface CartLineItem {
  id: string; // client uuid
  itemId: string;
  tradeName: string;
  genericName: string;
  unitHierarchy: {
    piecesPerBox?: number;
    piecesPerStrip?: number;
    stripsPerBox?: number;
  };
  mrpPerPiece: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  availableStockPieces: number;
  isFefo: boolean;
  isNonFefo: boolean;
  availableBatches: (Batch & { isFefo?: boolean })[];
  unit: 'piece' | 'strip' | 'box';
  quantity: number;
  quantityPieces: number;
  catalogUnitPrice: string;
  unitPrice: string;
  isPriceOverridden: boolean;
  lineTotal: string;
}

interface POSCartRowProps {
  index: number;
  line: CartLineItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateUnit: (id: string, unit: 'piece' | 'strip' | 'box') => void;
  onUpdateBatch: (id: string, batch: Batch & { isFefo?: boolean }) => void;
  onUpdatePrice: (id: string, price: string) => void;
  onRemoveLine: (id: string) => void;
}

export const POSCartRow: React.FC<POSCartRowProps> = ({
  index,
  line,
  onUpdateQuantity,
  onUpdateBatch,
  onUpdatePrice,
  onRemoveLine,
}) => {
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [qtyInput, setQtyInput] = useState<string>(String(line.quantity));

  useEffect(() => {
    setQtyInput(String(line.quantity));
  }, [line.quantity]);

  const expiryDateObj = new Date(line.expiryDate);
  const formattedExpiry = format(expiryDateObj, 'MM/yy');

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-[#F8FAF9] transition-colors text-xs group">
        {/* Row Index */}
        <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold text-xs">
          {index + 1}
        </td>

        {/* Medicine Name & Info */}
        <td className="py-3 px-3">
          <div className="font-bold text-sm text-[#002F34]">{line.tradeName}</div>
          <div className="text-[11px] text-slate-500 font-medium">
            {line.genericName}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            MRP: ৳{parseFloat(line.mrpPerPiece).toFixed(2)}/pc
            {line.unitHierarchy?.piecesPerBox ? ` • ${line.unitHierarchy.piecesPerBox} pcs/box` : ''}
          </div>
        </td>

        {/* Batch & Expiry with FEFO Tag */}
        <td className="py-3 px-3">
          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F3F7F6] hover:bg-slate-200/70 rounded-xl transition-all text-left cursor-pointer group/btn"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs text-[#002F34]">
                  {line.batchNumber}
                </span>
                {line.isNonFefo ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-full">
                    Non-FEFO
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                    FEFO
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Exp: {formattedExpiry}</span>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#002F34] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </td>

        {/* Sales Unit (All POS counter sales are in Piece) */}
        <td className="py-3 px-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full bg-[#E7F6F3] text-[#006059] border border-[#C5E8E0]">
            Piece (pc)
          </span>
        </td>

        {/* Quantity Controls */}
        <td className="py-3 px-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.id, Math.max(1, line.quantity - 1))}
              className="w-6 h-6 rounded-full bg-[#F3F7F6] hover:bg-slate-200 text-[#002F34] flex items-center justify-center font-bold text-xs cursor-pointer transition-all"
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={qtyInput}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^0-9]/g, '');
                setQtyInput(cleaned);
                if (cleaned !== '') {
                  const val = parseInt(cleaned, 10);
                  if (val > 0) {
                    onUpdateQuantity(line.id, val);
                  }
                }
              }}
              onBlur={() => {
                const val = parseInt(qtyInput, 10);
                if (isNaN(val) || val < 1) {
                  setQtyInput('1');
                  onUpdateQuantity(line.id, 1);
                } else {
                  setQtyInput(String(val));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-12 h-6 text-center bg-transparent hover:bg-[#F3F7F6] focus:bg-white focus:ring-1 focus:ring-[#002F34] rounded text-xs font-mono font-bold text-[#002F34] focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.id, line.quantity + 1)}
              className="w-6 h-6 rounded-full bg-[#F3F7F6] hover:bg-slate-200 text-[#002F34] flex items-center justify-center font-bold text-xs cursor-pointer transition-all"
            >
              +
            </button>
          </div>
        </td>

        {/* Unit Price & Override Button */}
        <td className="py-3 px-3">
          <div className="flex items-center gap-2">
            <div>
              <span className="font-mono font-bold text-xs sm:text-sm text-[#002F34]">
                ৳ {formatMoney(line.unitPrice)}
              </span>
              {line.isPriceOverridden && (
                <span className="block text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full mt-0.5">
                  Overridden (Cat: ৳{formatMoney(line.catalogUnitPrice)})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowPriceModal(true)}
              title="Override Price"
              className="p-1 rounded-lg text-slate-400 hover:text-[#002F34] hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </td>

        {/* Line Total */}
        <td className="py-3 px-3 text-right">
          <span className="font-mono font-extrabold text-sm text-[#002F34]">
            ৳ {formatMoney(line.lineTotal)}
          </span>
        </td>

        {/* Delete Line */}
        <td className="py-3 px-2 text-center">
          <button
            type="button"
            onClick={() => onRemoveLine(line.id)}
            title="Remove item"
            className="w-7 h-7 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </td>
      </tr>

      {/* Batch Selector Modal */}
      {showBatchModal && (
        <POSBatchSelectorModal
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          tradeName={line.tradeName}
          batches={line.availableBatches}
          currentBatchId={line.batchId}
          onSelectBatch={(selectedBatch) => onUpdateBatch(line.id, selectedBatch)}
        />
      )}

      {/* Price Override Modal */}
      {showPriceModal && (
        <POSPriceOverrideModal
          isOpen={showPriceModal}
          onClose={() => setShowPriceModal(false)}
          tradeName={line.tradeName}
          unit={line.unit}
          catalogPrice={line.catalogUnitPrice}
          currentPrice={line.unitPrice}
          onApplyOverride={(newPrice) => onUpdatePrice(line.id, newPrice)}
        />
      )}
    </>
  );
};
