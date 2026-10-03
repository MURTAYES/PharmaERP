import axios from 'axios';

const api = axios.create({
  baseURL: '/api/reports',
  withCredentials: true,
});

export interface DateQueryFilter {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  billedBy?: string;
  search?: string;
  page?: number;
  limit?: number;
  type?: string;
  itemId?: string;
}

export const reportApi = {
  getDashboardKPIs: async () => {
    const res = await api.get('/dashboard-kpis');
    return res.data;
  },

  getSalesSummary: async (params?: DateQueryFilter) => {
    const res = await api.get('/sales-summary', { params });
    return res.data;
  },

  getSalesByItem: async (params?: DateQueryFilter) => {
    const res = await api.get('/sales-by-item', { params });
    return res.data;
  },

  getProfitAndLoss: async (params?: DateQueryFilter) => {
    const res = await api.get('/profit-loss', { params });
    return res.data;
  },

  getPriceOverrides: async (params?: DateQueryFilter) => {
    const res = await api.get('/price-overrides', { params });
    return res.data;
  },

  getNonFefo: async (params?: DateQueryFilter) => {
    const res = await api.get('/non-fefo', { params });
    return res.data;
  },

  getStockValuation: async () => {
    const res = await api.get('/stock-valuation');
    return res.data;
  },

  getReturnsReport: async (params?: DateQueryFilter) => {
    const res = await api.get('/returns', { params });
    return res.data;
  },

  getStockMovementLedger: async (params?: DateQueryFilter) => {
    const res = await api.get('/stock-ledger', { params });
    return res.data;
  },
};
