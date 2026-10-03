import React, { useState, useEffect, useRef } from 'react';
import { Item } from '../../types';
import { searchItems } from '../../services/itemApi';

interface POSItemSearchProps {
  onSelectItem: (item: Item) => void;
  productInputRef?: React.RefObject<HTMLInputElement | null>;
  genericInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const POSItemSearch: React.FC<POSItemSearchProps> = ({
  onSelectItem,
  productInputRef,
  genericInputRef,
}) => {
  const [productQuery, setProductQuery] = useState('');
  const [genericQuery, setGenericQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hasProduct = !!productQuery.trim();
    const hasGeneric = !!genericQuery.trim();

    if (!hasProduct && !hasGeneric) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchItems({
          productName: hasProduct ? productQuery.trim() : undefined,
          genericName: hasGeneric ? genericQuery.trim() : undefined,
          limit: 15,
        });
        setResults(res.items);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [productQuery, genericQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        onSelectItem(results[selectedIndex]);
        setProductQuery('');
        setGenericQuery('');
        setResults([]);
      }
    } else if (e.key === 'Escape') {
      setResults([]);
    }
  };

  const handleClearAll = () => {
    setProductQuery('');
    setGenericQuery('');
    setResults([]);
  };

  return (
    <div className="relative w-full">
      {/* Dual Search Bars in Clean Dashboard Pill Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Search Bar 1: Product / Brand Name */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            ref={productInputRef}
            type="text"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search brand, barcode (F2)..."
            className="w-full bg-[#F3F7F6] border-none text-xs rounded-full py-2.5 pl-9 pr-14 focus:ring-1 focus:ring-[#002F34] focus:bg-white text-[#002F34] placeholder-slate-400 font-medium transition-all"
          />

          <div className="absolute right-2.5 flex items-center gap-1">
            {productQuery && (
              <button
                type="button"
                onClick={() => setProductQuery('')}
                className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-[9px] font-bold"
              >
                ✕
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#002F34] bg-white border border-slate-200 rounded-md">
              F2
            </kbd>
          </div>
        </div>

        {/* Search Bar 2: Generic Formulation */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          <input
            ref={genericInputRef}
            type="text"
            value={genericQuery}
            onChange={(e) => setGenericQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search generic formula (F3)..."
            className="w-full bg-[#F3F7F6] border-none text-xs rounded-full py-2.5 pl-9 pr-14 focus:ring-1 focus:ring-[#002F34] focus:bg-white text-[#002F34] placeholder-slate-400 font-medium transition-all"
          />

          <div className="absolute right-2.5 flex items-center gap-1">
            {genericQuery && (
              <button
                type="button"
                onClick={() => setGenericQuery('')}
                className="w-4 h-4 rounded-full bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-[9px] font-bold"
              >
                ✕
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#002F34] bg-white border border-slate-200 rounded-md">
              F3
            </kbd>
          </div>
        </div>
      </div>

      {/* Loading & Typeahead Dropdown */}
      {(results.length > 0 || searching) && (
        <div
          ref={dropdownRef}
          className="absolute top-12 left-0 right-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar"
        >
          <div className="px-4 py-2 bg-[#F8FAF9] border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span>Results ({results.length} found)</span>
              {searching && (
                <div className="w-3.5 h-3.5 border-2 border-[#00A887] border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">Use ↑↓ to navigate · Enter to select</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] text-rose-600 hover:underline font-bold"
              >
                Clear
              </button>
            </div>
          </div>

          {results.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const pcsPerStrip = item.unitHierarchy?.piecesPerStrip || 1;
            const stripsPerBox = item.unitHierarchy?.stripsPerBox || 1;
            const totalPcs = pcsPerStrip * stripsPerBox;
            const isOutOfStock = (item.totalSellablePieces || 0) <= 0;
            const isLowStock =
              (item.totalSellablePieces || 0) > 0 &&
              (item.totalSellablePieces || 0) <= (item.lowStockThresholdPieces || 20);

            return (
              <div
                key={item._id}
                onClick={() => {
                  onSelectItem(item);
                  handleClearAll();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-[#E7F6F3] border-l-4 border-[#002F34]' : 'hover:bg-[#F8FAF9]'
                } ${isOutOfStock ? 'opacity-60 bg-gray-50/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      isSelected
                        ? 'bg-[#002F34] text-white'
                        : 'bg-[#97D8D0]/30 text-[#002F34] border border-[#97D8D0]/50'
                    }`}
                  >
                    {item.category ? item.category.slice(0, 2).toUpperCase() : 'MD'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#002F34]">{item.tradeName}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({item.genericName})
                      </span>
                      {item.shelfLocation && (
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-mono text-slate-600 font-semibold">
                          Rack: {item.shelfLocation}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{item.manufacturer}</span>
                      <span>•</span>
                      <span>
                        {pcsPerStrip} pcs/strip · {stripsPerBox} strips/box ({totalPcs} pcs total)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0 pl-3">
                  <span className="text-sm font-mono font-bold text-[#002F34]">
                    ৳ {parseFloat(item.mrpPerPiece.toString()).toFixed(2)}{' '}
                    <span className="text-[11px] font-normal text-slate-400">/ pc</span>
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        {item.totalSellablePieces} pcs (Low)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {item.totalSellablePieces} in stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
