import React, { useState } from 'react';
import { format } from 'date-fns';
import { Batch } from '../../types';
import { POSBatchSelectorModal } from './POSBatchSelectorModal';
import { POSPriceOverrideModal } from './POSPriceOverrideModal';

export interface CartLineItem {
  id: string; // client uuid
  itemId: string;
  tradeName: string;
  genericName: string;
  unitHierarchy: {
    piecesPerStrip: number;
    stripsPerBox: number;
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
  onUpdateUnit,
  onUpdateBatch,
  onUpdatePrice,
  onRemoveLine,
}) => {
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const expiryDateObj = new Date(line.expiryDate);
  const formattedExpiry = format(expiryDateObj, 'MM/yy');

  return (
    <>
      <tr className="border-b border-[#EEF3F2] hover:bg-[#F9FBFA] transition-colors text-xs group">
        {/* Row Index */}
        <td className="py-3.5 px-3 text-center text-[#7A9894] font-mono font-bold text-xs">
          {index + 1}
        </td>

        {/* Medicine Name & Info */}
        <td className="py-3.5 px-3">
          <div className="font-bold text-sm text-[#002F34]">{line.tradeName}</div>
          <div className="text-[11px] text-[#5F7D7A] font-medium mt-0.5">
            {line.genericName}
          </div>
          <div className="text-[10px] text-[#7A9894] font-mono mt-0.5">
            Base MRP: ৳{parseFloat(line.mrpPerPiece).toFixed(2)}/pc · {line.unitHierarchy.piecesPerStrip} pcs/strip · {line.unitHierarchy.stripsPerBox} strips/box
          </div>
        </td>

        {/* Batch & Expiry with FEFO Tag */}
        <td className="py-3.5 px-3">
          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-2 p-2 bg-[#F4F7F6] hover:bg-[#E8F0ED] rounded-xl border border-[#D5E3DE] transition-all text-left cursor-pointer group/btn"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs text-[#002F34]">
                  {line.batchNumber}
                </span>
                {line.isNonFefo ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                    Non-FEFO
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#E1F6F0] text-[#007062] px-1.5 py-0.2 rounded border border-[#BCE8DD]">
                    FEFO
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#5F7D7A] font-mono block mt-0.5">Exp: {formattedExpiry}</span>
            </div>
            <svg className="w-4 h-4 text-[#7A9894] group-hover/btn:text-[#002F34] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </td>

        {/* Unit Switcher */}
        <td className="py-3.5 px-3">
          <div className="inline-flex rounded-xl bg-[#F0F5F3] p-1 border border-[#D5E3DE]">
            {(['piece', 'strip', 'box'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onUpdateUnit(line.id, u)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  line.unit === u
                    ? 'bg-[#002F34] text-white shadow-xs'
                    : 'text-[#5F7D7A] hover:text-[#002F34] hover:bg-white/60'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </td>

        {/* Quantity Controls (Integer Only) */}
        <td className="py-3.5 px-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.id, Math.max(1, line.quantity - 1))}
              className="w-7 h-7 rounded-lg bg-[#E8F0ED] hover:bg-[#D5E3DE] active:scale-95 text-[#002F34] flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
            >
              −
            </button>
            <input
              type="number"
              step="1"
              min="1"
              value={line.quantity}
              onKeyDown={(e) => {
                if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
                onUpdateQuantity(line.id, isNaN(val) ? 1 : Math.max(1, val));
              }}
              className="w-14 h-7 text-center bg-white border border-[#D5E3DE] rounded-lg text-sm font-mono font-bold text-[#002F34] focus:border-[#002F34] focus:outline-none shadow-2xs"
            />
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.id, line.quantity + 1)}
              className="w-7 h-7 rounded-lg bg-[#E8F0ED] hover:bg-[#D5E3DE] active:scale-95 text-[#002F34] flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
            >
              +
            </button>
          </div>
          <span className="block text-[10px] text-[#7A9894] text-center font-mono mt-0.5">
            = {line.quantityPieces} pcs
          </span>
        </td>

        {/* Unit Price & Override Button */}
        <td className="py-3.5 px-3">
          <div className="flex items-center gap-2">
            <div>
              <span className="font-mono font-bold text-sm text-[#002F34]">
                ৳ {parseFloat(line.unitPrice).toFixed(2)}
              </span>
              {line.isPriceOverridden && (
                <span className="block text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded mt-0.5">
                  Overridden (Cat: ৳{line.catalogUnitPrice})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowPriceModal(true)}
              title="Override Price"
              className="p-1 rounded-lg text-[#7A9894] hover:text-[#002F34] hover:bg-[#E8F0ED] transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        </td>

        {/* Line Total */}
        <td className="py-3.5 px-3 text-right">
          <span className="font-mono font-extrabold text-sm text-[#002F34]">
            ৳ {parseFloat(line.lineTotal).toFixed(2)}
          </span>
        </td>

        {/* Delete Line */}
        <td className="py-3.5 px-2 text-center">
          <button
            type="button"
            onClick={() => onRemoveLine(line.id)}
            title="Remove item"
            className="w-7 h-7 rounded-lg text-[#9FB7B2] hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center cursor-pointer mx-auto"
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
