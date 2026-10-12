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
  const [productCategory, setProductCategory] = useState<'Medicine' | 'Baby food' | 'Non food' | 'Consumer'>('Medicine');
  const [brandName, setBrandName] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [piecesPerBox, setPiecesPerBox] = useState('10');
  const [mrpPerPiece, setMrpPerPiece] = useState('2.50');
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [newBarcode, setNewBarcode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [lowStockThresholdPieces, setLowStockThresholdPieces] = useState('20');
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then((res: any) => {
        const catList = res.settings?.categories || res.categories || [];
        const defaultCats = [
          'Tablet',
          'Capsule',
          'Syrup / Suspension',
          'Pot (PT)',
          'Injection',
          'Ointment / Cream',
          'Eye / Ear Drops',
          'Inhaler',
          'Suppository',
          'Medical Device / Surgical',
        ];
        // Combine ensuring 'Pot (PT)' is always available
        const combinedCats = Array.from(new Set([...catList, ...defaultCats]));
        setCategories(combinedCats);

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
        const combinedBrands = Array.from(new Set([...brandList, ...defaultBrands]));
        setBrands(combinedBrands);
      })
      .catch(() => {
        setCategories([
          'Tablet',
          'Capsule',
          'Syrup / Suspension',
          'Pot (PT)',
          'Injection',
          'Ointment / Cream',
          'Eye / Ear Drops',
          'Inhaler',
        ]);
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
    if (itemToEdit) {
      setTradeName(itemToEdit.tradeName);
      setGenericName(itemToEdit.genericName);
      setCategory(itemToEdit.category || 'Tablet');
      setProductCategory(itemToEdit.productCategory || 'Medicine');
      const itemBrand = itemToEdit.brandName || itemToEdit.manufacturer || '';
      setBrandName(itemBrand || (brands[0] || 'Square Pharmaceuticals'));
      setShelfLocation(itemToEdit.shelfLocation || '');
      setItemCode(itemToEdit.itemCode || '');
      const pcsBox = itemToEdit.unitHierarchy?.piecesPerBox || itemToEdit.totalPiecesPerBox || 10;
      setPiecesPerBox(String(pcsBox));
      setMrpPerPiece(String(itemToEdit.mrpPerPiece || '2.50'));
      setLowStockThresholdPieces(String(itemToEdit.lowStockThresholdPieces || 20));
      setBarcodes(itemToEdit.barcodes || []);
      setQrCode(itemToEdit.qrCode || '');
      setNewBarcode('');
    } else {
      setTradeName('');
      setGenericName('');
      setCategory(categories[0] || 'Tablet');
      setProductCategory('Medicine');
      setBrandName(brands[0] || 'Square Pharmaceuticals');
      setShelfLocation('');
      setItemCode(`MED-${Math.floor(100000 + Math.random() * 900000)}`);
      setPiecesPerBox('10');
      setMrpPerPiece('2.50');
      setLowStockThresholdPieces('20');
      setBarcodes([]);
      setQrCode('');
      setNewBarcode('');
    }
    setError(null);
  }, [itemToEdit, isOpen, categories, brands]);

  if (!isOpen) return null;

  // Real-time live derived box calculations
  const pcs = Math.max(1, parseInt(piecesPerBox, 10) || 1);
  let boxPrice = '0.00';
  try {
    const pieceDec = new Decimal(mrpPerPiece || 0);
    boxPrice = pieceDec.times(pcs).toFixed(2);
  } catch {
    boxPrice = '0.00';
  }

  const handleAddBarcodeTag = () => {
    const trimmed = newBarcode.trim();
    if (!trimmed) return;
    if (barcodes.includes(trimmed)) {
      setNewBarcode('');
      return;
    }
    setBarcodes([...barcodes, trimmed]);
    setNewBarcode('');
  };

  const handleRemoveBarcodeTag = (code: string) => {
    setBarcodes(barcodes.filter((b) => b !== code));
  };

  const handleFormSubmit = async (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const finalBrand = (brandName || brands[0] || 'Square Pharmaceuticals').trim();
      const allBarcodes = [...barcodes];
      if (newBarcode.trim() && !allBarcodes.includes(newBarcode.trim())) {
        allBarcodes.push(newBarcode.trim());
      }

      const payload = {
        tradeName: tradeName.trim(),
        genericName: genericName.trim(),
        category: category.trim(),
        productCategory,
        manufacturer: finalBrand,
        brandName: finalBrand,
        barcodes: allBarcodes,
        qrCode: qrCode.trim(),
        shelfLocation: shelfLocation.trim(),
        itemCode: itemCode.trim() || undefined,
        unitHierarchy: {
          baseUnit: 'piece' as const,
          piecesPerBox: pcs,
          piecesPerStrip: 1,
          stripsPerBox: pcs,
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
        setShelfLocation('');
        setItemCode(`MED-${Math.floor(100000 + Math.random() * 900000)}`);
        setMrpPerPiece('2.50');
        setBarcodes([]);
        setQrCode('');
        setNewBarcode('');
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
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
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

          {/* Section 1: Product Identification & Brand */}
          <div className="bg-[#F8FAF9] rounded-[24px] p-5 sm:p-6 border border-[#E8EFEA] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#002F34] tracking-tight">Product Identification & Brand</h3>
            </div>

            {/* Top Level Product Category Selector */}
            <div>
              <label className="block text-xs font-bold text-[#002F34] mb-1.5">
                Product Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Medicine', 'Baby food', 'Non food', 'Consumer'] as const).map((cat) => {
                  const isSelected = productCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setProductCategory(cat);
                        if (cat !== 'Medicine' && !category) {
                          setCategory('General / Piece');
                        }
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#002F34] text-white border-[#002F34] shadow-xs'
                          : 'bg-white text-[#5F7D7A] border-[#DCE6E2] hover:bg-[#F2F7F5] hover:text-[#002F34]'
                      }`}
                    >
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
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

            {/* Brand Dropdown, Category, SKU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              {/* Brand Name Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#002F34]" htmlFor="brandSelect">
                    Brand Name <span className="text-rose-500">*</span>
                  </label>
                </div>
                <div className="relative">
                  <select
                    id="brandSelect"
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

              {/* Dosage Category */}
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

              {/* SKU / Item Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#002F34]" htmlFor="itemCode">
                    System Code / SKU
                  </label>
                  <span className="text-[10px] uppercase font-bold text-[#007062] bg-[#E1F6F0] px-2 py-0.5 rounded-full border border-[#BCE8DD]">
                    AUTO
                  </span>
                </div>
                <input
                  id="itemCode"
                  name="itemCode"
                  type="text"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#F0F5F3] border border-[#DCE6E2] rounded-2xl text-xs font-bold text-[#00383C] font-mono focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
                />
              </div>
            </div>

            {/* Multi-Barcode and QR Code Row */}
            <div className="pt-2 border-t border-[#E8EFEA] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#002F34] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-primary">barcode_scanner</span>
                  Barcodes & QR Codes <span className="text-[11px] font-normal text-[#7A9894]">(Optional)</span>
                </h4>
              </div>

              {/* Barcodes tag list */}
              {barcodes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {barcodes.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#D5E3DE] text-xs font-mono font-bold text-[#002F34] shadow-2xs"
                    >
                      <span>{code}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBarcodeTag(code)}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Barcode input */}
                <div>
                  <label className="block text-xs font-bold text-[#002F34] mb-1.5">
                    Add Barcode
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Scan or type barcode..."
                      value={newBarcode}
                      onChange={(e) => setNewBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBarcodeTag();
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-white border border-[#DCE6E2] rounded-2xl text-xs font-mono font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
                    />
                    <button
                      type="button"
                      onClick={handleAddBarcodeTag}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-[#002F34] rounded-2xl transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* QR Code input */}
                <div>
                  <label className="block text-xs font-bold text-[#002F34] mb-1.5">
                    QR Code String (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Scan or enter QR code string..."
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-[#DCE6E2] rounded-2xl text-xs font-mono font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Unit Pricing & Box Packaging Ratio */}
          <div className="bg-[#F8FAF9] rounded-[24px] p-5 sm:p-6 border border-[#E8EFEA] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#002F34] tracking-tight">
                Pricing & Packaging Ratio
              </h3>
            </div>

            {/* 2 Core Inputs: MRP Per Piece & Pieces Per Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* MRP Per Piece */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE6E2] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#002F34]" htmlFor="mrpPerPiece">
                    MRP Per Piece (৳) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Piece Unit
                  </span>
                </div>
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
                    className="w-full pl-8 pr-3.5 py-2.5 bg-[#F6FAF8] border border-[#D8E4E0] rounded-xl text-lg font-bold text-[#002F34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                  />
                </div>
              </div>

              {/* Pieces Per Box */}
              <div className="bg-white p-4 rounded-2xl border border-[#DCE6E2] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#002F34]" htmlFor="piecesPerBox">
                    Pieces Per Box <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Box Unit
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="piecesPerBox"
                    name="piecesPerBox"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={piecesPerBox}
                    onChange={(e) => setPiecesPerBox(e.target.value)}
                    className="w-full pl-3.5 pr-16 py-2.5 bg-[#F6FAF8] border border-[#D8E4E0] rounded-xl text-lg font-bold text-[#002F34] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-semibold text-[#7A9894]">
                    pieces/box
                  </span>
                </div>
              </div>
            </div>

            {/* Derived Pricing Preview */}
            <div className="bg-[#F1F6F4] border border-[#D5E3DE] rounded-[22px] p-4 text-[#002F34]">
              <div className="flex items-center justify-between pb-2.5 border-b border-[#D5E3DE]/70 mb-3">
                <span className="text-xs font-bold tracking-wider uppercase text-[#002F34]">
                  Computed Pricing Preview
                </span>
                <span className="text-xs font-mono font-bold text-[#006059]">
                  1 Box = {pcs} Pieces
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-[#DEE8E5] rounded-xl p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#47635F]">
                    Single Piece Rate
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-bold text-[#007062]">৳</span>
                    <span className="text-2xl font-bold font-mono text-[#002F34]">
                      {parseFloat(mrpPerPiece || '0').toFixed(2)}
                    </span>
                    <span className="text-xs text-[#7A9894]">/ pc</span>
                  </div>
                </div>

                <div className="bg-white border border-[#97D8D0] rounded-xl p-3.5 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#004D40]">
                    Full Box Rate ({pcs} pcs)
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-base font-bold text-[#007062]">৳</span>
                    <span className="text-2xl font-bold font-mono text-[#002F34]">
                      {boxPrice}
                    </span>
                    <span className="text-xs text-[#7A9894]">/ box</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Dispensary Logistics & Stock Thresholds */}
          <div className="bg-[#F8FAF9] rounded-[24px] p-5 sm:p-6 border border-[#E8EFEA] shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#002F34] tracking-tight">Dispensary Logistics & Thresholds</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#002F34] mb-1.5" htmlFor="shelfLocation">
                  Physical Shelf / Dispensary Rack <span className="text-[#7A9894] font-normal">(Optional)</span>
                </label>
                <input
                  id="shelfLocation"
                  name="shelfLocation"
                  type="text"
                  placeholder="e.g. Rack A-12, Bin 04"
                  value={shelfLocation}
                  onChange={(e) => setShelfLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#DCE6E2] rounded-2xl text-sm font-semibold text-[#002F34] placeholder:text-[#9FB7B2] focus:outline-none focus:ring-2 focus:ring-[#002F34]/20 focus:border-[#002F34] transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#002F34]" htmlFor="lowStockThresholdPieces">
                    Low Stock Alert Limit <span className="text-[#7A9894] font-normal">(Optional)</span>
                  </label>
                  <span className="text-[10px] text-[#7A9894] font-medium">In pieces</span>
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
              </div>
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
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
