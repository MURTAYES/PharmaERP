import { api } from './api';
import { AlertSummary, Batch, Item } from '../types';

export async function getAlertSummary(): Promise<AlertSummary> {
  const res = await api.get<AlertSummary>('/alerts/summary');
  return res.data;
}

export async function getExpiringBatches(
  tier: 'all' | 'expired' | 'critical' | 'warning' | 'notice' = 'all'
): Promise<{ tier: string; count: number; batches: Batch[] }> {
  const res = await api.get<{ tier: string; count: number; batches: Batch[] }>('/alerts/expiring', {
    params: { tier },
  });
  return res.data;
}

export async function getLowStockItems(): Promise<{ count: number; items: Item[] }> {
  const res = await api.get<{ count: number; items: Item[] }>('/alerts/low-stock');
  return res.data;
}
