import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ICreditNoteLineItem {
  itemId: Types.ObjectId;
  tradeName: string;
  genericName: string;
  batchId: Types.ObjectId;
  batchNumber: string;
  expiryDate?: Date;
  unit: 'piece' | 'strip' | 'box';
  unitHierarchySnapshot: {
    piecesPerStrip: number;
    stripsPerBox: number;
  };
  returnedQuantity: number;
  returnedQuantityPieces: number;
  originalUnitPrice: Types.Decimal128;
  originalUnitPricePerPiece: Types.Decimal128;
  returnedLineTotal: Types.Decimal128;
  destinationBucket: 'sellable' | 'damaged' | 'expired';
}

export interface ICreditNoteChargeRefund {
  name: string;
  type: 'percentage' | 'fixed';
  rate: Types.Decimal128;
  refundAmount: Types.Decimal128;
}

export interface ICreditNote extends Document {
  creditNoteNumber: string;
  invoiceId: Types.ObjectId;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  processedBy: Types.ObjectId;
  processedByName: string;
  lines: ICreditNoteLineItem[];
  subtotalRefund: Types.Decimal128;
  discountRefund: Types.Decimal128;
  chargesRefund: ICreditNoteChargeRefund[];
  totalChargesRefund: Types.Decimal128;
  grandTotalRefund: Types.Decimal128;
  refundMethod: 'cash' | 'original_payment';
  reasonCategory: string;
  reasonDetail: string;
  createdAt: Date;
  updatedAt: Date;
}

const creditNoteLineItemSchema = new Schema<ICreditNoteLineItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    tradeName: { type: String, required: true },
    genericName: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date },
    unit: { type: String, enum: ['piece', 'strip', 'box'], required: true },
    unitHierarchySnapshot: {
      piecesPerStrip: { type: Number, required: true },
      stripsPerBox: { type: Number, required: true },
    },
    returnedQuantity: { type: Number, required: true, min: 1 },
    returnedQuantityPieces: { type: Number, required: true, min: 1 },
    originalUnitPrice: { type: Schema.Types.Decimal128, required: true },
    originalUnitPricePerPiece: { type: Schema.Types.Decimal128, required: true },
    returnedLineTotal: { type: Schema.Types.Decimal128, required: true },
    destinationBucket: {
      type: String,
      enum: ['sellable', 'damaged', 'expired'],
      required: true,
      default: 'sellable',
    },
  },
  { _id: false }
);

const creditNoteChargeRefundSchema = new Schema<ICreditNoteChargeRefund>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    rate: { type: Schema.Types.Decimal128, required: true },
    refundAmount: { type: Schema.Types.Decimal128, required: true },
  },
  { _id: false }
);

const creditNoteSchema = new Schema<ICreditNote>(
  {
    creditNoteNumber: { type: String, required: true, unique: true, index: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    invoiceNumber: { type: String, required: true, index: true },
    customerName: { type: String },
    customerPhone: { type: String },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    processedByName: { type: String, required: true },
    lines: { type: [creditNoteLineItemSchema], required: true },
    subtotalRefund: { type: Schema.Types.Decimal128, required: true },
    discountRefund: { type: Schema.Types.Decimal128, required: true },
    chargesRefund: { type: [creditNoteChargeRefundSchema], default: [] },
    totalChargesRefund: { type: Schema.Types.Decimal128, required: true },
    grandTotalRefund: { type: Schema.Types.Decimal128, required: true },
    refundMethod: {
      type: String,
      enum: ['cash', 'original_payment'],
      required: true,
      default: 'cash',
    },
    reasonCategory: { type: String, required: true },
    reasonDetail: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const CreditNote: Model<ICreditNote> =
  mongoose.models.CreditNote || mongoose.model<ICreditNote>('CreditNote', creditNoteSchema);
