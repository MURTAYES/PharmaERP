import { api } from './api';
import { Batch, Invoice, HeldBill } from '../types';

export interface CheckoutPayload {
  customerName?: string;
  customerPhone?: string;
  lines: Array<{
    itemId: string;
    batchId: string;
    unit: 'piece' | 'strip' | 'box';
    quantity: number;
    unitPrice?: string;
  }>;
  discountPercent?: string | number;
  payment: {
    method: 'cash' | 'card' | 'mfs' | 'split';
    cashTendered?: string | number;
    changeDue?: string | number;
    mfsProvider?: 'bkash' | 'nagad' | 'rocket' | 'upay';
    mfsTransactionId?: string;
    cardLast4?: string;
    cardType?: string;
    splitDetails?: {
      cashAmount?: string | number;
      cardAmount?: string | number;
      mfsAmount?: string | number;
    };
  };
}

export interface HoldBillPayload {
  customerName?: string;
  customerPhone?: string;
  lines: any[];
  discountPercent?: string;
  notes?: string;
}

export async function getBatchesForItem(itemId: string): Promise<{ batches: (Batch & { isFefo?: boolean })[] }> {
  const response = await api.get(`/pos/items/${itemId}/batches`);
  return response.data;
}

export async function checkout(payload: CheckoutPayload): Promise<{ message: string; invoice: Invoice }> {
  const response = await api.post('/pos/checkout', payload);
  return response.data;
}

export async function getInvoices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  invoices: Invoice[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const response = await api.get('/pos/invoices', { params });
  return response.data;
}

export async function getInvoiceById(id: string): Promise<{ invoice: Invoice }> {
  const response = await api.get(`/pos/invoices/${id}`);
  return response.data;
}

export async function saveHeldBill(payload: HoldBillPayload): Promise<{ message: string; heldBill: HeldBill }> {
  const response = await api.post('/pos/held-bills', payload);
  return response.data;
}

export async function getHeldBills(): Promise<{ heldBills: HeldBill[] }> {
  const response = await api.get('/pos/held-bills');
  return response.data;
}

export async function getHeldBillById(id: string): Promise<{ heldBill: HeldBill }> {
  const response = await api.get(`/pos/held-bills/${id}`);
  return response.data;
}

export async function deleteHeldBill(id: string): Promise<{ message: string }> {
  const response = await api.delete(`/pos/held-bills/${id}`);
  return response.data;
}
