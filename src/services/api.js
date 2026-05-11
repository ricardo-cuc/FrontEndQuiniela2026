import axios from 'axios';
import { authService } from './authService';

// DEBUG
console.log('API URL:', import.meta.env.VITE_API);

const api = axios.create({
  baseURL: import.meta.env.VITE_API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_API_KEY || ''
  }
});

let isRefreshing = false;
let queue = [];

const processQueue = (token = null) => {
  queue.forEach((p) => {
    token ? p.resolve(token) : p.reject();
  });

  queue = [];
};

// =====================================
// REQUEST INTERCEPTOR
// =====================================

api.interceptors.request.use((config) => {

  const token = sessionStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!config.headers['x-api-key']) {
    config.headers['x-api-key'] =
      import.meta.env.VITE_API_KEY || '';
  }

  return config;
});

// =====================================
// RESPONSE INTERCEPTOR
// =====================================

api.interceptors.response.use(

  (response) => response,

  async (error) => {

    const original = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    // =====================================
    // TOKEN EXPIRED
    // =====================================

    if (
      error.response.status === 401 &&
      !original._retry
    ) {

      original._retry = true;

      // =====================================
      // WAIT IF REFRESHING
      // =====================================

      if (isRefreshing) {

        return new Promise((resolve, reject) => {

          queue.push({

            resolve: (token) => {

              original.headers.Authorization =
                `Bearer ${token}`;

              resolve(api(original));
            },

            reject
          });
        });
      }

      isRefreshing = true;

      try {

        const newToken =
          await authService.refreshToken();

        processQueue(newToken);

        original.headers.Authorization =
          `Bearer ${newToken}`;

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