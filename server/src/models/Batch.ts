import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import Decimal from 'decimal.js';

export interface IBatch extends Document {
  itemId: Types.ObjectId;
  batchNumber: string;
  expiryDate: Date;
  qtySellable: number;
  qtyDamaged: number;
  qtyExpired: number;
  purchasePricePerPiece?: Types.Decimal128;
  isCostMissing: boolean;
  supplierName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
      index: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      uppercase: true,
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
      index: true,
    },
    qtySellable: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Sellable quantity cannot be negative'],
    },
    qtyDamaged: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Damaged quantity cannot be negative'],
    },
    qtyExpired: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Expired quantity cannot be negative'],
    },
    purchasePricePerPiece: {
      type: Schema.Types.Decimal128,
      required: false,
    },
    isCostMissing: {
      type: Boolean,
      default: false,
      index: true,
    },
    supplierName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.__v;
        if (ret.purchasePricePerPiece !== undefined && ret.purchasePricePerPiece !== null) {
          ret.purchasePricePerPiece = new Decimal(ret.purchasePricePerPiece.toString()).toFixed(2);
        }
        return ret;
      },
    },
  }
);

// Unique batch per item, batch number, and expiry date
batchSchema.index({ itemId: 1, batchNumber: 1, expiryDate: 1 }, { unique: true });
batchSchema.index({ expiryDate: 1, qtySellable: 1 });

export const Batch: Model<IBatch> =
  mongoose.models.Batch || mongoose.model<IBatch>('Batch', batchSchema);
