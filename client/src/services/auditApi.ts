import { api } from './api.ts';
import { AuditLogItem } from '../types/index.ts';

export interface AuditQuery {
  page?: number;
  limit?: number;
  action?: string;
  username?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditResponse {
  logs: AuditLogItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const auditApi = {
  async getLogs(params: AuditQuery = {}): Promise<AuditResponse> {
    const res = await api.get<AuditResponse>('/audit', { params });
    return res.data;
  },
};
