// src/api/axios.ts
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { enqueue, flush } from '@/utils/offlineQueue';

const api = axios.create({
  baseURL: 'https://bypass-api.jobs-conseil.host/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    "ngrok-skip-browser-warning": "true"
  },
  withCredentials: true,
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

// Response interceptor for 401 errors and offline queue
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 — automatic logout
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }

    // Handle network errors when offline — queue mutation requests
    if (!error.response && !navigator.onLine) {
      const method = error.config?.method?.toLowerCase();
      if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
        enqueue(error.config);
        return Promise.resolve({
          data: { queued: true, message: 'Request queued for offline sync' },
          status: 202,
          statusText: 'Queued',
          headers: {},
          config: error.config,
        });
      }
    }

    return Promise.reject(error);
  }
);

// Flush offline queue when coming back online
window.addEventListener('online', () => {
  flush(api).then(({ success, failed }) => {
    if (success > 0) {
      console.log(`Synced ${success} queued request(s)${failed > 0 ? `, ${failed} failed` : ''}`);
    }
  });
});

export default api;
