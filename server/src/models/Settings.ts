import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IGlobalCharge {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  rate: number; // e.g. 5 for 5% or 20 for 20 BDT
  isActive: boolean;
}

export interface IExpiryAlertWindows {
  greenDays: number;
  yellowDays: number;
  redDays: number;
}

export interface ISettings extends Document {
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptWidth: '80mm' | '58mm';
  charges: IGlobalCharge[];
  expiryAlertWindows: IExpiryAlertWindows;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

const globalChargeSchema = new Schema<IGlobalCharge>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    rate: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const expiryAlertWindowsSchema = new Schema<IExpiryAlertWindows>(
  {
    greenDays: { type: Number, default: 90 },
    yellowDays: { type: Number, default: 60 },
    redDays: { type: Number, default: 30 },
  },
  { _id: false }
);

const settingsSchema = new Schema<ISettings>(
  {
    pharmacyName: {
      type: String,
      default: 'PharmERP Clinical Pharmacy',
      trim: true,
    },
    address: {
      type: String,
      default: 'House #12, Road #4, Dhanmondi, Dhaka-1205',
      trim: true,
    },
    phone: {
      type: String,
      default: '+880 1700-000000',
      trim: true,
    },
    email: {
      type: String,
      default: 'dispensary@pharmaerp.local',
      trim: true,
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    currencySymbol: {
      type: String,
      default: '৳',
    },
    receiptHeader: {
      type: String,
      default: 'PharmERP Clinical Suite\nMain Dispensary & Clinic #1',
    },
    receiptFooter: {
      type: String,
      default: 'Thank you for choosing our pharmacy.\nKeep medicines stored below 25°C away from direct sunlight.',
    },
    receiptWidth: {
      type: String,
      enum: ['80mm', '58mm'],
      default: '80mm',
    },
    charges: {
      type: [globalChargeSchema],
      default: [], // Configurable empty charge list by default per user spec
    },
    expiryAlertWindows: {
      type: expiryAlertWindowsSchema,
      default: () => ({ greenDays: 90, yellowDays: 60, redDays: 30 }),
    },
    categories: {
      type: [String],
      default: [
        'Tablet',
        'Capsule',
        'Syrup / Suspension',
        'Injection',
        'Ointment / Cream',
        'Eye / Ear Drops',
        'Inhaler',
        'Suppository',
        'Medical Device / Surgical',
      ],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);
