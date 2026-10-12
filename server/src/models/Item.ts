import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import Decimal from 'decimal.js';

export interface IUnitHierarchy {
  baseUnit: 'piece';
  piecesPerBox?: number;
  piecesPerStrip?: number;
  stripsPerBox?: number;
}

export interface IItem extends Document {
  tradeName: string;
  genericName: string;
  itemCode: string;
  category: string;
  manufacturer: string;
  brandName?: string;
  barcodes: string[];
  qrCode?: string;
  shelfLocation: string;
  unitHierarchy: IUnitHierarchy;
  mrpPerPiece: Types.Decimal128;
  lowStockThresholdPieces: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const unitHierarchySchema = new Schema<IUnitHierarchy>(
  {
    baseUnit: { type: String, default: 'piece', enum: ['piece'] },
    piecesPerBox: { type: Number, default: 10, min: 1 },
    piecesPerStrip: { type: Number, default: 10, min: 1 },
    stripsPerBox: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const itemSchema = new Schema<IItem>(
  {
    tradeName: {
      type: String,
      required: [true, 'Trade name is required'],
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
      trim: true,
      index: true,
    },
    itemCode: {
      type: String,
      required: [true, 'Item code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
      index: true,
    },
    brandName: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    barcodes: {
      type: [String],
      default: [],
      index: true,
    },
    qrCode: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    shelfLocation: {
      type: String,
      default: '',
      trim: true,
    },
    unitHierarchy: {
      type: unitHierarchySchema,
      default: () => ({ baseUnit: 'piece', piecesPerBox: 10, piecesPerStrip: 10, stripsPerBox: 1 }),
    },
    mrpPerPiece: {
      type: Schema.Types.Decimal128,
      required: [true, 'MRP per piece is required'],
    },
    lowStockThresholdPieces: {
      type: Number,
      default: 20,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.__v;
        if (ret.mrpPerPiece !== undefined && ret.mrpPerPiece !== null) {
          const pieceMRP = new Decimal(ret.mrpPerPiece.toString());
          ret.mrpPerPiece = pieceMRP.toFixed(2);
          
          const pcsPerBox = ret.unitHierarchy?.piecesPerBox || (ret.unitHierarchy?.piecesPerStrip && ret.unitHierarchy?.stripsPerBox ? ret.unitHierarchy.piecesPerStrip * ret.unitHierarchy.stripsPerBox : 1);
          const pcsPerStrip = ret.unitHierarchy?.piecesPerStrip || 1;
          
          ret.unitHierarchy = {
            ...ret.unitHierarchy,
            piecesPerBox: pcsPerBox,
          };
          ret.stripPrice = pieceMRP.times(pcsPerStrip).toFixed(2);
          ret.boxPrice = pieceMRP.times(pcsPerBox).toFixed(2);
          ret.totalPiecesPerBox = pcsPerBox;
        }
        return ret;
      },
    },
  }
);

// High performance compound text & prefix search indexes
itemSchema.index({ tradeName: 'text', genericName: 'text', itemCode: 'text', manufacturer: 'text', brandName: 'text' });
itemSchema.index({ tradeName: 1, genericName: 1 });
itemSchema.index({ isActive: 1, tradeName: 1 });

export const Item: Model<IItem> =
  mongoose.models.Item || mongoose.model<IItem>('Item', itemSchema);
