import api from './api';

export const authService = {

  login: async (credentials) => {
    const response = await api.post('/api/usuarios/login', credentials);
    const data = response.data;

    if (data?.token) {
      // ✅ CAMBIADO: localStorage → sessionStorage
      sessionStorage.setItem('token', data.token);
      if (data.refreshToken) {
        sessionStorage.setItem('refreshToken', data.refreshToken);
      }
      sessionStorage.setItem('user', JSON.stringify(data.usuario));
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }

    return data;
  },

  refreshToken: async () => {
    // ✅ CAMBIADO: localStorage → sessionStorage
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await api.post('/api/auth/refresh', { refreshToken });
    
    const newToken = response.data.token;
    if (newToken) {
      sessionStorage.setItem('token', newToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    }
    return newToken;
  },

  logout: async () => {
    // ✅ CAMBIADO: localStorage → sessionStorage
    const refreshToken = sessionStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await api.post('/api/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.warn('logout error backend', e);
    }
    // ✅ CAMBIADO: removeItem de sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    // ✅ CAMBIADO: localStorage → sessionStorage
    const user = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return user ? JSON.parse(user) : null;
  }
};