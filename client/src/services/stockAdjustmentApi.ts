import { api } from './api';
import { Batch, StockMovement } from '../types';

export interface TransferStockPayload {
  batchId: string;
  fromBucket: 'sellable' | 'damaged' | 'expired';
  toBucket: 'sellable' | 'damaged' | 'expired';
  quantityPieces: number;
  reasonCategory: string;
  reasonDetail: string;
}

export interface WriteOffStockPayload {
  batchId: string;
  fromBucket: 'damaged' | 'expired';
  quantityPieces: number;
  reasonCategory: string;
  reasonDetail: string;
}

export interface GetStockMovementsResponse {
  movements: StockMovement[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export async function transferStock(
  data: TransferStockPayload
): Promise<{ message: string; batch: Batch }> {
  const res = await api.post<{ message: string; batch: Batch }>('/stock-adjustments/transfer', data);
  return res.data;
}

export async function writeOffStock(
  data: WriteOffStockPayload
): Promise<{ message: string; batch: Batch }> {
  const res = await api.post<{ message: string; batch: Batch }>('/stock-adjustments/write-off', data);
  return res.data;
}

export async function getStockMovements(
  params: { page?: number; limit?: number; itemId?: string; batchId?: string; type?: string } = {}
): Promise<GetStockMovementsResponse> {
  const res = await api.get<GetStockMovementsResponse>('/stock-adjustments/movements', { params });
  return res.data;
}
