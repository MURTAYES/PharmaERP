import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Item } from '../../types';
import { searchItems } from '../../services/itemApi';
import { receiveBatch } from '../../services/batchApi';
import { getSettings } from '../../services/settingsApi';
import { useAuth } from '../../context/AuthContext';

interface StockReceivingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedItem?: Item | null;
}

export const StockReceivingModal: React.FC<StockReceivingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedItem,
}) => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searching, setSearching] = useState(false);

  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}`;
  });
  const [unit, setUnit] = useState<'box' | 'piece'>('box');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [brandName, setBrandName] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load configured brands from settings
  useEffect(() => {
    getSettings()
      .then((res: any) => {
        const brandList = res.settings?.brands || res.brands || [];
        const defaultBrands = [
          'Square Pharmaceuticals',
          'Beximco Pharma',
          'Incepta Pharmaceuticals',
          'Renata Limited',
          'Opsonin Pharma',
          'ACME Laboratories',
          'Eskayef Pharmaceuticals',
          'Aristopharma',
          'ACI Limited',
          'Healthcare Pharmaceuticals',
          'Popular Pharmaceuticals',
          'Radiant Pharmaceuticals',
        ];
        const combined = Array.from(new Set([...brandList, ...defaultBrands]));
        setBrands(combined);
      })
      .catch(() => {
        setBrands([
          'Square Pharmaceuticals',
          'Beximco Pharma',
          'Incepta Pharmaceuticals',
          'Renata Limited',
          'Opsonin Pharma',
        ]);
      });
  }, []);

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItem(preselectedItem);
      setSearchQuery(`${preselectedItem.tradeName} (${preselectedItem.genericName})`);
      const itemBrand = preselectedItem.brandName || preselectedItem.manufacturer || '';
      if (itemBrand) {
        setBrandName(itemBrand);
        setIsCustomBrand(!brands.includes(itemBrand));
        setCustomBrand(itemBrand);
      }
    } else {
      setSelectedItem(null);
      setSearchQuery('');
    }
    setBatchNumber('');
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    setExpiryDate(`${d.getFullYear()}-${month}`);
    setUnit('box');
    setQuantity('1');
    setPurchasePrice('');
    setBarcode('');
    setQrCode('');
    setError(null);
    setSuccessMsg(null);
  }, [preselectedItem, isOpen]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Handle search query with debounce
  useEffect(() => {
    if (!searchQuery.trim() || selectedItem) {
      setSearchResults([]);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchItems(searchQuery, 8);
        setSearchResults(res.items);
        setSelectedIndex(0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedItem]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < searchResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = searchResults[selectedIndex];
      if (chosen) {
        setSelectedItem(chosen);
        setSearchQuery(`${chosen.tradeName} (${chosen.genericName})`);
        setSearchResults([]);
      }
    } else if (e.key === 'Escape') {
      setSearchResults([]);
    }
  };

  // When selectedItem changes, update brand default
  useEffect(() => {
    if (selectedItem) {
      const itemBrand = selectedItem.brandName || selectedItem.manufacturer || '';
      if (itemBrand) {
        if (brands.includes(itemBrand)) {
          setBrandName(itemBrand);
          setIsCustomBrand(false);
        } else {
          setIsCustomBrand(true);
          setCustomBrand(itemBrand);
          setBrandName('__custom');
        }
      } else if (brands.length > 0 && !brandName) {
        setBrandName(brands[0]);
      }
    }
  }, [selectedItem, brands]);

  // Calculate total converted pieces (Box contains piecesPerBox, Piece is 1)
  let totalCalculatedPieces = 0;
  let estimatedCostPerPiece = '';

  if (selectedItem) {
    const pcsPerBox =
      selectedItem.unitHierarchy?.piecesPerBox ||
      selectedItem.totalPiecesPerBox ||
      (selectedItem.unitHierarchy?.piecesPerStrip && selectedItem.unitHierarchy?.stripsPerBox
        ? selectedItem.unitHierarchy.piecesPerStrip * selectedItem.unitHierarchy.stripsPerBox
        : 10);
    const qtyInt = parseInt(quantity, 10) || 0;

    if (unit === 'piece') totalCalculatedPieces = qtyInt;
    else if (unit === 'box') totalCalculatedPieces = qtyInt * pcsPerBox;

    if (isOwner && purchasePrice && qtyInt > 0) {
      try {
        const priceDec = new Decimal(purchasePrice);
        let costPerPiece = priceDec;
        if (unit === 'box') costPerPiece = priceDec.dividedBy(pcsPerBox);
        estimatedCostPerPiece = costPerPiece.toFixed(2);
      } catch {}
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setError('Please select a medicine first');
      return;
    }

    const qtyInt = parseInt(quantity, 10);
    if (!qtyInt || qtyInt <= 0) {
      setError('Quantity must be a positive whole number (e.g. 1, 2, 5)');
      return;
    }

    if (!expiryDate) {
      setError('Please select an expiry date');
      return;
    }

    const finalBrand = (isCustomBrand ? customBrand : brandName || customBrand || '').trim();

    setError(null);
    setLoading(true);

    try {
      const res = await receiveBatch({
        itemId: selectedItem._id,
        batchNumber: batchNumber.trim().toUpperCase(),
        expiryDate: expiryDate.trim(),
        unit,
        quantity: qtyInt,
        purchasePrice: isOwner && purchasePrice ? purchasePrice : undefined,
        brandName: finalBrand,
        supplierName: finalBrand,
        barcode: barcode.trim() || undefined,
        qrCode: qrCode.trim() || undefined,
      });

      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 900);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to receive batch');
    } finally {
      setLoading(false);
    }
  };

  const pcsInBox = selectedItem
    ? selectedItem.unitHierarchy?.piecesPerBox ||
      selectedItem.totalPiecesPerBox ||
      (selectedItem.unitHierarchy?.piecesPerStrip && selectedItem.unitHierarchy?.stripsPerBox
        ? selectedItem.unitHierarchy.piecesPerStrip * selectedItem.unitHierarchy.stripsPerBox
        : 10)
    : 10;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Receiving & Batch Ingestion" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {error && (
          <div className="p-3 bg-error-container text-on-error-container text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-100 text-emerald-900 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-emerald-700">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Item Selector / Typeahead */}
        <div className="relative flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Select Medicine <span className="text-primary font-bold">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by trade name, generic name, barcode, or code (↑↓ Enter)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedItem) setSelectedItem(null);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full h-11 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:bg-white focus:border-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 transition-all shadow-sm"
              required
            />
            {searching && (
              <span className="absolute right-3.5 top-3 text-slate-400 animate-spin material-symbols-outlined text-[20px]">
                progress_activity
              </span>
            )}
            {selectedItem && (
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null);
                  setSearchQuery('');
                }}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}

            {/* Autocomplete Dropdown with Solid Background & High Z-Index */}
            {searchResults.length > 0 && !selectedItem && (
              <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex justify-between items-center">
                  <span>Matches ({searchResults.length})</span>
                  <span>Use ↑↓ to navigate · Enter to select</span>
                </div>
                {searchResults.map((item, idx) => {
                  const isHighlighted = idx === selectedIndex;
                  return (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => {
                        setSelectedItem(item);
                        setSearchQuery(`${item.tradeName} (${item.genericName})`);
                        setSearchResults([]);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-[#E7F6F3] dark:bg-teal-950/40 text-[#002F34] dark:text-teal-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div>
                        <span className="text-sm font-bold">{item.tradeName}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({item.genericName})</span>
                        {item.brandName && (
                          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 px-2 py-0.5 rounded-full ml-2 font-medium">
                            {item.brandName}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-[#006059] dark:text-teal-400">
                        ৳ {parseFloat(item.mrpPerPiece.toString() || '0').toFixed(2)} / pc
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Item Information Chip */}
        {selectedItem && (
          <div className="p-3 bg-primary-container/10 border border-primary/20 rounded-xl text-xs flex items-center justify-between text-primary font-sans">
            <div>
              <span className="font-bold">{selectedItem.tradeName}</span> —{' '}
              <span className="text-on-surface-variant">
                1 Box = {pcsInBox} Pieces · Counter Sale: Piece (pc)
              </span>
            </div>
            <span className="font-mono font-bold bg-surface-container-lowest px-2.5 py-1 rounded-lg border border-primary/20">
              MRP: ৳ {selectedItem.mrpPerPiece} / pc
            </span>
          </div>
        )}

        {/* Batch Number and Expiry Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Batch Number"
            placeholder="e.g. B2049, SEC-88"
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Expiry Month & Year <span className="text-primary font-bold">*</span>
            </label>
            <input
              type="month"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full h-11 px-4 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono cursor-pointer"
              required
            />
            <span className="text-[11px] text-on-surface-variant">
              Resolves to last calendar day of the month
            </span>
          </div>
        </div>

        {/* Receiving Unit (Box or Piece) & Quantity */}
        <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Receiving Unit & Quantity
            </span>
            {totalCalculatedPieces > 0 && (
              <span className="text-xs font-mono font-bold text-primary bg-primary-container/15 px-3 py-1 rounded-lg border border-primary/20">
                Total Sellable Stock: {totalCalculatedPieces} Pieces
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Receiving Unit
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['box', 'piece'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all capitalize cursor-pointer flex items-center justify-center gap-1.5 ${
                      unit === u
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {u === 'box' ? 'inventory_2' : 'medication'}
                    </span>
                    <span>{u === 'box' ? `Box (${pcsInBox} pcs)` : 'Piece (Single)'}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label={`Quantity in ${unit}s (Whole Number)`}
              type="number"
              step="1"
              min="1"
              value={quantity}
              onKeyDown={(e) => {
                if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '-') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setQuantity(val);
              }}
              required
            />
          </div>
        </div>

        {/* Brand Name Dropdown & Purchase Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brand Name Dropdown */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Brand Name <span className="text-primary font-bold">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomBrand(!isCustomBrand);
                  if (!isCustomBrand) setBrandName('__custom');
                  else setBrandName(brands[0] || '');
                }}
                className="text-[10px] font-semibold text-primary hover:underline"
              >
                {isCustomBrand ? 'Select from list' : '+ Custom brand'}
              </button>
            </div>
            {isCustomBrand ? (
              <input
                type="text"
                placeholder="Enter brand name..."
                value={customBrand}
                onChange={(e) => setCustomBrand(e.target.value)}
                className="w-full h-11 px-4 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            ) : (
              <select
                value={brandName}
                onChange={(e) => {
                  if (e.target.value === '__custom') {
                    setIsCustomBrand(true);
                  } else {
                    setBrandName(e.target.value);
                  }
                }}
                className="w-full h-11 px-4 bg-surface-container-low border border-transparent rounded-xl text-on-surface text-sm focus:bg-surface-container-lowest focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="__custom">+ Custom brand...</option>
              </select>
            )}
          </div>

          {/* Purchase Cost (Owner Only) */}
          {isOwner ? (
            <Input
              label={`Purchase Cost (৳) [Per ${unit}]`}
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 800.00"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              helperText={
                estimatedCostPerPiece
                  ? `Effective Unit Cost: ৳ ${estimatedCostPerPiece} / piece`
                  : 'Leave empty to mark batch as cost-missing'
              }
            />
          ) : (
            <div className="p-3 bg-surface-container-low border border-surface-container rounded-xl text-xs text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">info</span>
              Pharmacist receiving: purchase price flagged as cost-missing for owner review.
            </div>
          )}
        </div>

        {/* Barcode and QR Code for Batch (Optional) */}
        <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">barcode_scanner</span>
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Batch Barcode & QR Code (Optional)
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant">
            If this batch has its own barcode, enter or scan it below. It will automatically link to the medicine so scanning it at the counter matches this product.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <Input
              label="Batch Barcode"
              placeholder="Scan or enter barcode..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            <Input
              label="Batch QR Code"
              placeholder="Scan or enter QR code string..."
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-surface-container">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading} disabled={!selectedItem}>
            Receive Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
};
