import React, { useState, useEffect, useRef } from 'react';
import { Item } from '../../types';
import { searchItems } from '../../services/itemApi';

interface POSItemSearchProps {
  onSelectItem: (item: Item) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const POSItemSearch: React.FC<POSItemSearchProps> = ({ onSelectItem, inputRef }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchItems(query, 12);
        setResults(res.items);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

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
        setQuery('');
        setResults([]);
      }
    } else if (e.key === 'Escape') {
      setResults([]);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        {/* Search Icon */}
        <div className="absolute left-4.5 flex items-center pointer-events-none text-[#002F34]">
          <svg className="w-5 h-5 text-[#006059]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or search medicine by brand, generic, or SKU (Press 'F2' or '/' to focus)..."
          className="w-full h-14 pl-12 pr-32 bg-white border border-[#D5E3DE] hover:border-[#97D8D0] focus:border-[#002F34] rounded-2xl text-[#002F34] text-sm font-semibold placeholder:text-[#8AA6A1] focus:outline-none focus:ring-4 focus:ring-[#002F34]/10 transition-all shadow-xs"
        />

        {/* Right Badges & Indicators */}
        <div className="absolute right-3.5 flex items-center gap-2">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="w-6 h-6 rounded-full bg-[#E8F0ED] hover:bg-[#D5E3DE] text-[#5F7D7A] flex items-center justify-center transition-colors text-xs font-bold"
            >
              ✕
            </button>
          )}

          {searching && (
            <div className="w-5 h-5 border-2 border-[#00A887] border-t-transparent rounded-full animate-spin"></div>
          )}

          <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono font-bold text-[#004D40] bg-[#E7F6F3] border border-[#C5E8E0] rounded-xl">
            <span>F2</span>
            <span className="text-[#8AA6A1]">/</span>
            <span>↵ Enter</span>
          </div>
        </div>
      </div>

      {/* Typeahead Suggestions Dropdown */}
      {results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-16 left-0 right-0 z-50 bg-white border border-[#D5E3DE] rounded-2xl shadow-xl overflow-hidden divide-y divide-[#EEF3F2] max-h-96 overflow-y-auto custom-scrollbar"
        >
          <div className="px-4 py-2 bg-[#F8FAF9] border-b border-[#E8EFEA] flex items-center justify-between text-[11px] font-bold text-[#5F7D7A] uppercase tracking-wider">
            <span>Search Results ({results.length} found)</span>
            <span className="text-[10px] text-[#8AA6A1] font-normal">Use ↑↓ arrows to navigate, Enter to select</span>
          </div>

          {results.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const pcsPerStrip = item.unitHierarchy?.piecesPerStrip || 1;
            const stripsPerBox = item.unitHierarchy?.stripsPerBox || 1;
            const totalPcs = pcsPerStrip * stripsPerBox;
            const isOutOfStock = (item.totalSellablePieces || 0) <= 0;
            const isLowStock = (item.totalSellablePieces || 0) > 0 && (item.totalSellablePieces || 0) <= (item.lowStockThresholdPieces || 20);

            return (
              <div
                key={item._id}
                onClick={() => {
                  onSelectItem(item);
                  setQuery('');
                  setResults([]);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-[#F0FAF7] border-l-4 border-[#00A887]' : 'hover:bg-[#F8FAF9]'
                } ${isOutOfStock ? 'opacity-60 bg-gray-50/50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                    isSelected ? 'bg-[#002F34] text-white' : 'bg-[#E7F6F3] text-[#004D40] border border-[#C5E8E0]'
                  }`}>
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
                    ৳ {parseFloat(item.mrpPerPiece.toString()).toFixed(2)} <span className="text-[11px] font-normal text-[#7A9894]">/ pc</span>
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
