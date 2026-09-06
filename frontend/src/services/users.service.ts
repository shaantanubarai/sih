import { api } from './api';
import {
  Department,
  PaginatedResponse,
  User,
  UserStatusUpdatePayload,
} from '@/types';

export const usersService = {
  listUsers: async (page = 1, pageSize = 30): Promise<PaginatedResponse<User>> => {
    const res = await api.get<PaginatedResponse<User>>('/users', {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  getUser: async (userId: string): Promise<User> => {
    const res = await api.get<User>(`/users/${userId}`);
    return res.data;
  },

  updateUserStatus: async (
    userId: string,
    payload: UserStatusUpdatePayload
  ): Promise<User> => {
    const res = await api.patch<User>(`/users/${userId}/status`, payload);
    return res.data;
  },

  listDepartments: async (
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<Department>> => {
    const res = await api.get<PaginatedResponse<Department>>('/departments', {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  createDepartment: async (payload: {
    name: string;
    code: string;
    description?: string;
  }): Promise<Department> => {
    const res = await api.post<Department>('/departments', payload);
    return res.data;
  },

  updateDepartment: async (
    departmentId: string,
    payload: { name?: string; description?: string }
  ): Promise<Department> => {
    const res = await api.patch<Department>(`/departments/${departmentId}`, payload);
    return res.data;
  },
};
