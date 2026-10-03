import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICounter {
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
  padLength: number = 6,
  session?: mongoose.ClientSession
): Promise<string> {
  const options: mongoose.QueryOptions = { new: true, upsert: true };
  if (session) {
    options.session = session;
  }
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    options
  );
  const numStr = String(counter.seq).padStart(padLength, '0');
  return `${prefix}-${numStr}`;
}
