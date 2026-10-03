import { api } from './api';
import { Batch } from '../types';

export interface ReceiveBatchPayload {
  itemId: string;
  batchNumber: string;
  expiryDate: string;
  unit: 'piece' | 'strip' | 'box';
  quantity: number;
  purchasePrice?: string | number;
  supplierName?: string;
}

export interface ReceiveBatchResponse {
  message: string;
  batch: Batch;
  isMerged: boolean;
}

export async function receiveBatch(data: ReceiveBatchPayload): Promise<ReceiveBatchResponse> {
  const res = await api.post<ReceiveBatchResponse>('/batches/receive', data);
  return res.data;
}

export async function getBatchesByItem(itemId: string): Promise<{ batches: Batch[] }> {
  const res = await api.get<{ batches: Batch[] }>(`/batches/by-item/${itemId}`);
  return res.data;
}

export async function updateBatchCost(
  batchId: string,
  data: { purchasePrice: string | number; unit: 'piece' | 'strip' | 'box' }
): Promise<{ message: string; batch: Batch }> {
  const res = await api.put<{ message: string; batch: Batch }>(`/batches/${batchId}/cost`, data);
  return res.data;
}
