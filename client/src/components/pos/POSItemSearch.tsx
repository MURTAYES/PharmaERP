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
        const res = await searchItems(
          {
            productName: hasProduct ? productQuery.trim() : undefined,
            genericName: hasGeneric ? genericQuery.trim() : undefined,
            limit: 15,
          }
        );
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
      {/* Dual Search Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Search Bar 1: Product / Brand Name */}
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center pointer-events-none text-[#006059]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <input
            ref={productInputRef}
            type="text"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Scan barcode or Product Name (F2)..."
            className="w-full h-13 pl-11 pr-20 bg-white border border-[#D5E3DE] hover:border-[#97D8D0] focus:border-[#002F34] rounded-2xl text-[#002F34] text-xs sm:text-sm font-semibold placeholder:text-[#8AA6A1] focus:outline-none focus:ring-4 focus:ring-[#002F34]/10 transition-all shadow-xs"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {productQuery && (
              <button
                type="button"
                onClick={() => setProductQuery('')}
                className="w-5 h-5 rounded-full bg-[#E8F0ED] hover:bg-[#D5E3DE] text-[#5F7D7A] flex items-center justify-center transition-colors text-[10px] font-bold"
              >
                ✕
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold text-[#004D40] bg-[#E7F6F3] border border-[#C5E8E0] rounded-lg">
              F2
            </kbd>
          </div>
        </div>

        {/* Search Bar 2: Generic Formulation */}
        <div className="relative flex items-center">
          <div className="absolute left-4 flex items-center pointer-events-none text-[#006059]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>

          <input
            ref={genericInputRef}
            type="text"
            value={genericQuery}
            onChange={(e) => setGenericQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search Generic Formulation (F3)..."
            className="w-full h-13 pl-11 pr-20 bg-white border border-[#D5E3DE] hover:border-[#97D8D0] focus:border-[#002F34] rounded-2xl text-[#002F34] text-xs sm:text-sm font-semibold placeholder:text-[#8AA6A1] focus:outline-none focus:ring-4 focus:ring-[#002F34]/10 transition-all shadow-xs"
          />

          <div className="absolute right-3 flex items-center gap-1.5">
            {genericQuery && (
              <button
                type="button"
                onClick={() => setGenericQuery('')}
                className="w-5 h-5 rounded-full bg-[#E8F0ED] hover:bg-[#D5E3DE] text-[#5F7D7A] flex items-center justify-center transition-colors text-[10px] font-bold"
              >
                ✕
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold text-[#004D40] bg-[#E7F6F3] border border-[#C5E8E0] rounded-lg">
              F3
            </kbd>
          </div>
        </div>
      </div>

      {/* Loading & Typeahead Dropdown */}
      {(results.length > 0 || searching) && (
        <div
          ref={dropdownRef}
          className="absolute top-15 left-0 right-0 z-50 bg-white border border-[#D5E3DE] rounded-2xl shadow-2xl overflow-hidden divide-y divide-[#EEF3F2] max-h-96 overflow-y-auto custom-scrollbar"
        >
          <div className="px-4 py-2 bg-[#F8FAF9] border-b border-[#E8EFEA] flex items-center justify-between text-[11px] font-bold text-[#5F7D7A] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <span>Results ({results.length} found)</span>
              {searching && (
                <div className="w-3.5 h-3.5 border-2 border-[#00A887] border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#8AA6A1] font-normal hidden sm:inline">Use ↑↓ to navigate · Enter to select</span>
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
                  isSelected ? 'bg-[#F0FAF7] border-l-4 border-[#00A887]' : 'hover:bg-[#F8FAF9]'
                } ${isOutOfStock ? 'opacity-60 bg-gray-50/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                      isSelected
                        ? 'bg-[#002F34] text-white'
                        : 'bg-[#E7F6F3] text-[#004D40] border border-[#C5E8E0]'
                    }`}
                  >
                    {item.category ? item.category.slice(0, 2).toUpperCase() : 'MD'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#002F34]">{item.tradeName}</span>
                      <span className="text-xs text-[#5F7D7A] font-medium">
                        ({item.genericName})
                      </span>
                      {item.shelfLocation && (
                        <span className="text-[10px] bg-[#E8F0ED] px-2 py-0.5 rounded-full font-mono text-[#47635F] font-semibold border border-[#D5E3DE]">
                          {item.shelfLocation}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#7A9894] flex items-center gap-2 mt-0.5">
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
                    <span className="text-[11px] font-normal text-[#7A9894]">/ pc</span>
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
                      <span className="text-[10px] font-bold text-[#007062] bg-[#E7F6F3] border border-[#C5E8E0] px-2 py-0.5 rounded-full">
                        {item.totalSellablePieces} pcs available
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
