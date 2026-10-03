import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IInvoiceLineItem {
  itemId: Types.ObjectId;
  tradeName: string;
  genericName: string;
  batchId: Types.ObjectId;
  batchNumber: string;
  expiryDate: Date;
  unit: 'piece' | 'strip' | 'box';
  unitHierarchySnapshot: {
    piecesPerStrip: number;
    stripsPerBox: number;
  };
  quantity: number;
  quantityPieces: number;
  unitPrice: Types.Decimal128;
  unitPricePerPiece: Types.Decimal128;
  lineTotal: Types.Decimal128;
  purchaseCostPerPiece?: Types.Decimal128;
  isPriceOverridden: boolean;
  originalUnitPrice?: Types.Decimal128;
  priceOverrideVariance?: Types.Decimal128;
  isNonFefo: boolean;
  suggestedFefoBatchNumber?: string;
}

export interface IInvoiceCharge {
  name: string;
  type: 'percentage' | 'fixed';
  rate: Types.Decimal128;
  amount: Types.Decimal128;
}

export interface IInvoicePayment {
  method: 'cash' | 'card' | 'mfs' | 'split';
  cashTendered?: Types.Decimal128;
  changeDue?: Types.Decimal128;
  mfsProvider?: 'bkash' | 'nagad' | 'rocket' | 'upay';
  mfsTransactionId?: string;
  cardLast4?: string;
  cardType?: string;
  splitDetails?: {
    cashAmount?: Types.Decimal128;
    cardAmount?: Types.Decimal128;
    mfsAmount?: Types.Decimal128;
  };
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  billedBy: Types.ObjectId;
  billedByName: string;
  customerName?: string;
  customerPhone?: string;
  lines: IInvoiceLineItem[];
  subtotal: Types.Decimal128;
  discountPercent: Types.Decimal128;
  discountAmount: Types.Decimal128;
  charges: IInvoiceCharge[];
  totalCharges: Types.Decimal128;
  grandTotal: Types.Decimal128;
  payment: IInvoicePayment;
  status: 'PAID' | 'RETURNED_PARTIAL' | 'RETURNED_FULL';
  hasPriceOverride: boolean;
  hasNonFefoBatch: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceLineItemSchema = new Schema<IInvoiceLineItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    tradeName: { type: String, required: true },
    genericName: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    unit: { type: String, enum: ['piece', 'strip', 'box'], required: true },
    unitHierarchySnapshot: {
      piecesPerStrip: { type: Number, required: true },
      stripsPerBox: { type: Number, required: true },
    },
    quantity: { type: Number, required: true, min: 1 },
    quantityPieces: { type: Number, required: true, min: 1 },
    unitPrice: { type: Schema.Types.Decimal128, required: true },
    unitPricePerPiece: { type: Schema.Types.Decimal128, required: true },
    lineTotal: { type: Schema.Types.Decimal128, required: true },
    purchaseCostPerPiece: { type: Schema.Types.Decimal128 },
    isPriceOverridden: { type: Boolean, default: false },
    originalUnitPrice: { type: Schema.Types.Decimal128 },
    priceOverrideVariance: { type: Schema.Types.Decimal128 },
    isNonFefo: { type: Boolean, default: false },
    suggestedFefoBatchNumber: { type: String },
  },
  { _id: false }
);

const invoiceChargeSchema = new Schema<IInvoiceCharge>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    rate: { type: Schema.Types.Decimal128, required: true },
    amount: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

const invoicePaymentSchema = new Schema<IInvoicePayment>(
  {
    method: { type: String, enum: ['cash', 'card', 'mfs', 'split'], required: true },
    cashTendered: { type: Schema.Types.Decimal128 },
    changeDue: { type: Schema.Types.Decimal128 },
    mfsProvider: { type: String, enum: ['bkash', 'nagad', 'rocket', 'upay'] },
    mfsTransactionId: { type: String },
    cardLast4: { type: String },
    cardType: { type: String },
    splitDetails: {
      cashAmount: { type: Schema.Types.Decimal128 },
      cardAmount: { type: Schema.Types.Decimal128 },
      mfsAmount: { type: Schema.Types.Decimal128 },
    },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    billedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    billedByName: { type: String, required: true },
    customerName: { type: String },
    customerPhone: { type: String },
    lines: { type: [invoiceLineItemSchema], required: true },
    subtotal: { type: Schema.Types.Decimal128, required: true },
    discountPercent: { type: Schema.Types.Decimal128, default: () => Types.Decimal128.fromString('0.00') },
    discountAmount: { type: Schema.Types.Decimal128, default: () => Types.Decimal128.fromString('0.00') },
    charges: { type: [invoiceChargeSchema], default: [] },
    totalCharges: { type: Schema.Types.Decimal128, default: () => Types.Decimal128.fromString('0.00') },
    grandTotal: { type: Schema.Types.Decimal128, required: true },
    payment: { type: invoicePaymentSchema, required: true },
    status: {
      type: String,
      enum: ['PAID', 'RETURNED_PARTIAL', 'RETURNED_FULL'],
      default: 'PAID',
      index: true,
    },
    hasPriceOverride: { type: Boolean, default: false, index: true },
    hasNonFefoBatch: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.index({ createdAt: -1 });

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', invoiceSchema);
