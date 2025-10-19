// src/api/services/notificationService.ts
import apiClient from '../apiClient';
import type { NotificationSubscription, CreateSubscriptionDto, ToggleSubscriptionDto } from '../../types';

export const notificationService = {
  // Check if subscribed
  isSubscribed: async (projectId: number, email: string): Promise<boolean> => {
    const response = await apiClient.get<{ isSubscribed: boolean }>(
      `/Notifications/is-subscribed?projectId=${projectId}&email=${email}`
    );
    return response.data.isSubscribed;
  },

  // Get subscription details
  getSubscription: async (projectId: number, email: string): Promise<NotificationSubscription> => {
    const response = await apiClient.get<NotificationSubscription>(
      `/Notifications/subscription?projectId=${projectId}&email=${email}`
    );
    return response.data;
  },

  // Customer subscribe
  subscribe: async (data: CreateSubscriptionDto): Promise<NotificationSubscription> => {
    const response = await apiClient.post<NotificationSubscription>('/Notifications/subscribe', data);
    return response.data;
  },

  // Admin subscribe (authenticated)
  subscribeAdmin: async (projectId: number, email: string): Promise<NotificationSubscription> => {
    const data: CreateSubscriptionDto = { projectID: projectId, email };
    const response = await apiClient.post<NotificationSubscription>('/Notifications/subscribe-admin', data);
    return response.data;
  },

  // Customer toggle
  toggle: async (projectId: number, email: string): Promise<NotificationSubscription> => {
    const data: ToggleSubscriptionDto = { projectID: projectId, email };
    const response = await apiClient.post<NotificationSubscription>('/Notifications/toggle', data);
    return response.data;
  },

  // Admin toggle (authenticated)
  toggleAdmin: async (projectId: number, email: string): Promise<NotificationSubscription> => {
    const data: ToggleSubscriptionDto = { projectID: projectId, email };
    const response = await apiClient.post<NotificationSubscription>('/Notifications/toggle-admin', data);
    return response.data;
  },

  // Unsubscribe
  unsubscribe: async (projectId: number, email: string): Promise<void> => {
    await apiClient.delete(`/Notifications/unsubscribe?projectId=${projectId}&email=${email}`);
  },
};