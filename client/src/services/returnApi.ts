import axios from 'axios';

const api = axios.create({
  baseURL: '/api/returns',
  withCredentials: true,
});

export interface SalesReturnPayload {
  invoiceId: string;
  lines: Array<{
    itemId: string;
    batchId: string;
    unit: 'piece' | 'strip' | 'box';
    quantity: number;
    destinationBucket: 'sellable' | 'damaged' | 'expired';
  }>;
  refundMethod: 'cash' | 'original_payment';
  reasonCategory: string;
  reasonDetail: string;
}

export interface SupplierReturnPayload {
  supplierName: string;
  supplierInvoiceRef?: string;
  lines: Array<{
    batchId: string;
    fromBucket: 'damaged' | 'expired';
    quantityPieces: number;
  }>;
  reasonCategory: string;
  reasonDetail: string;
}

export const returnApi = {
  searchInvoices: async (search: string) => {
    const res = await api.get('/invoices/search', { params: { search } });
    return res.data;
  },

  getInvoiceReturnSummary: async (invoiceId: string) => {
    const res = await api.get(`/invoices/${invoiceId}/return-summary`);
    return res.data;
  },

  processSalesReturn: async (payload: SalesReturnPayload) => {
    const res = await api.post('/sales', payload);
    return res.data;
  },

  getCreditNotes: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get('/credit-notes', { params });
    return res.data;
  },

  getCreditNoteById: async (id: string) => {
    const res = await api.get(`/credit-notes/${id}`);
    return res.data;
  },

  createSupplierReturn: async (payload: SupplierReturnPayload) => {
    const res = await api.post('/supplier', payload);
    return res.data;
  },

  getSupplierReturns: async (params?: { page?: number; limit?: number; search?: string }) => {
    const res = await api.get('/supplier', { params });
    return res.data;
  },
};
