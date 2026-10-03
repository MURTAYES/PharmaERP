import { api } from './api.ts';
import { PharmacySettings } from '../types/index.ts';

export const settingsApi = {
  async get(): Promise<{ settings: PharmacySettings }> {
    const res = await api.get<{ settings: PharmacySettings }>('/settings');
    return res.data;
  },

  async update(data: Partial<PharmacySettings>): Promise<{ message: string; settings: PharmacySettings }> {
    const res = await api.put<{ message: string; settings: PharmacySettings }>('/settings', data);
    return res.data;
  },
};

export const getSettings = settingsApi.get;
