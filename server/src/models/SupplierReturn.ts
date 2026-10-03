import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface ISupplierReturnLineItem {
  itemId: Types.ObjectId;
  tradeName: string;
  genericName: string;
  batchId: Types.ObjectId;
  batchNumber: string;
  expiryDate?: Date;
  fromBucket: 'damaged' | 'expired';
  quantityPieces: number;
  purchaseCostPerPiece?: Types.Decimal128;
  totalCost?: Types.Decimal128;
}

export interface ISupplierReturn extends Document {
  supplierReturnNumber: string; // Sequential: SRT-000001
  supplierName: string;
  supplierInvoiceRef?: string;
  processedBy: Types.ObjectId;
  processedByName: string;
  lines: ISupplierReturnLineItem[];
  totalQuantityPieces: number;
  totalEstimatedCredit?: Types.Decimal128;
  reasonCategory: string;
  reasonDetail: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierReturnLineItemSchema = new Schema<ISupplierReturnLineItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    tradeName: { type: String, required: true },
    genericName: { type: String, required: true },
    batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchNumber: { type: String, required: true },
    expiryDate: { type: Date },
    fromBucket: { type: String, enum: ['damaged', 'expired'], required: true },
    quantityPieces: { type: Number, required: true, min: 1 },
    purchaseCostPerPiece: { type: Schema.Types.Decimal128 },
    totalCost: { type: Schema.Types.Decimal128 },
  },
  { _id: false }
);

const supplierReturnSchema = new Schema<ISupplierReturn>(
  {
    supplierReturnNumber: { type: String, required: true, unique: true, index: true },
    supplierName: { type: String, required: true, trim: true },
    supplierInvoiceRef: { type: String, trim: true },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    processedByName: { type: String, required: true },
    lines: { type: [supplierReturnLineItemSchema], required: true },
    totalQuantityPieces: { type: Number, required: true },
    totalEstimatedCredit: { type: Schema.Types.Decimal128 },
    reasonCategory: { type: String, required: true },
    reasonDetail: { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const SupplierReturn: Model<ISupplierReturn> =
  mongoose.models.SupplierReturn ||
  mongoose.model<ISupplierReturn>('SupplierReturn', supplierReturnSchema);
