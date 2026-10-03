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
        <span className="material-symbols-outlined absolute left-4 text-primary text-[22px] pointer-events-none">
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or search medicine by Trade Name, Generic, Code (Press 'F2' or '/' to focus)..."
          className="w-full h-14 pl-12 pr-28 bg-surface-container-low border-2 border-primary/20 hover:border-primary/40 focus:border-primary focus:bg-surface-container-lowest rounded-2xl text-on-surface text-base placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all shadow-sm font-sans"
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {searching && (
            <span className="animate-spin material-symbols-outlined text-[20px] text-primary">
              progress_activity
            </span>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[11px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg">
            F2 / Enter
          </kbd>
        </div>
      </div>

      {/* Typeahead Suggestions Dropdown */}
      {results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-16 left-0 right-0 z-50 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden divide-y divide-surface-container max-h-96 overflow-y-auto"
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
                className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected ? 'bg-primary-container/15' : 'hover:bg-surface-container-low'
                } ${isOutOfStock ? 'opacity-70' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {item.tradeName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-on-surface">{item.tradeName}</span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        ({item.genericName})
                      </span>
                      {item.shelfLocation && (
                        <span className="text-[10px] bg-surface-container px-1.5 py-0.5 rounded font-mono text-on-surface-variant">
                          Rack: {item.shelfLocation}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <span>{item.manufacturer}</span>
                      <span>•</span>
                      <span>
                        {pcsPerStrip} pcs/strip, {stripsPerBox} strips/box ({totalPcs} pcs/box)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-sm font-mono font-bold text-primary">
                    ৳ {parseFloat(item.mrpPerPiece).toFixed(2)} / pc
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isOutOfStock ? (
                      <span className="text-[11px] font-bold text-error bg-error-container/40 px-2 py-0.5 rounded-md">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
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
