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
      <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-[#F8FAF9]/60 border border-dashed border-slate-200 rounded-3xl">
        <div className="w-14 h-14 rounded-2xl bg-[#97D8D0]/20 text-[#002F34] flex items-center justify-center">
          <svg className="w-7 h-7 text-[#006059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#002F34]">Billing Cart is Empty</h3>
          <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
            Search medicine above or scan barcode. Press <kbd className="font-mono font-bold bg-white text-[#002F34] px-1.5 py-0.5 rounded border border-slate-200">F2</kbd> (Brand) or <kbd className="font-mono font-bold bg-white text-[#002F34] px-1.5 py-0.5 rounded border border-slate-200">F3</kbd> (Generic).
          </p>
        </div>
      </div>
    );
  }

  const totalPieces = lines.reduce((acc, l) => acc + l.quantityPieces, 0);

  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden flex flex-col">
      {/* Table Subheader Bar */}
      <div className="px-4 py-3 bg-[#F8FAF9] border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#002F34]">
            Cart Items
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {lines.length} medicines • {totalPieces} pcs
          </span>
        </div>
        <button
          type="button"
          onClick={onClearCart}
          className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer transition-colors px-2 py-0.5 rounded-full hover:bg-rose-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear Cart
        </button>
      </div>

      {/* Cart Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-[#FAFCFB] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-10">#</th>
              <th className="py-2.5 px-3">Medicine Description</th>
              <th className="py-2.5 px-3 w-36">Batch & FEFO</th>
              <th className="py-2.5 px-3 w-36">Unit</th>
              <th className="py-2.5 px-3 w-32">Qty</th>
              <th className="py-2.5 px-3 w-32">Unit Price</th>
              <th className="py-2.5 px-3 text-right w-24">Total</th>
              <th className="py-2.5 px-2 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
