import { describe, it, expect } from 'vitest';
import { updateSettingsSchema } from '../controllers/settingsController.js';

describe('Settings Schema Validation', () => {
  it('validates correct pharmacy settings payloads', () => {
    const validData = {
      pharmacyName: 'City Care Pharmacy',
      receiptWidth: '80mm',
      currency: 'BDT',
      currencySymbol: '৳',
      charges: [
        { id: 'vat-1', name: 'VAT', type: 'percentage', rate: 5, isActive: true },
        { id: 'srv-1', name: 'Service Fee', type: 'fixed', rate: 10, isActive: false },
      ],
      expiryAlertWindows: {
        greenDays: 90,
        yellowDays: 60,
        redDays: 30,
      },
    };

    const parsed = updateSettingsSchema.parse(validData);
    expect(parsed.pharmacyName).toBe('City Care Pharmacy');
    expect(parsed.receiptWidth).toBe('80mm');
    expect(parsed.charges?.length).toBe(2);
    expect(parsed.expiryAlertWindows?.greenDays).toBe(90);
  });

  it('rejects invalid receipt width or negative charge rate', () => {
    const invalidWidth = { receiptWidth: '100mm' };
    expect(() => updateSettingsSchema.parse(invalidWidth)).toThrow();

    const invalidCharge = {
      charges: [{ id: '1', name: 'Tax', type: 'percentage', rate: -5, isActive: true }],
    };
    expect(() => updateSettingsSchema.parse(invalidCharge)).toThrow();
  });
});
