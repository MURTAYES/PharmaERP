import React, { useState, useEffect, useRef } from 'react';
import Decimal from 'decimal.js';
import { Item } from '../../types';
import { searchItems, lookupBarcode } from '../../services/itemApi';
import { receiveBatch } from '../../services/batchApi';
import { getSettings } from '../../services/settingsApi';
import { useAuth } from '../../context/AuthContext';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';

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

  const batchNumberRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
          'ACME Laboratories',
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

  // Handle medicine search query with debounce
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
    }, 180);

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

  // When selectedItem changes, update brand default from brands list
  useEffect(() => {
    if (selectedItem) {
      const itemBrand = selectedItem.brandName || selectedItem.manufacturer || '';
      if (itemBrand && brands.includes(itemBrand)) {
        setBrandName(itemBrand);
      } else if (brands.length > 0 && !brandName) {
        setBrandName(brands[0]);
      }
    }
  }, [selectedItem, brands]);

  // Scanner integration for Stock Receiving
  useBarcodeScanner({
    onScan: async (code) => {
      try {
        const res = await lookupBarcode(code);
        if (res.matched && res.item) {
          setSelectedItem(res.item);
          setSearchQuery(`${res.item.tradeName} (${res.item.genericName})`);
          setSearchResults([]);
          const itemBrand = res.item.brandName || res.item.manufacturer || '';
          if (itemBrand) {
            setBrandName(itemBrand);
          }
          if (!barcode) {
            setBarcode(code);
          }
          setError(null);
          // Jump focus to Batch Number input
          setTimeout(() => {
            batchNumberRef.current?.focus();
            batchNumberRef.current?.select();
          }, 60);
        } else {
          setError(`Barcode "${code}" not found in master catalog. Please select or add the product first.`);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Error looking up scanned barcode');
      }
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Calculate total converted pieces
  const pcsPerBox =
    selectedItem?.unitHierarchy?.piecesPerBox ||
    selectedItem?.totalPiecesPerBox ||
    (selectedItem?.unitHierarchy?.piecesPerStrip && selectedItem?.unitHierarchy?.stripsPerBox
      ? selectedItem.unitHierarchy.piecesPerStrip * selectedItem.unitHierarchy.stripsPerBox
      : 10);

  const qtyInt = parseInt(quantity, 10) || 0;
  let totalCalculatedPieces = 0;
  if (unit === 'piece') totalCalculatedPieces = qtyInt;
  else if (unit === 'box') totalCalculatedPieces = qtyInt * pcsPerBox;

  let estimatedCostPerPiece = '';
  if (isOwner && purchasePrice && qtyInt > 0) {
    try {
      const priceDec = new Decimal(purchasePrice);
      let costPerPiece = priceDec;
      if (unit === 'box') costPerPiece = priceDec.dividedBy(pcsPerBox);
      estimatedCostPerPiece = costPerPiece.toFixed(2);
    } catch {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setError('Please search and select a medicine product first.');
      return;
    }

    if (!batchNumber.trim()) {
      setError('Please provide a batch number (e.g. B2049, SEC-88).');
      return;
    }

    if (!expiryDate) {
      setError('Please select an expiry month and year.');
      return;
    }

    if (!qtyInt || qtyInt <= 0) {
      setError('Quantity must be a positive whole number.');
      return;
    }

    const finalBrand = (brandName || brands[0] || 'Square Pharmaceuticals').trim();

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

      setSuccessMsg(res.message || 'Stock successfully ingested into inventory');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to receive batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#002F34]/40 backdrop-blur-[6px] z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 text-[#0F2327] animate-fadeIn">
      {/* Clean Modal Card Container */}
      <div className="relative w-full max-w-[760px] max-h-[92vh] flex flex-col bg-white rounded-[28px] shadow-2xl border border-white/80 overflow-hidden z-10 transition-all">
        {/* Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-5 bg-white border-b border-[#E8F0ED] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#002F34] flex items-center justify-center text-white shadow-md shadow-[#002F34]/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#002F34] tracking-tight leading-snug">
                Stock Receiving & Batch Ingestion
              </h2>
              <p className="text-xs text-[#5F7D7A] font-medium tracking-normal mt-0.5">
                Ingest shipment stock with batch expiry tracking and packaging ratio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F2F7F5] transition-colors border border-transparent hover:border-[#E2EBE8] cursor-pointer"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-5 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Medicine Selection */}
          <div>
            <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="medicineSearch">
              Select Medicine Product <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="medicineSearch"
                type="text"
                placeholder="Search by trade name, generic, barcode or code (↑↓ Enter)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedItem) setSelectedItem(null);
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                required
              />
              {searching && (
                <div className="absolute right-3.5 top-3 w-4 h-4 border-2 border-[#002F34]/20 border-t-[#002F34] rounded-full animate-spin" />
              )}
              {selectedItem && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItem(null);
                    setSearchQuery('');
                  }}
                  className="absolute right-3.5 top-2.5 text-[#7A9894] hover:text-[#002F34] p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Typeahead Dropdown */}
              {searchResults.length > 0 && !selectedItem && (
                <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white border border-[#DCE6E2] rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-[#F0F5F3]">
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
                        className={`w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors cursor-pointer ${
                          isHighlighted ? 'bg-[#E7F6F3] text-[#002F34]' : 'hover:bg-[#F8FAF9] text-slate-800'
                        }`}
                      >
                        <div>
                          <span className="text-sm font-bold text-[#002F34]">{item.tradeName}</span>
                          <span className="text-xs text-[#5F7D7A] ml-2 font-medium">({item.genericName})</span>
                          {item.brandName && (
                            <span className="text-[10px] text-[#006059] bg-[#E7F6F3] px-2 py-0.5 rounded-full ml-2 font-semibold">
                              {item.brandName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-[#006059]">
                          ৳ {parseFloat(item.mrpPerPiece.toString() || '0').toFixed(2)} / pc
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Medicine Detail Card */}
            {selectedItem && (
              <div className="mt-2.5 px-4 py-3 bg-[#F2F8F6] border border-[#D4E8E3] rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#002F34]">{selectedItem.tradeName}</span>
                  <span className="text-[#5F7D7A]">·</span>
                  <span className="text-[#006059] font-medium">1 Box = {pcsPerBox} Pieces</span>
                  <span className="text-[#5F7D7A]">·</span>
                  <span className="text-[#5F7D7A]">Sold by piece</span>
                </div>
                <div className="font-mono font-bold text-[#002F34] bg-white px-2.5 py-1 rounded-xl border border-[#DCE6E2]">
                  MRP: ৳ {parseFloat(selectedItem.mrpPerPiece.toString() || '0').toFixed(2)} / pc
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Batch Number & Expiry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="batchNumber">
                Batch Number <span className="text-rose-500">*</span>
              </label>
              <input
                ref={batchNumberRef}
                id="batchNumber"
                type="text"
                placeholder="e.g. B2049, SEC-88"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] uppercase placeholder:normal-case placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="expiryDate">
                Expiry Month & Year <span className="text-rose-500">*</span>
              </label>
              <input
                id="expiryDate"
                type="month"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all font-mono cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Section 3: Receiving Unit & Quantity */}
          <div className="p-4 bg-[#F8FAF9] rounded-2xl border border-[#E2EBE8] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#002F34] uppercase tracking-wide">
                Receiving Unit & Quantity
              </span>
              {totalCalculatedPieces > 0 && (
                <span className="text-xs font-mono font-bold text-[#006059] bg-[#E7F6F3] px-3 py-1 rounded-full border border-[#C5E8E0]">
                  Total Ingestion: {totalCalculatedPieces} Pieces
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5F7D7A] mb-1.5">
                  Shipment Receiving Unit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['box', 'piece'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        unit === u
                          ? 'bg-[#002F34] text-white border-[#002F34] shadow-sm'
                          : 'bg-white text-[#5F7D7A] border-[#DCE6E2] hover:bg-slate-50'
                      }`}
                    >
                      <span>{u === 'box' ? `Box (${pcsPerBox} pcs)` : 'Piece (Single)'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F7D7A] mb-1.5" htmlFor="quantityInput">
                  Quantity ({unit === 'box' ? 'Boxes' : 'Pieces'})
                </label>
                <input
                  id="quantityInput"
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
                  className="w-full px-4 py-2 bg-white border border-[#DCE6E2] rounded-xl text-sm font-semibold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 4: Brand Selection (Owner Brands Only) & Purchase Cost */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="brandSelectReceive">
                Brand Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="brandSelectReceive"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] appearance-none cursor-pointer pr-10"
                >
                  {brands.length === 0 ? (
                    <option value="">No brands found (Add in Settings)</option>
                  ) : (
                    brands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#7A9894]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Purchase Cost (Owner Only) */}
            {isOwner ? (
              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="purchasePrice">
                  Purchase Cost (৳) [Per {unit}]
                </label>
                <input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 800.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all font-mono"
                />
                {estimatedCostPerPiece && (
                  <p className="text-[11px] text-[#006059] font-medium mt-1">
                    Effective Unit Cost: ৳ {estimatedCostPerPiece} / piece
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center p-3 bg-[#F8FAF9] border border-[#E2EBE8] rounded-2xl text-xs text-[#5F7D7A]">
                Pharmacist receiving: purchase price logged as cost-missing for Owner review.
              </div>
            )}
          </div>

          {/* Section 5: Batch Barcode & QR Code (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5F7D7A] mb-1.5" htmlFor="batchBarcode">
                Batch Barcode (Optional)
              </label>
              <input
                id="batchBarcode"
                type="text"
                placeholder="Scan or enter barcode..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F7D7A] mb-1.5" htmlFor="batchQrCode">
                Batch QR Code (Optional)
              </label>
              <input
                id="batchQrCode"
                type="text"
                placeholder="Scan or enter QR code string..."
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8F0ED]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F2F7F5] transition-colors border border-[#DCE6E2] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedItem}
              className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#002F34] hover:bg-[#00424a] transition-all shadow-md shadow-[#002F34]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>Receive Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
