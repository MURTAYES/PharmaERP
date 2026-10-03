import { api } from './api';
import { Item } from '../types';

export interface GetItemsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'generic' | 'stock' | 'mrp' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface GetItemsResponse {
  items: Item[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface SearchItemsResponse {
  items: (Item & {
    earliestBatch?: any;
    batches: any[];
  })[];
  latencyMs: number;
}

export async function getItems(params: GetItemsParams = {}): Promise<GetItemsResponse> {
  const res = await api.get<GetItemsResponse>('/items', { params });
  return res.data;
}

export async function searchItems(q: string, limit: number = 15): Promise<SearchItemsResponse> {
  const res = await api.get<SearchItemsResponse>('/items/search', {
    params: { q, limit },
  });
  return res.data;
}

export async function getItemById(id: string): Promise<{ item: Item; batches: any[] }> {
  const res = await api.get<{ item: Item; batches: any[] }>(`/items/${id}`);
  return res.data;
}

export async function createItem(data: Partial<Item>): Promise<{ item: Item }> {
  const res = await api.post<{ item: Item }>('/items', data);
  return res.data;
}

export async function updateItem(id: string, data: Partial<Item>): Promise<{ item: Item }> {
  const res = await api.put<{ item: Item }>(`/items/${id}`, data);
  return res.data;
}

export async function toggleItemActive(id: string): Promise<{ item: Item }> {
  const res = await api.patch<{ item: Item }>(`/items/${id}/toggle-active`);
  return res.data;
}

export async function getProductDistribution(refresh = false): Promise<import('../types').ProductDistribution> {
  const res = await api.get<import('../types').ProductDistribution>('/items/distribution', {
    params: { refresh: refresh ? 'true' : undefined },
  });
  return res.data;
}

