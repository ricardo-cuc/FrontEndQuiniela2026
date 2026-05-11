import axios from 'axios';
import { authService } from './authService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY || ''
  }
});

let isRefreshing = false;
let queue = [];

const processQueue = (token = null) => {
  queue.forEach(p => {
    token ? p.resolve(token) : p.reject();
  });
  queue = [];
};

// REQUEST
api.interceptors.request.use((config) => {
  // ✅ CAMBIADO: localStorage → sessionStorage
  const token = sessionStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!config.headers['x-api-key']) {
    config.headers['x-api-key'] = import.meta.env.VITE_API_KEY || '';
  }

  return config;
});

// RESPONSE
api.interceptors.response.use(
  res => res,

  async (error) => {
    const original = error.config;

    if (!error.response) return Promise.reject(error);

    if (error.response.status === 401 && !original._retry) {

      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject
          });
        });
      }

      isRefreshing = true;

      try {
        const newToken = await authService.refreshToken();

        processQueue(newToken);

        original.headers.Authorization = `Bearer ${newToken}`;

        return api(original);

      } catch (err) {
        processQueue(null);
        authService.logout();
        return Promise.reject(err);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;