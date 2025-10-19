// src/api/apiClient.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ❌ NICHT mehr hart codieren:
// const API_BASE_URL = 'http://94.16.104.230/api';

// ✅ über ENV (Vercel: VITE_API_BASE_URL=/api, sonst Fallback '/api')
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // wichtig wegen refreshToken-Cookie
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v?: unknown)=>void; reject: (r?: unknown)=>void; }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

// Token an alle Requests anhängen
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 401 → Refresh-Flow
apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean });
    const path = typeof window !== 'undefined' ? window.location.pathname : '';

    if (path.includes('/login') || path.includes('/kundenansicht')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/admins/refresh')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('admin');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((newToken) => {
            if (originalRequest.headers && typeof newToken === 'string') {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return apiClient(originalRequest);
          });
      }

      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken'); // optional; Cookie reicht i.d.R.
        const resp = await apiClient.post('/admins/refresh', { refreshToken }); // <-- baseURL wird genutzt
        const { token: newToken, refreshToken: newRt, admin } = resp.data;

        if (newToken) localStorage.setItem('token', newToken);
        if (newRt)    localStorage.setItem('refreshToken', newRt);
        if (admin)    localStorage.setItem('admin', JSON.stringify(admin));

        if (originalRequest.headers && newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        processQueue(null, newToken ?? null);
        return apiClient(originalRequest);
      } catch (e) {
        processQueue(e as Error, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('admin');
        window.location.href = '/login';
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    throw error;
  }
);

export default apiClient;
