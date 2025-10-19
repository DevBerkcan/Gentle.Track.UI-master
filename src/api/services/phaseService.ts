import apiClient from '../apiClient';
import type { ProjectPhase, CreatePhaseDto } from '../../types';

export const phaseService = {
  getByProjectId: async (projectId: number): Promise<ProjectPhase[]> => {
    const response = await apiClient.get<ProjectPhase[]>(
      `/ProjectPhases/project/${projectId}`
    );
    return response.data;
  },

  create: async (data: CreatePhaseDto): Promise<ProjectPhase> => {
    const response = await apiClient.post<ProjectPhase>('/ProjectPhases', data);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<void> => {
    await apiClient.patch(`/ProjectPhases/${id}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ProjectPhases/${id}`);
  },

  moveUp: async (id: number): Promise<void> => {
    await apiClient.post(`/ProjectPhases/${id}/move-up`);
  },

  moveDown: async (id: number): Promise<void> => {
    await apiClient.post(`/ProjectPhases/${id}/move-down`);
  },

  reorder: async (projectId: number, phaseIds: number[]): Promise<void> => {
    await apiClient.post('/ProjectPhases/reorder', { projectId, phaseIds });
  },
};