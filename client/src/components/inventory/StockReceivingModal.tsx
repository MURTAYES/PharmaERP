import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Item } from '../../types';
import { searchItems } from '../../services/itemApi';
import { receiveBatch } from '../../services/batchApi';
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
  const [expiryDate, setExpiryDate] = useState('');
  const [unit, setUnit] = useState<'piece' | 'strip' | 'box'>('box');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItem(preselectedItem);
      setSearchQuery(`${preselectedItem.tradeName} (${preselectedItem.genericName})`);
    } else {
      setSelectedItem(null);
      setSearchQuery('');
    }
    setBatchNumber('');
    setExpiryDate('');
    setUnit('box');
    setQuantity('1');
    setPurchasePrice('');
    setSupplierName('');
    setError(null);
    setSuccessMsg(null);
  }, [preselectedItem, isOpen]);

  // Handle search query with debounce
  useEffect(() => {
    if (!searchQuery.trim() || selectedItem) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchItems(searchQuery, 8);
        setSearchResults(res.items);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedItem]);

  // Calculate total converted pieces
  let totalCalculatedPieces = 0;
  let estimatedCostPerPiece = '';

  if (selectedItem) {
    const pcsPerStrip = selectedItem.unitHierarchy?.piecesPerStrip || 1;
    const stripsPerBox = selectedItem.unitHierarchy?.stripsPerBox || 1;
    const totalPcsBox = pcsPerStrip * stripsPerBox;
    const qtyNum = parseFloat(quantity) || 0;

    if (unit === 'piece') totalCalculatedPieces = qtyNum;
    else if (unit === 'strip') totalCalculatedPieces = qtyNum * pcsPerStrip;
    else if (unit === 'box') totalCalculatedPieces = qtyNum * totalPcsBox;

    if (isOwner && purchasePrice && qtyNum > 0) {
      try {
        const priceDec = new Decimal(purchasePrice);
        let costPerPiece = priceDec;
        if (unit === 'strip') costPerPiece = priceDec.dividedBy(pcsPerStrip);
        else if (unit === 'box') costPerPiece = priceDec.dividedBy(totalPcsBox);
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

    setError(null);
    setLoading(true);

    try {
      const res = await receiveBatch({
        itemId: selectedItem._id,
        batchNumber: batchNumber.trim().toUpperCase(),
        expiryDate: expiryDate.trim(),
        unit,
        quantity: parseFloat(quantity),
        purchasePrice: isOwner && purchasePrice ? purchasePrice : undefined,
        supplierName: supplierName.trim(),
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Receiving & Batch Ingestion" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            {successMsg}
          </div>
        )}

        {/* Item Selector / Typeahead */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Select Medicine <span className="text-teal-400">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by trade name, generic name, or code..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedItem) setSelectedItem(null);
              }}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/60 rounded-lg text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
            {searching && (
              <span className="absolute right-3 top-2.5 text-xs text-slate-400 animate-spin material-symbols-outlined">
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
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && !selectedItem && (
            <div className="absolute z-20 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl max-h-56 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => {
                    setSelectedItem(item);
                    setSearchQuery(`${item.tradeName} (${item.genericName})`);
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-teal-950/40 border-b border-slate-800/60 last:border-0 flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="text-sm font-semibold text-slate-100">{item.tradeName}</span>
                    <span className="text-xs text-slate-400 ml-2">({item.genericName})</span>
                  </div>
                  <span className="text-xs font-mono text-teal-400">
                    ৳ {parseFloat(item.mrpPerPiece).toFixed(2)}/pc
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Item Information Chip */}
        {selectedItem && (
          <div className="p-2.5 bg-teal-950/30 border border-teal-500/20 rounded-lg text-xs flex items-center justify-between text-teal-300 font-sans">
            <div>
              <span className="font-semibold">{selectedItem.tradeName}</span> —{' '}
              <span className="text-slate-400">
                {selectedItem.unitHierarchy?.piecesPerStrip} pcs/strip,{' '}
                {selectedItem.unitHierarchy?.stripsPerBox} strips/box (
                {(selectedItem.unitHierarchy?.piecesPerStrip || 1) *
                  (selectedItem.unitHierarchy?.stripsPerBox || 1)}{' '}
                pcs/box)
              </span>
            </div>
            <span className="font-mono bg-teal-900/40 px-2 py-0.5 rounded border border-teal-600/30">
              MRP: ৳ {selectedItem.mrpPerPiece}/pc
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

          <Input
            label="Expiry Date"
            placeholder="MM/YYYY or DD/MM/YYYY (e.g. 11/2027)"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            helperText="Typing 11/2027 auto-resolves to end of November 2027"
            required
          />
        </div>

        {/* Receiving Unit & Quantity */}
        <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Quantity & Unit Received
            </span>
            {totalCalculatedPieces > 0 && (
              <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-500/30">
                Total: {totalCalculatedPieces} Pieces
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Receiving Unit
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['box', 'strip', 'piece'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all capitalize ${
                      unit === u
                        ? 'bg-teal-600 text-white border-teal-500 shadow-md shadow-teal-900/40'
                        : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label={`Quantity in ${unit}s`}
              type="number"
              step="any"
              min="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Purchase Price (Owner) & Supplier Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg text-xs text-slate-400 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-teal-400">info</span>
              Pharmacist receiving: purchase price will be flagged as cost-missing for owner review.
            </div>
          )}

          <Input
            label="Supplier / Distributor Name"
            placeholder="e.g. Square Pharma Central Depot"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
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
