import React from 'react';
import { Batch } from '../../types';
import { POSCartRow, CartLineItem } from './POSCartRow';

interface POSCartTableProps {
  lines: CartLineItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateUnit: (id: string, unit: 'piece' | 'strip' | 'box') => void;
  onUpdateBatch: (id: string, batch: Batch & { isFefo?: boolean }) => void;
  onUpdatePrice: (id: string, price: string) => void;
  onRemoveLine: (id: string) => void;
  onClearCart: () => void;
}

export const POSCartTable: React.FC<POSCartTableProps> = ({
  lines,
  onUpdateQuantity,
  onUpdateUnit,
  onUpdateBatch,
  onUpdatePrice,
  onRemoveLine,
  onClearCart,
}) => {
  if (lines.length === 0) {
    return (
      <div className="py-24 text-center text-on-surface-variant flex flex-col items-center justify-center gap-3 bg-surface-container-lowest border border-surface-container rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">point_of_sale</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-on-surface">Billing Cart is Empty</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Search medicine above or press <kbd className="font-mono font-bold bg-surface-container px-1.5 py-0.5 rounded text-primary">F2</kbd> to add items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-surface-container rounded-3xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-3.5 bg-surface-container-low border-b border-surface-container flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
          Cart Items ({lines.length} medicines, {lines.reduce((acc, l) => acc + l.quantityPieces, 0)} total pieces)
        </span>
        <button
          type="button"
          onClick={onClearCart}
          className="text-xs font-semibold text-error hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
          Clear All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-container bg-surface-container-low/40 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-12">#</th>
              <th className="py-2.5 px-3">Medicine Description</th>
              <th className="py-2.5 px-3 w-40">Batch & FEFO</th>
              <th className="py-2.5 px-3 w-36">Unit</th>
              <th className="py-2.5 px-3 w-32">Qty</th>
              <th className="py-2.5 px-3 w-36">Unit Price</th>
              <th className="py-2.5 px-3 text-right w-28">Total</th>
              <th className="py-2.5 px-2 text-center w-12"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <POSCartRow
                key={line.id}
                index={idx}
                line={line}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateUnit={onUpdateUnit}
                onUpdateBatch={onUpdateBatch}
                onUpdatePrice={onUpdatePrice}
                onRemoveLine={onRemoveLine}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
