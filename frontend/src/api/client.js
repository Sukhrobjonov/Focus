import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token and Telegram headers to requests
api.interceptors.request.use((config) => {
  // 1. Add JWT Token
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Add Telegram Init Data (if in TWA)
  if (window.Telegram?.WebApp?.initData) {
    config.headers['x-telegram-init-data'] = window.Telegram.WebApp.initData;
  }

  return config;
});

// Interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
