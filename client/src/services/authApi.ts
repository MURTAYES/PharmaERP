import { api, setAccessToken } from './api.ts';
import { User } from '../types/index.ts';

export interface LoginResponse {
  message: string;
  accessToken: string;
  user: User;
}

export const authApi = {
  async login(credentials: { username: string; password: string }): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/login', credentials);
    setAccessToken(res.data.accessToken);
    return res.data;
  },

  async refresh(): Promise<{ accessToken: string; user: User }> {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/refresh');
    setAccessToken(res.data.accessToken);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async getMe(): Promise<{ user: User }> {
    const res = await api.get<{ user: User }>('/auth/me');
    return res.data;
  },
};
