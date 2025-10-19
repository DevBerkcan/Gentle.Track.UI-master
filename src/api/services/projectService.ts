import apiClient from '../apiClient';
import type { Project, CreateProjectDto, DashboardStats } from '../../types';

export const projectService = {
  getAll: async (includeArchived: boolean = false): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>('/Projects', {
      params: { includeArchived },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`/Projects/${id}`);
    return response.data;
  },

  getByTrackingNumber: async (trackingNumber: string): Promise<Project> => {
    const response = await apiClient.get<Project>(
      `/Projects/tracking/${trackingNumber}`
    );
    return response.data;
  },

  generateTrackingNumber: async (): Promise<{ trackingNumber: string }> => {
    const response = await apiClient.get<{ trackingNumber: string }>(
      '/Projects/generate-tracking'
    );
    return response.data;
  },

  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.post<Project>('/Projects', data);
    return response.data;
  },

  update: async (id: number, data: CreateProjectDto): Promise<Project> => {
    const response = await apiClient.put<Project>(`/Projects/${id}`, data);
    return response.data;
  },

  archive: async (id: number): Promise<void> => {
    await apiClient.post(`/Projects/${id}/archive`);
  },

  restore: async (id: number): Promise<void> => {
    await apiClient.post(`/Projects/${id}/restore`);
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Projects/${id}`);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>('/Dashboard/stats');
    return response.data;
  },
};