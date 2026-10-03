import { api } from './api.ts';
import { User, UserRole } from '../types/index.ts';

export interface CreateUserData {
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
}

export interface UpdateUserData {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export const userApi = {
  async getAll(): Promise<{ users: User[] }> {
    const res = await api.get<{ users: User[] }>('/users');
    return res.data;
  },

  async create(data: CreateUserData): Promise<{ message: string; user: User }> {
    const res = await api.post<{ message: string; user: User }>('/users', data);
    return res.data;
  },

  async update(id: string, data: UpdateUserData): Promise<{ message: string; user: User }> {
    const res = await api.put<{ message: string; user: User }>(`/users/${id}`, data);
    return res.data;
  },

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const res = await api.post<{ message: string }>(`/users/${id}/reset-password`, { newPassword });
    return res.data;
  },
};
