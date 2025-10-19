import apiClient from '../apiClient';
import type { Customer, CreateCustomerDto } from '../../types';

export const customerService = {
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>('/Customers');
    return response.data;
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/Customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/Customers', data);
    return response.data;
  },

  update: async (id: number, data: CreateCustomerDto): Promise<Customer> => {
    const response = await apiClient.put<Customer>(`/Customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/Customers/${id}`);
  },
};