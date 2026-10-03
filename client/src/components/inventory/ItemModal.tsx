import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { Item } from '../../types';
import { createItem, updateItem } from '../../services/itemApi';
import { getSettings } from '../../services/settingsApi';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit?: Item | null;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  itemToEdit,
}) => {
  const [tradeName, setTradeName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Tablet');
  const [manufacturer, setManufacturer] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [piecesPerStrip, setPiecesPerStrip] = useState('10');
  const [stripsPerBox, setStripsPerBox] = useState('10');
  const [mrpPerPiece, setMrpPerPiece] = useState('2.50');
  const [lowStockThresholdPieces, setLowStockThresholdPieces] = useState('20');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then((res: any) => {
        const catList = res.settings?.categories || res.categories;
        if (catList && catList.length > 0) {
          setCategories(catList);
        } else {
          setCategories([
            'Tablet',
            'Capsule',
            'Syrup',
            'Suspension',
            'Injection',
            'Ointment',
            'Drops',
            'Inhaler',
            'Cream',
            'Gel',
            'Solution',
          ]);
        }
      })
      .catch(() => {
        setCategories([
          'Tablet',
          'Capsule',
          'Syrup',
          'Suspension',
          'Injection',
          'Ointment',
          'Drops',
          'Inhaler',
          'Cream',
          'Gel',
          'Solution',
        ]);
      });
  }, []);

  useEffect(() => {
    if (itemToEdit) {
      setTradeName(itemToEdit.tradeName);
      setGenericName(itemToEdit.genericName);
      setCategory(itemToEdit.category || 'Tablet');
      setManufacturer(itemToEdit.manufacturer || '');
      setShelfLocation(itemToEdit.shelfLocation || '');
      setItemCode(itemToEdit.itemCode || '');
      setPiecesPerStrip(String(itemToEdit.unitHierarchy?.piecesPerStrip || 10));
      setStripsPerBox(String(itemToEdit.unitHierarchy?.stripsPerBox || 10));
      setMrpPerPiece(String(itemToEdit.mrpPerPiece || '2.50'));
      setLowStockThresholdPieces(String(itemToEdit.lowStockThresholdPieces || 20));
    } else {
      setTradeName('');
      setGenericName('');
      setCategory(categories[0] || 'Tablet');
      setManufacturer('');
      setShelfLocation('');
      setItemCode(`MED-${Math.floor(100000 + Math.random() * 900000)}`);
      setPiecesPerStrip('10');
      setStripsPerBox('10');
      setMrpPerPiece('2.50');
      setLowStockThresholdPieces('20');
    }
    setError(null);
  }, [itemToEdit, isOpen, categories]);

  if (!isOpen) return null;

  // Real-time live mathematical calculations
  let stripPrice = '0.00';
  let boxPrice = '0.00';
  let totalPiecesBox = 100;
  const pcs = Math.max(1, parseInt(piecesPerStrip, 10) || 1);
  const str = Math.max(1, parseInt(stripsPerBox, 10) || 1);

  try {
    totalPiecesBox = pcs * str;
    const pieceDec = new Decimal(mrpPerPiece || 0);
    stripPrice = pieceDec.times(pcs).toFixed(2);
    boxPrice = pieceDec.times(totalPiecesBox).toFixed(2);
  } catch {
    // defaults
  }

  const handleFormSubmit = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        tradeName: tradeName.trim(),
        genericName: genericName.trim(),
        category: category.trim(),
        manufacturer: manufacturer.trim(),
        shelfLocation: shelfLocation.trim(),
        itemCode: itemCode.trim() || undefined,
        unitHierarchy: {
          baseUnit: 'piece' as const,
          piecesPerStrip: pcs,
          stripsPerBox: str,
        },
        mrpPerPiece,
        lowStockThresholdPieces: Math.max(0, parseInt(lowStockThresholdPieces, 10) || 0),
      };

      if (itemToEdit) {
        await updateItem(itemToEdit._id, payload);
      } else {
        await createItem(payload);
      }

      onSuccess();

      if (addAnother) {
        setTradeName('');
        setGenericName('');
        setManufacturer('');
        setShelfLocation('');
        setItemCode(`MED-${Math.floor(100000 + Math.random() * 900000)}`);
        setMrpPerPiece('2.50');
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save medicine product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#002F34]/40 backdrop-blur-[6px] z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 text-[#0F2327] animate-fadeIn">
      {/* Main Modal Card Container */}
      <div className="relative w-full max-w-[860px] max-h-[92vh] flex flex-col bg-white rounded-[32px] shadow-2xl border border-white/80 overflow-hidden z-10 transition-all">
        {/* Modal Header */}
        <div className="px-7 py-5 sm:px-8 sm:py-6 bg-white border-b border-[#E8F0ED] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            {/* Brand Icon Badge */}
            <div className="w-11 h-11 rounded-2xl bg-[#002F34] flex items-center justify-center text-white shadow-md shadow-[#002F34]/20">
              {itemToEdit ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#002F34] tracking-tight leading-snug">
                {itemToEdit ? 'Edit Master Product' : 'Add Master Product'}
              </h2>
              <p className="text-xs text-[#5F7D7A] font-medium tracking-normal mt-0.5">
                Catalog definition & multi-unit pricing engine (Batches managed separately)
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#E7F6F3] text-[#006059] border border-[#C5E8E0]">
              <span className="w-2 h-2 rounded-full bg-[#00A887] ring-4 ring-[#00A887]/20"></span>
              Base Unit: Piece (pc)
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
        </div>

        {/* Scrollable Form Body */}
        <form
          id="productMasterForm"
          onSubmit={(e) => handleFormSubmit(e, false)}
          className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6"
        >
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5">
              <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Pharmaceutical Identification */}
          <div className="bg-[#F8FAF9] rounded-[24px] p-5 sm:p-6 border border-[#E8EFEA] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#E7F6F3] text-[#004D40] text-xs font-bold flex items-center justify-center font-mono">
                  01
                </span>
                <h3 className="text-sm font-bold text-[#002F34] tracking-tight">Pharmaceutical Identification</h3>
              </div>
              <span className="text-[11px] font-medium text-[#7A9894]">* Required for search index</span>
            </div>

            {/* Trade & Generic Name Rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="tradeName">
                  Trade / Commercial Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="tradeName"
                  name="tradeName"
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Napa Extra 500mg, Seclo 20"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="genericName">
                  Generic Formulation <span className="text-rose-500">*</span>
                </label>
                <input
                  id="genericName"
                  name="genericName"
                  type="text"
                  required
                  placeholder="e.g. Paracetamol + Caffeine"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                />
              </div>
            </div>

            {/* Secondary Specs: SKU, Category, Manufacturer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#002F34]" htmlFor="itemCode">
                    SKU / Barcode ID
                  </label>
                  <span className="text-[10px] uppercase font-bold text-[#007062] bg-[#E1F6F0] px-2 py-0.5 rounded-full border border-[#BCE8DD]">
                    AUTO
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A9894]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <input
                    id="itemCode"
                    name="itemCode"
                    type="text"
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F0F5F3] border border-[#DCE6E2] rounded-2xl text-xs font-bold text-[#00383C] font-mono focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="category">
                  Dosage Category <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="category"
                    name="category"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] appearance-none cursor-pointer pr-10"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#7A9894]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="manufacturer">
                  Manufacturer / Brand <span className="text-rose-500">*</span>
                </label>
                <input
                  id="manufacturer"
                  name="manufacturer"
                  type="text"
                  required
                  placeholder="e.g. Beximco, Square, ACME"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Multi-Unit Packaging & Live Derived Pricing Engine */}
          <div className="bg-[#F8FAF9] rounded-[24px] p-5 sm:p-6 border border-[#E8EFEA] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#E7F6F3] text-[#004D40] text-xs font-bold flex items-center justify-center font-mono">
                  02
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#002F34] tracking-tight">
                    Multi-Unit Pricing Engine & Hierarchy
                  </h3>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#006059] bg-white px-3 py-1 rounded-full border border-[#D2E4DF] shadow-2xs self-start sm:self-auto">
                <svg className="w-4 h-4 text-[#00A887]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Auto Derived (Decimal128 Precision)
              </div>
            </div>

            {/* 3 Core Pricing Engine Input Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* MRP Per Piece */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE6E2] shadow-2xs hover:border-[#B7D2CB] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#002F34]" htmlFor="mrpPerPiece">
                    MRP Per Piece (৳) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-[#7A9894] uppercase tracking-wider">Base</span>
                </div>
                <p className="text-[11px] text-[#7A9894] mb-2.5">Single unit retail sale price</p>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-[#004D40] text-base">
                    ৳
                  </span>
                  <input
                    id="mrpPerPiece"
                    name="mrpPerPiece"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={mrpPerPiece}
                    onChange={(e) => setMrpPerPiece(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 bg-[#F6FAF8] border border-[#D8E4E0] rounded-xl text-lg font-bold text-[#002F34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                  />
                </div>
              </div>

              {/* Pieces Per Strip */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE6E2] shadow-2xs hover:border-[#B7D2CB] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#002F34]" htmlFor="piecesPerStrip">
                    Pieces Per Strip <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-[#7A9894] uppercase tracking-wider">Mid Tier</span>
                </div>
                <p className="text-[11px] text-[#7A9894] mb-2.5">Blister foil unit count</p>
                <div className="relative">
                  <input
                    id="piecesPerStrip"
                    name="piecesPerStrip"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={piecesPerStrip}
                    onChange={(e) => setPiecesPerStrip(e.target.value)}
                    className="w-full pl-3.5 pr-14 py-2 bg-[#F6FAF8] border border-[#D8E4E0] rounded-xl text-lg font-bold text-[#002F34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-[#7A9894]">
                    pcs/strip
                  </span>
                </div>
              </div>

              {/* Strips Per Box */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE6E2] shadow-2xs hover:border-[#B7D2CB] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#002F34]" htmlFor="stripsPerBox">
                    Strips Per Box <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-medium text-[#7A9894] uppercase tracking-wider">Bulk Tier</span>
                </div>
                <p className="text-[11px] text-[#7A9894] mb-2.5">Box or carton count</p>
                <div className="relative">
                  <input
                    id="stripsPerBox"
                    name="stripsPerBox"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={stripsPerBox}
                    onChange={(e) => setStripsPerBox(e.target.value)}
                    className="w-full pl-3.5 pr-16 py-2 bg-[#F6FAF8] border border-[#D8E4E0] rounded-xl text-lg font-bold text-[#002F34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-[#7A9894]">
                    strips/box
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Live Computed Pricing Preview Card */}
            <div className="bg-[#F1F6F4] border border-[#D5E3DE] rounded-[22px] p-5 text-[#002F34] relative overflow-hidden transition-all">
              {/* Header row */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#D5E3DE]/70 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-[#E3F5F0] text-[#006A61] flex items-center justify-center border border-[#CBEAE2] shadow-2xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold tracking-wider uppercase text-[#002F34]">
                        Live Computed Pricing Preview
                      </span>
                      <span className="text-[9px] uppercase font-bold text-[#007062] bg-[#E1F6F0] px-2 py-0.5 rounded-full border border-[#BCE8DD]">
                        Active Engine
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C7470] font-normal mt-0.5">
                      Multi-tier sales rate derived instantly from base unit MRP
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#00574F] bg-white/80 px-3.5 py-1.5 rounded-full border border-[#D5E3DE] shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00A887]"></span>
                  <span>Pack Ratio:</span>
                  <span className="font-mono font-bold text-[#002F34]">
                    1 Box = <span className="text-[#007062]">{totalPiecesBox}</span> Pcs
                  </span>
                </div>
              </div>

              {/* 3 Tier Cards */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Level 1: Base Unit */}
                <div className="bg-white border border-[#DEE8E5] rounded-[18px] p-4 shadow-sm hover:border-[#97D8D0] transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#47635F] bg-[#F0F5F3] px-2 py-0.5 rounded-full border border-[#E2EAE7]">
                        Level 1 · Base Unit
                      </span>
                      <span className="text-[11px] font-mono text-[#7A9894]">1 pc</span>
                    </div>
                    <span className="text-xs font-medium text-[#607774] block">Retail Single Unit</span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-[#007062]">৳</span>
                      <span className="text-2xl font-bold tracking-tight text-[#002F34] font-mono">
                        {parseFloat(mrpPerPiece || '0').toFixed(2)}
                      </span>
                      <span className="text-[11px] text-[#7A9894] font-normal">/ pc</span>
                    </div>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#EEF3F2] flex items-center justify-between text-[10px]">
                    <span className="text-[#6A817E] font-mono">POS dispensing unit</span>
                    <span className="font-semibold text-[#007062]">Base Price</span>
                  </div>
                </div>

                {/* Level 2: Strip Pack */}
                <div className="bg-white border border-[#DEE8E5] rounded-[18px] p-4 shadow-sm hover:border-[#97D8D0] transition-colors flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#47635F] bg-[#F0F5F3] px-2 py-0.5 rounded-full border border-[#E2EAE7]">
                        Level 2 · Strip Pack
                      </span>
                      <span className="text-[11px] font-mono text-[#007062]">
                        <span className="font-bold">{pcs}</span> pcs
                      </span>
                    </div>
                    <span className="text-xs font-medium text-[#607774] block">Blister Foil Strip</span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-[#007062]">৳</span>
                      <span className="text-2xl font-bold tracking-tight text-[#002F34] font-mono">
                        {stripPrice}
                      </span>
                      <span className="text-[11px] text-[#7A9894] font-normal">/ strip</span>
                    </div>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#EEF3F2] flex items-center justify-between text-[10px]">
                    <span className="text-[#6A817E] font-mono">
                      ৳{parseFloat(mrpPerPiece || '0').toFixed(2)} × {pcs} pcs
                    </span>
                    <span className="font-semibold text-[#007062]">Standard Strip</span>
                  </div>
                </div>

                {/* Level 3: Full Box */}
                <div className="bg-white border border-[#97D8D0] ring-1 ring-[#97D8D0]/50 rounded-[18px] p-4 shadow-sm flex flex-col justify-between hover:border-[#00A887] transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#004D40] bg-[#E1F6F0] px-2 py-0.5 rounded-full border border-[#BCE8DD]">
                        Level 3 · Full Box
                      </span>
                      <span className="text-[11px] font-mono text-[#5F7D7A]">
                        <span className="font-bold text-[#002F34]">{str}</span> strips
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#002F34] block">Master Trade Pack</span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-[#007062]">৳</span>
                      <span className="text-2xl font-bold tracking-tight text-[#002F34] font-mono">
                        {boxPrice}
                      </span>
                      <span className="text-[11px] text-[#5F7D7A] font-normal">/ box</span>
                    </div>
                  </div>
                  <div className="pt-3 mt-3 border-t border-[#EEF3F2] flex items-center justify-between text-[10px]">
                    <span className="text-[#6A817E] font-mono font-medium">
                      ৳{parseFloat(mrpPerPiece || '0').toFixed(2)} × {totalPiecesBox} pcs
                    </span>
                    <span className="text-[9px] uppercase font-bold text-[#005A53] bg-[#F4F8F7] px-1.5 py-0.5 rounded border border-[#DEE8E5]">
                      Carton
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Dispensary Logistics & Stock Thresholds */}
          <div className="bg-[#F8FAF9] rounded-[24px] p-5 sm:p-6 border border-[#E8EFEA] shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-[#E7F6F3] text-[#004D40] text-xs font-bold flex items-center justify-center font-mono">
                03
              </span>
              <h3 className="text-sm font-bold text-[#002F34] tracking-tight">Dispensary Logistics & Thresholds</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="shelfLocation">
                  Physical Shelf / Dispensary Rack <span className="text-[#7A9894] font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A9894]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <input
                    id="shelfLocation"
                    name="shelfLocation"
                    type="text"
                    placeholder="e.g. Rack A-12, Bin 04"
                    value={shelfLocation}
                    onChange={(e) => setShelfLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#002F34]" htmlFor="lowStockThresholdPieces">
                    Low Stock Alert Limit <span className="text-[#7A9894] font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-[#7A9894] font-medium">In total pieces</span>
                </div>
                <div className="relative">
                  <input
                    id="lowStockThresholdPieces"
                    name="lowStockThresholdPieces"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="20"
                    value={lowStockThresholdPieces}
                    onChange={(e) => setLowStockThresholdPieces(e.target.value)}
                    className="w-full pl-4 pr-16 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                  />
                  <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-xs font-semibold text-[#7A9894]">
                    pieces
                  </span>
                </div>
                <p className="text-[11px] text-[#7A9894] mt-1.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                  Triggers low inventory alert when stock falls to or below {lowStockThresholdPieces || 0} pieces.
                </p>
              </div>
            </div>
          </div>

          {/* Clean Catalog Decoupling Notice Banner */}
          <div className="p-4 rounded-2xl bg-[#F0FAF7] border border-[#CEE8E2] flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-[#E1F4F0] text-[#007062] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-xs text-[#1F544D] leading-relaxed">
              <span className="font-bold text-[#002F34]">Clean Catalog Decoupling:</span> This form creates master
              catalog identification and pricing formulas. Specific lot batches, expiry dates, supplier invoices, and
              physical counts are safely added under <strong>Add Batch (Stock Entry)</strong> without modifying this blueprint.
            </div>
          </div>
        </form>

        {/* Modal Action Footer */}
        <div className="px-7 py-4 sm:px-8 sm:py-5 bg-white border-t border-[#E8F0ED] flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl border border-[#D2E0DC] text-xs font-bold text-[#5F7D7A] hover:text-[#002F34] hover:bg-[#F2F7F5] transition-colors cursor-pointer disabled:opacity-50"
            type="button"
          >
            Discard Draft
          </button>

          <div className="flex items-center gap-3">
            {!itemToEdit && (
              <button
                type="button"
                disabled={loading}
                onClick={(e) => handleFormSubmit(e, true)}
                className="px-5 py-2.5 rounded-2xl border border-[#002F34]/20 text-xs font-bold text-[#002F34] hover:bg-[#002F34]/5 transition-colors hidden sm:inline-flex cursor-pointer disabled:opacity-50"
              >
                Save & Add Another
              </button>
            )}

            <button
              form="productMasterForm"
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-[#002F34] text-white text-xs font-bold shadow-md shadow-[#002F34]/25 hover:bg-[#012428] active:scale-[0.99] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {itemToEdit ? 'Save Changes' : 'Save to Catalog'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
