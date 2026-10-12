import React, { useState, useEffect } from 'react';
import { searchItems, updateItem } from '../../services/itemApi';
import { Item } from '../../types';

interface UnknownBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedCode: string;
  onOpenAddProductWithBarcode?: (barcode: string) => void;
  onLinkedSuccess?: (item: Item) => void;
}

export const UnknownBarcodeModal: React.FC<UnknownBarcodeModalProps> = ({
  isOpen,
  onClose,
  scannedCode,
  onOpenAddProductWithBarcode,
  onLinkedSuccess,
}) => {
  const [mode, setMode] = useState<'prompt' | 'link'>('prompt');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('prompt');
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
    }
  }, [isOpen, scannedCode]);

  // Live item search for linking
  useEffect(() => {
    if (mode !== 'link') return;
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchItems(q, 8);
        setSearchResults(res.items);
      } catch (err: any) {
        setError('Failed to search items');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  const handleLinkToItem = async (targetItem: Item) => {
    setLinking(true);
    setError(null);
    try {
      const existingBarcodes = targetItem.barcodes || [];
      if (!existingBarcodes.includes(scannedCode)) {
        const updatedBarcodes = [...existingBarcodes, scannedCode];
        const res = await updateItem(targetItem._id, { barcodes: updatedBarcodes });
        if (onLinkedSuccess) {
          onLinkedSuccess(res.item);
        }
      } else {
        if (onLinkedSuccess) {
          onLinkedSuccess(targetItem);
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to link barcode');
    } finally {
      setLinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#002F34]/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#002F34]">Unrecognized Barcode</h2>
              <p className="text-[11px] text-slate-400">Code is not currently registered in catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scanned Code Pill */}
        <div className="p-4 bg-[#F8FAF9] border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Scanned Code
            </span>
            <span className="text-sm font-mono font-bold text-[#002F34]">{scannedCode}</span>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Unassigned
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Prompt Mode */}
        {mode === 'prompt' && (
          <div className="p-6 space-y-3">
            <p className="text-xs text-slate-600 font-medium">
              Would you like to associate this barcode with an existing medicine, or register it as a new master product?
            </p>

            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMode('link')}
                className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-[#002F34] bg-white hover:bg-[#F8FAF9] text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E7F6F3] text-[#006059] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">link</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#002F34]">Link to Existing Medicine</h4>
                    <p className="text-[10px] text-slate-400">Search catalog and attach this barcode</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-slate-300 group-hover:text-[#002F34] transition-colors">
                  arrow_forward
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenAddProductWithBarcode) {
                    onOpenAddProductWithBarcode(scannedCode);
                  }
                  onClose();
                }}
                className="w-full p-3.5 rounded-2xl border border-[#002F34] bg-[#002F34] text-white text-left flex items-center justify-between transition-all cursor-pointer shadow-sm group hover:bg-[#073D43]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">add_box</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Add New Master Product</h4>
                    <p className="text-[10px] text-white/70">Create new item with this barcode</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[18px] text-white/70 group-hover:text-white transition-colors">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Link to Existing Item Search Mode */}
        {mode === 'link' && (
          <div className="p-6 space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#002F34]">Find Existing Product</span>
              <button
                type="button"
                onClick={() => setMode('prompt')}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ← Back
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Type medicine name or generic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAF9] focus:bg-white border border-slate-200 focus:border-[#002F34] rounded-xl text-xs font-semibold text-[#002F34] focus:outline-none"
              />
              {loading && (
                <span className="absolute right-3 top-3 text-[10px] text-slate-400">Searching...</span>
              )}
            </div>

            {/* Search list */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {searchResults.length === 0 && searchQuery.trim() && !loading && (
                <div className="p-4 text-center text-xs text-slate-400">No matching products found</div>
              )}

              {searchResults.map((item) => (
                <div
                  key={item._id}
                  onClick={() => !linking && handleLinkToItem(item)}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#002F34] hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-bold text-[#002F34] block">{item.tradeName}</span>
                    <span className="text-[10px] text-slate-400">{item.genericName} • {item.brandName || item.manufacturer}</span>
                  </div>
                  <button
                    type="button"
                    disabled={linking}
                    className="px-2.5 py-1 text-[11px] font-bold text-[#006059] bg-[#E7F6F3] rounded-lg hover:bg-[#D5EFEA]"
                  >
                    {linking ? 'Linking...' : 'Attach'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
