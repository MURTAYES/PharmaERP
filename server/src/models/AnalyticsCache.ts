import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAnalyticsCache extends Document {
  key: string;
  data: any;
  calculatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsCacheSchema = new Schema<IAnalyticsCache>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    calculatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AnalyticsCache: Model<IAnalyticsCache> =
  mongoose.models.AnalyticsCache || mongoose.model<IAnalyticsCache>('AnalyticsCache', analyticsCacheSchema);
