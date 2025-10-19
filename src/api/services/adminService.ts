// src/api/services/adminService.ts
import apiClient from '../apiClient';
import type { Admin, CreateAdminDto, UpdateAdminDto } from '../../types';

interface LoginResponse {
  token: string;
  refreshToken: string;
  admin: {
    adminID: number;
    email: string;
    name: string;
    role: string;
  };
}

export const adminService = {
  // ✅ Existing CRUD methods
  getAll: async (): Promise<Admin[]> => {
    const response = await apiClient.get<Admin[]>('/Admins');
    return response.data;
  },

  getById: async (id: number): Promise<Admin> => {
    const response = await apiClient.get<Admin>(`/Admins/${id}`);
    return response.data;
  },

  create: async (data: CreateAdminDto): Promise<Admin> => {
    const response = await apiClient.post<Admin>('/Admins', data);
    return response.data;
  },

  update: async (id: number, data: UpdateAdminDto): Promise<Admin> => {
    const response = await apiClient.put<Admin>(`/Admins/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Admins/${id}`);
  },

  deletePermanently: async (id: number): Promise<void> => {
    await apiClient.delete(`/Admins/${id}/permanent`);
  },

  // ✅ NEW: Authentication methods
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/Admins/login', { 
      email, 
      password 
    });
    
    // Store tokens and admin info
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    localStorage.setItem('admin', JSON.stringify(response.data.admin));
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    try {
      // Attempt to revoke the refresh token on the server
      await apiClient.post('/Admins/logout', { refreshToken });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage regardless of server response
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('admin');
      
      // Redirect to login
      window.location.href = '/login';
    }
  },

  getCurrentAdmin: async () => {
    const response = await apiClient.get('/Admins/me');
    return response.data;
  },

  refreshToken: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('Kein Refresh Token verfügbar');
    }

    try {
      const response = await apiClient.post<LoginResponse>('/Admins/refresh', { 
        refreshToken 
      });
      
      // Update stored tokens
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
      
      return response.data.token;
    } catch (error) {
      // If refresh fails, clear everything and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('admin');
      window.location.href = '/login';
      throw error;
    }
  },

  getStoredAdmin: () => {
    const adminStr = localStorage.getItem('admin');
    return adminStr ? JSON.parse(adminStr) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // ✅ Existing method
  assignProjects: async (adminId: number, projectIds: number[]): Promise<void> => {
    await apiClient.post(`/Admins/${adminId}/assign-projects`, projectIds);
  },
};