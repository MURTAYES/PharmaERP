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
      <tr className="border-b border-surface-container hover:bg-surface-container-low/60 transition-colors text-xs">
        {/* Row Index */}
        <td className="py-3 px-3 text-center text-on-surface-variant font-mono font-semibold">
          {index + 1}
        </td>

        {/* Medicine Name & Info */}
        <td className="py-3 px-3">
          <div className="font-bold text-sm text-on-surface">{line.tradeName}</div>
          <div className="text-[11px] text-on-surface-variant font-medium">
            {line.genericName}
          </div>
          <div className="text-[10px] text-on-surface-variant/80 font-mono mt-0.5">
            MRP: ৳ {parseFloat(line.mrpPerPiece).toFixed(2)}/pc • {line.unitHierarchy.piecesPerStrip} pcs/strip • {line.unitHierarchy.stripsPerBox} strips/box
          </div>
        </td>

        {/* Batch & Expiry with FEFO Tag */}
        <td className="py-3 px-3">
          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            className="flex items-center gap-1.5 p-1.5 bg-surface-container-low hover:bg-surface-container rounded-xl border border-outline-variant/30 transition-all text-left cursor-pointer group"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs text-on-surface">
                  {line.batchNumber}
                </span>
                {line.isNonFefo ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                    Non-FEFO
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                    FEFO
                  </span>
                )}
              </div>
              <span className="text-[10px] text-on-surface-variant">Exp: {formattedExpiry}</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary">
              expand_more
            </span>
          </button>
        </td>

        {/* Unit Switcher */}
        <td className="py-3 px-3">
          <div className="inline-flex rounded-xl bg-surface-container-low p-0.5 border border-outline-variant/20">
            {(['piece', 'strip', 'box'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onUpdateUnit(line.id, u)}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  line.unit === u
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </td>

        {/* Quantity Controls (Integer Only) */}
        <td className="py-3 px-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.id, Math.max(1, line.quantity - 1))}
              className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            >
              -
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
              className="w-14 h-8 text-center bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-sm font-mono font-bold focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onUpdateQuantity(line.id, line.quantity + 1)}
              className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            >
              +
            </button>
          </div>
          <span className="block text-[10px] text-on-surface-variant text-center font-mono mt-0.5">
            = {line.quantityPieces} pcs
          </span>
        </td>

        {/* Unit Price & Override Button */}
        <td className="py-3 px-3">
          <div className="flex items-center gap-1.5">
            <div>
              <span className="font-mono font-bold text-sm text-on-surface">
                ৳ {parseFloat(line.unitPrice).toFixed(2)}
              </span>
              {line.isPriceOverridden && (
                <span className="block text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded w-max">
                  Overridden (Cat: ৳{line.catalogUnitPrice})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowPriceModal(true)}
              title="Override Price"
              className="p-1 rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          </div>
        </td>

        {/* Line Total */}
        <td className="py-3 px-3 text-right">
          <span className="font-mono font-extrabold text-sm text-primary">
            ৳ {parseFloat(line.lineTotal).toFixed(2)}
          </span>
        </td>

        {/* Delete Line */}
        <td className="py-3 px-2 text-center">
          <button
            type="button"
            onClick={() => onRemoveLine(line.id)}
            title="Remove item"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
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
