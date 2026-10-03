import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../services/settingsApi.ts';
import { Card } from '../components/common/Card.tsx';
import { Button } from '../components/common/Button.tsx';
import { Input } from '../components/common/Input.tsx';
import { Badge } from '../components/common/Badge.tsx';
import { PharmacySettings, GlobalCharge } from '../types/index.ts';

export function Settings() {
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [form, setForm] = useState<PharmacySettings>({
    pharmacyName: '',
    address: '',
    phone: '',
    email: '',
    currency: 'BDT',
    currencySymbol: '৳',
    receiptHeader: '',
    receiptFooter: '',
    receiptWidth: '80mm',
    charges: [],
    expiryAlertWindows: { greenDays: 90, yellowDays: 60, redDays: 30 },
    categories: [],
  });

  // State for adding a new charge
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeType, setNewChargeType] = useState<'percentage' | 'fixed'>('percentage');
  const [newChargeRate, setNewChargeRate] = useState<number>(5);

  // State for adding a new category
  const [newCategory, setNewCategory] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  useEffect(() => {
    if (data?.settings) {
      setForm(data.settings);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (updated: Partial<PharmacySettings>) => settingsApi.update(updated),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      showToast(res.message);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to update settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handleAddCharge = () => {
    if (!newChargeName.trim()) return;
    const newCharge: GlobalCharge = {
      id: `charge_${Date.now()}`,
      name: newChargeName.trim(),
      type: newChargeType,
      rate: Number(newChargeRate),
      isActive: true,
    };
    setForm({
      ...form,
      charges: [...form.charges, newCharge],
    });
    setNewChargeName('');
    setNewChargeRate(5);
  };

  const handleRemoveCharge = (id: string) => {
    setForm({
      ...form,
      charges: form.charges.filter((c) => c.id !== id),
    });
  };

  const handleToggleCharge = (id: string) => {
    setForm({
      ...form,
      charges: form.charges.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)),
    });
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (form.categories.includes(newCategory.trim())) return;
    setForm({
      ...form,
      categories: [...form.categories, newCategory.trim()],
    });
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    setForm({
      ...form,
      categories: form.categories.filter((c) => c !== cat),
    });
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-on-surface text-surface shadow-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[20px] text-secondary-container">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface tracking-tight">Pharmacy Configuration</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Manage profile branding, receipt formatting, global charges, and alert thresholds.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          icon="save"
          onClick={handleSubmit}
          isLoading={updateMutation.isPending}
        >
          Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: General & Receipt Settings */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Pharmacy Profile Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-surface-container pb-3">
              <span className="material-symbols-outlined text-primary text-[22px]">storefront</span>
              <h2 className="text-base font-bold text-on-surface">Pharmacy Profile</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Pharmacy Name"
                value={form.pharmacyName}
                onChange={(e) => setForm({ ...form, pharmacyName: e.target.value })}
                required
              />
              <Input
                label="Contact Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Input
                label="Contact Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Currency Symbol"
                value={form.currencySymbol}
                onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
              />
            </div>
            <Input
              label="Physical Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </Card>

          {/* Receipt Printing Preferences Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-surface-container pb-3">
              <span className="material-symbols-outlined text-primary text-[22px]">receipt_long</span>
              <h2 className="text-base font-bold text-on-surface">Receipt Printing Preferences</h2>
            </div>

            <div className="flex flex-col gap-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Thermal Receipt Width
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, receiptWidth: '80mm' })}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    form.receiptWidth === '80mm'
                      ? 'border-primary bg-primary-container/10 text-primary shadow-sm'
                      : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="font-bold text-sm">80mm (Standard POS Width)</span>
                  <span className="text-xs">Standard countertop thermal printer receipt format.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, receiptWidth: '58mm' })}
                  className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    form.receiptWidth === '58mm'
                      ? 'border-primary bg-primary-container/10 text-primary shadow-sm'
                      : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="font-bold text-sm">58mm (Compact Mobile Width)</span>
                  <span className="text-xs">Compact thermal receipt printer format.</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Receipt Header Note
              </label>
              <textarea
                value={form.receiptHeader}
                onChange={(e) => setForm({ ...form, receiptHeader: e.target.value })}
                rows={2}
                className="w-full p-3 bg-surface-container-low rounded-xl text-sm text-on-surface border border-transparent focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Receipt Footer Note
              </label>
              <textarea
                value={form.receiptFooter}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                rows={2}
                className="w-full p-3 bg-surface-container-low rounded-xl text-sm text-on-surface border border-transparent focus:bg-surface-container-lowest focus:border-primary focus:outline-none"
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Charges, Alerts & Categories */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Global Charges Manager Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">percent</span>
                <h2 className="text-base font-bold text-on-surface">Global Invoice Charges</h2>
              </div>
              <Badge variant="neutral">{form.charges.length} active</Badge>
            </div>

            <p className="text-xs text-on-surface-variant">
              Charges are applied to invoices after discount (percentage) or added once per bill (fixed).
            </p>

            {/* List of Charges */}
            <div className="flex flex-col gap-2">
              {form.charges.length === 0 ? (
                <div className="p-4 rounded-xl bg-surface-container-low text-center text-xs text-on-surface-variant">
                  No charges configured. Add VAT or custom fees below.
                </div>
              ) : (
                form.charges.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCharge(c.id)}
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          c.isActive ? 'bg-primary border-primary text-white' : 'border-outline-variant bg-surface'
                        }`}
                      >
                        {c.isActive && <span className="material-symbols-outlined text-[14px]">check</span>}
                      </button>
                      <span className="font-bold text-on-surface">{c.name}</span>
                      <span className="font-mono text-on-surface-variant">
                        {c.type === 'percentage' ? `${c.rate}%` : `৳${c.rate}`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCharge(c.id)}
                      className="text-error hover:opacity-80 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Charge Inline Form */}
            <div className="p-3 rounded-xl bg-surface-container border border-dashed border-outline-variant flex flex-col gap-2">
              <span className="text-[11px] font-bold text-on-surface uppercase tracking-wider">Add New Charge</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Charge Name (e.g. VAT)"
                  value={newChargeName}
                  onChange={(e) => setNewChargeName(e.target.value)}
                  className="px-3 py-1.5 bg-surface-container-lowest rounded-lg text-xs border border-transparent focus:border-primary focus:outline-none"
                />
                <select
                  value={newChargeType}
                  onChange={(e) => setNewChargeType(e.target.value as any)}
                  className="px-2 py-1.5 bg-surface-container-lowest rounded-lg text-xs border border-transparent focus:border-primary focus:outline-none"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (৳)</option>
                </select>
                <input
                  type="number"
                  placeholder="Rate"
                  value={newChargeRate}
                  onChange={(e) => setNewChargeRate(Number(e.target.value))}
                  className="px-3 py-1.5 bg-surface-container-lowest rounded-lg text-xs border border-transparent focus:border-primary focus:outline-none font-mono"
                />
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddCharge}>
                Add Charge
              </Button>
            </div>
          </Card>

          {/* Expiry Alert Warning Thresholds Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-surface-container pb-3">
              <span className="material-symbols-outlined text-primary text-[22px]">notification_important</span>
              <h2 className="text-base font-bold text-on-surface">Expiry Alert Tiers</h2>
            </div>
            <p className="text-xs text-on-surface-variant">
              Define the 3-tier days threshold windows for inventory batch monitoring.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-left">
                <span className="text-[10px] font-bold uppercase text-emerald-800">Tier 1 Notice</span>
                <input
                  type="number"
                  value={form.expiryAlertWindows?.greenDays || 90}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expiryAlertWindows: {
                        ...form.expiryAlertWindows,
                        greenDays: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full mt-1 px-2 py-1 bg-white rounded-lg text-sm font-bold font-mono text-emerald-900 border border-emerald-300 focus:outline-none"
                />
                <span className="text-[10px] text-emerald-700">Days</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
                <span className="text-[10px] font-bold uppercase text-amber-800">Tier 2 Warning</span>
                <input
                  type="number"
                  value={form.expiryAlertWindows?.yellowDays || 60}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expiryAlertWindows: {
                        ...form.expiryAlertWindows,
                        yellowDays: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full mt-1 px-2 py-1 bg-white rounded-lg text-sm font-bold font-mono text-amber-900 border border-amber-300 focus:outline-none"
                />
                <span className="text-[10px] text-amber-700">Days</span>
              </div>

              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-left">
                <span className="text-[10px] font-bold uppercase text-red-800">Tier 3 Critical</span>
                <input
                  type="number"
                  value={form.expiryAlertWindows?.redDays || 30}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expiryAlertWindows: {
                        ...form.expiryAlertWindows,
                        redDays: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full mt-1 px-2 py-1 bg-white rounded-lg text-sm font-bold font-mono text-red-900 border border-red-300 focus:outline-none"
                />
                <span className="text-[10px] text-red-700">Days</span>
              </div>
            </div>
          </Card>

          {/* Medicine Categories Manager Card */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-surface-container pb-3">
              <span className="material-symbols-outlined text-primary text-[22px]">category</span>
              <h2 className="text-base font-bold text-on-surface">Medicine Categories</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.categories?.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-on-surface-variant hover:text-error"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Category Name..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                className="flex-1 h-9 px-3 bg-surface-container-low rounded-lg text-xs text-on-surface border border-transparent focus:border-primary focus:outline-none"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddCategory}>
                Add
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
