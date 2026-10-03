import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface IHeldBillLine {
  itemId: string;
  tradeName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  unit: 'piece' | 'strip' | 'box';
  unitHierarchy: {
    piecesPerStrip: number;
    stripsPerBox: number;
  };
  quantity: number;
  quantityPieces: number;
  unitPrice: string;
  mrpPerPiece: string;
  isPriceOverridden: boolean;
  originalUnitPrice?: string;
  isNonFefo: boolean;
  suggestedFefoBatchNumber?: string;
}

export interface IHeldBill extends Document {
  billReference: string;
  heldBy: Types.ObjectId;
  heldByName: string;
  customerName?: string;
  customerPhone?: string;
  lines: IHeldBillLine[];
  discountPercent: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const heldBillLineSchema = new Schema<IHeldBillLine>(
  {
    itemId: { type: String, required: true },
    tradeName: { type: String, required: true },
    genericName: { type: String, required: true },
    batchId: { type: String, required: true },
    batchNumber: { type: String, required: true },
    expiryDate: { type: String, required: true },
    unit: { type: String, enum: ['piece', 'strip', 'box'], required: true },
    unitHierarchy: {
      piecesPerStrip: { type: Number, required: true },
      stripsPerBox: { type: Number, required: true },
    },
    quantity: { type: Number, required: true, min: 1 },
    quantityPieces: { type: Number, required: true, min: 1 },
    unitPrice: { type: String, required: true },
    mrpPerPiece: { type: String, required: true },
    isPriceOverridden: { type: Boolean, default: false },
    originalUnitPrice: { type: String },
    isNonFefo: { type: Boolean, default: false },
    suggestedFefoBatchNumber: { type: String },
  },
  { _id: false }
);

const heldBillSchema = new Schema<IHeldBill>(
  {
    billReference: { type: String, required: true, index: true },
    heldBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    heldByName: { type: String, required: true },
    customerName: { type: String },
    customerPhone: { type: String },
    lines: { type: [heldBillLineSchema], required: true },
    discountPercent: { type: String, default: '0.00' },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

heldBillSchema.index({ createdAt: -1 });

export const HeldBill: Model<IHeldBill> =
  mongoose.models.HeldBill || mongoose.model<IHeldBill>('HeldBill', heldBillSchema);
