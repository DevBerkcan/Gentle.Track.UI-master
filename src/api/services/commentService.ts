// src/api/services/commentService.ts
import apiClient from '../apiClient';
import type { Comment, CreateCommentDto } from '../../types';

export const commentService = {
  // Get all comments for a project (public access)
  getProjectComments: async (projectId: number): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>(`/Comments/project/${projectId}`);
    return response.data;
  },

  // Customer creates comment with their name
  createCustomerComment: async (data: CreateCommentDto): Promise<Comment> => {
    const response = await apiClient.post<Comment>('/Comments/customer', data);
    return response.data;
  },

  createAdminComment: async (projectId: number, message: string, authorName: string): Promise<Comment> => {
    // ✅ Use PascalCase to match C# DTO
    const data = {
      ProjectID: projectId,  // Changed from projectID
      Message: message,
      AuthorName: authorName       // Changed from message
    };
    
    console.log('Sending admin comment with data:', data); // Debug log
    
    const response = await apiClient.post<Comment>('/Comments/admin', data);
    return response.data;
  },
    getAllComments: async (): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>('/Comments/all');
    return response.data;
  },
};