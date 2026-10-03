import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICounter extends Document {
  _id: string; // e.g. 'itemCode', 'invoiceNumber', 'creditNoteNumber'
  seq: number;
}

const counterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>('Counter', counterSchema);

/**
 * Atomically increments and gets the next sequence number formatted with prefix and zero-padding.
 * @param counterId The identifier (e.g. 'itemCode')
 * @param prefix e.g. 'MED'
 * @param padLength e.g. 6 -> 'MED-000001'
 */
export async function getNextSequence(
  counterId: string,
  prefix: string = 'MED',
  padLength: number = 6
): Promise<string> {
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const numStr = String(counter.seq).padStart(padLength, '0');
  return `${prefix}-${numStr}`;
}
