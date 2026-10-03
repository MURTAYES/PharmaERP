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
        const res = await searchItems(query, 10);
        setResults(res.items);
        setSelectedIndex(0);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 150);

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
        <span className="material-symbols-outlined absolute left-4.5 text-primary text-[24px] pointer-events-none">
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or type medicine name / generic / code (Press 'F2' or '/' to focus)..."
          className="w-full h-15 pl-13 pr-32 bg-white border-2 border-teal-100 hover:border-primary/40 focus:border-primary rounded-3xl text-slate-900 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all shadow-card"
        />
        <div className="absolute right-3.5 flex items-center gap-2">
          {searching && (
            <span className="animate-spin material-symbols-outlined text-[20px] text-primary">
              progress_activity
            </span>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2.5 py-1 text-[11px] font-mono font-extrabold text-primary-800 bg-teal-50 border border-teal-200 rounded-xl">
            F2 / Enter
          </kbd>
        </div>
      </div>

      {/* Typeahead Suggestions Dropdown */}
      {results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-17 left-0 right-0 z-50 bg-white border border-teal-100 rounded-3xl shadow-2xl overflow-hidden divide-y divide-slate-100 max-h-96 overflow-y-auto"
        >
          {results.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const pcsPerStrip = item.unitHierarchy?.piecesPerStrip || 1;
            const stripsPerBox = item.unitHierarchy?.stripsPerBox || 1;
            const totalPcs = pcsPerStrip * stripsPerBox;
            const isOutOfStock = (item.totalSellablePieces || 0) <= 0;

            return (
              <div
                key={item._id}
                onClick={() => {
                  onSelectItem(item);
                  setQuery('');
                  setResults([]);
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`px-5 py-3.5 cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-teal-50/80 font-bold' : 'hover:bg-slate-50'
                } ${isOutOfStock ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200/80 text-primary flex items-center justify-center font-black text-xs shadow-xs">
                    {item.tradeName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{item.tradeName}</span>
                      <span className="text-xs text-slate-500 font-medium">
                        ({item.genericName})
                      </span>
                      {item.shelfLocation && (
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600 font-bold">
                          Rack: {item.shelfLocation}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{item.manufacturer}</span>
                      <span>•</span>
                      <span>
                        {pcsPerStrip} pcs/strip, {stripsPerBox} strips/box ({totalPcs} pcs/box)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-sm font-mono font-black text-slate-900">
                    ৳ {parseFloat(item.mrpPerPiece).toFixed(2)} <span className="text-xs font-medium text-slate-400">/ pc</span>
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isOutOfStock ? (
                      <span className="text-[10px] font-extrabold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        {item.totalSellablePieces} pcs in stock
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
