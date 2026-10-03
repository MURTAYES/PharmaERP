import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export type StockMovementType =
  | 'RECEIVE'
  | 'ADJUST_TRANSFER'
  | 'WRITE_OFF'
  | 'SALE_DEDUCT'
  | 'RETURN_RESTOCK';

export type StockBucketType = 'sellable' | 'damaged' | 'expired';

export type AdjustmentReasonCategory =
  | 'Damaged in Transit'
  | 'Shelf Spill/Breakage'
  | 'Physical Count Audit Variance'
  | 'Customer Return Quarantine'
  | 'Expired Stock Quarantine'
  | 'Supplier Return Prep'
  | 'Initial Stock'
  | 'Direct Adjustment';

export interface IStockMovement extends Document {
  batchId: Types.ObjectId;
  itemId: Types.ObjectId;
  type: StockMovementType;
  qtyChangePieces: number; // Delta in base pieces (e.g. +100 or -20)
  bucketFrom?: StockBucketType;
  bucketTo?: StockBucketType | 'write_off';
  reasonCategory?: AdjustmentReasonCategory;
  reasonDetail?: string;
  userId: Types.ObjectId;
  timestamp: Date;
}

const stockMovementSchema = new Schema<IStockMovement>(
  {
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'Batch',
      required: [true, 'Batch ID is required'],
      index: true,
    },
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: ['RECEIVE', 'ADJUST_TRANSFER', 'WRITE_OFF', 'SALE_DEDUCT', 'RETURN_RESTOCK'],
      required: [true, 'Movement type is required'],
      index: true,
    },
    qtyChangePieces: {
      type: Number,
      required: [true, 'Quantity change is required'],
    },
    bucketFrom: {
      type: String,
      enum: ['sellable', 'damaged', 'expired'],
    },
    bucketTo: {
      type: String,
      enum: ['sellable', 'damaged', 'expired', 'write_off'],
    },
    reasonCategory: {
      type: String,
      enum: [
        'Damaged in Transit',
        'Shelf Spill/Breakage',
        'Physical Count Audit Variance',
        'Customer Return Quarantine',
        'Expired Stock Quarantine',
        'Supplier Return Prep',
        'Initial Stock',
        'Direct Adjustment',
      ],
    },
    reasonDetail: {
      type: String,
      default: '',
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Append-only guarantee: prevent updates or deletes
stockMovementSchema.pre('updateOne', function () {
  throw new Error('StockMovement records are immutable and cannot be updated');
});
stockMovementSchema.pre('updateMany', function () {
  throw new Error('StockMovement records are immutable and cannot be updated');
});
stockMovementSchema.pre('findOneAndUpdate', function () {
  throw new Error('StockMovement records are immutable and cannot be updated');
});
stockMovementSchema.pre('deleteOne', function () {
  throw new Error('StockMovement records are immutable and cannot be deleted');
});
stockMovementSchema.pre('deleteMany', function () {
  throw new Error('StockMovement records are immutable and cannot be deleted');
});
stockMovementSchema.pre('findOneAndDelete', function () {
  throw new Error('StockMovement records are immutable and cannot be deleted');
});

export const StockMovement: Model<IStockMovement> =
  mongoose.models.StockMovement ||
  mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);
