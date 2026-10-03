import React, { useState, useEffect } from 'react';
import Decimal from 'decimal.js';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
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
  const [piecesPerStrip, setPiecesPerStrip] = useState('10');
  const [stripsPerBox, setStripsPerBox] = useState('10');
  const [mrpPerPiece, setMrpPerPiece] = useState('2.50');
  const [lowStockThresholdPieces, setLowStockThresholdPieces] = useState('20');
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then((res) => {
        if (res.settings?.categories && res.settings.categories.length > 0) {
          setCategories(res.settings.categories);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (itemToEdit) {
      setTradeName(itemToEdit.tradeName);
      setGenericName(itemToEdit.genericName);
      setCategory(itemToEdit.category);
      setManufacturer(itemToEdit.manufacturer);
      setShelfLocation(itemToEdit.shelfLocation || '');
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
      setPiecesPerStrip('10');
      setStripsPerBox('10');
      setMrpPerPiece('2.50');
      setLowStockThresholdPieces('20');
    }
    setError(null);
  }, [itemToEdit, isOpen, categories]);

  // Live calculations for derived prices
  let stripPrice = '0.00';
  let boxPrice = '0.00';
  let totalPiecesBox = 100;

  try {
    const pcs = parseInt(piecesPerStrip, 10) || 1;
    const str = parseInt(stripsPerBox, 10) || 1;
    totalPiecesBox = pcs * str;
    const pieceDec = new Decimal(mrpPerPiece || 0);
    stripPrice = pieceDec.times(pcs).toFixed(2);
    boxPrice = pieceDec.times(totalPiecesBox).toFixed(2);
  } catch {
    // Keep defaults
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        tradeName,
        genericName,
        category,
        manufacturer,
        shelfLocation,
        unitHierarchy: {
          baseUnit: 'piece' as const,
          piecesPerStrip: parseInt(piecesPerStrip, 10) || 1,
          stripsPerBox: parseInt(stripsPerBox, 10) || 1,
        },
        mrpPerPiece,
        lowStockThresholdPieces: parseInt(lowStockThresholdPieces, 10) || 0,
      };

      if (itemToEdit) {
        await updateItem(itemToEdit._id, payload);
      } else {
        await createItem(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to save medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemToEdit ? 'Edit Medicine Master' : 'Add New Medicine'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Trade Name (Brand Name)"
            placeholder="e.g. Napa Extra, Seclo 20"
            value={tradeName}
            onChange={(e) => setTradeName(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Generic Name / Formulation"
            placeholder="e.g. Paracetamol + Caffeine"
            value={genericName}
            onChange={(e) => setGenericName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/80 border border-slate-700/60 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Manufacturer / Pharma"
            placeholder="e.g. Beximco, Square, Incepta"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            required
          />

          <Input
            label="Shelf Location (Rack)"
            placeholder="e.g. Rack A-3, Drawer 2"
            value={shelfLocation}
            onChange={(e) => setShelfLocation(e.target.value)}
          />
        </div>

        {/* Unit Hierarchy & Packaging */}
        <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
              Unit Conversion Hierarchy
            </span>
            <span className="text-xs text-slate-400">Base Unit: Piece (Tablet / Capsule)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              label="Pieces per Strip"
              type="number"
              min="1"
              value={piecesPerStrip}
              onChange={(e) => setPiecesPerStrip(e.target.value)}
              required
            />

            <Input
              label="Strips per Box"
              type="number"
              min="1"
              value={stripsPerBox}
              onChange={(e) => setStripsPerBox(e.target.value)}
              required
            />

            <Input
              label="MRP per Piece (৳)"
              type="number"
              step="0.01"
              min="0"
              value={mrpPerPiece}
              onChange={(e) => setMrpPerPiece(e.target.value)}
              required
            />
          </div>

          {/* Derived Price Live Banner */}
          <div className="p-2.5 bg-teal-950/40 border border-teal-500/30 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-teal-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Live Derived Pricing:</span>
              <span>Unit Price: ৳ {parseFloat(mrpPerPiece || '0').toFixed(2)}</span>
              <span className="text-slate-500">|</span>
              <span>Strip Price: ৳ {stripPrice}</span>
              <span className="text-slate-500">|</span>
              <span>Box Price: ৳ {boxPrice}</span>
            </div>
            <span className="text-slate-400">
              ({stripsPerBox} strips × {piecesPerStrip} pcs = {totalPiecesBox} pcs / box)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Low Stock Alert Threshold (Pieces)"
            type="number"
            min="0"
            value={lowStockThresholdPieces}
            onChange={(e) => setLowStockThresholdPieces(e.target.value)}
            helperText="Alerts trigger when total sellable pieces drop below this amount"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            {itemToEdit ? 'Save Changes' : 'Create Medicine'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
