// services/authService.js
import api from './api';
import { scheduleTokenRefresh, clearTokenSchedule } from './tokenScheduler';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// ✅ Función para decodificar y verificar expiración del token
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    const expired = Date.now() >= exp;
    
    if (expired) {
      console.log('Token expirado:', new Date(exp), 'vs ahora:', new Date());
    }
    return expired;
  } catch (error) {
    console.error('Error al decodificar token:', error);
    return true;
  }
};

// ✅ Obtener tiempo restante del token en milisegundos
const getTokenRemainingTime = (token) => {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    const remaining = exp - Date.now();
    return remaining > 0 ? remaining : 0;
  } catch {
    return 0;
  }
};

export const authService = {

  login: async (credentials) => {
    try {
      const response = await api.post('/api/usuarios/login', credentials);
      const data = response.data;

      if (data?.token) {
        // Usar sessionStorage para persistencia durante la sesión
        sessionStorage.setItem(TOKEN_KEY, data.token);
        if (data.refreshToken) {
          sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        }
        // Asegurar que el usuario tenga email válido
        const userData = {
          ...data.usuario,
          U_EMAIL: data.usuario.U_EMAIL || data.usuario.email || null
        };
        sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        
        // ✅ Programar refresh automático después del login
        scheduleTokenRefresh();
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('No refresh token');
    
    try {
      const response = await api.post('/api/auth/refresh', { refreshToken });
      
      const newToken = response.data.token;
      if (newToken) {
        sessionStorage.setItem(TOKEN_KEY, newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        // ✅ Programar próximo refresh después de renovar
        scheduleTokenRefresh();
        
        console.log('Token renovado exitosamente');
        return newToken;
      }
      throw new Error('No se recibió nuevo token');
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Si falla el refresh, hacer logout
      this.logout();
      throw error;
    }
  },

  logout: () => {
    // ✅ Limpiar el scheduler programado
    clearTokenSchedule();
    
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    console.log('Sesión cerrada correctamente');
  },

  getCurrentUser: () => {
    const userStr = sessionStorage.getItem(USER_KEY);
    const token = sessionStorage.getItem(TOKEN_KEY);
    
    if (token && isTokenExpired(token)) {
      console.log('Token expirado al obtener usuario, cerrando sesión');
      this.logout();
      return null;
    }
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user;
      } catch (error) {
        console.error('Error al parsear usuario:', error);
        return null;
      }
    }
    return null;
  },

  getToken: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token && !isTokenExpired(token)) {
      return token;
    }
    return null;
  },

  isAuthenticated: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token !== null && !isTokenExpired(token);
  },

  updateUser: (userData) => {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    }
    return null;
  },

  getSessionRemainingTime: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return getTokenRemainingTime(token);
  }
};