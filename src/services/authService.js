// services/authService.js
import api from './api';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// ✅ Función para decodificar y verificar expiración del token
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convertir a milisegundos
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
        
        // Programar refresh automático si es necesario
        this.scheduleTokenRefresh(data.token);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // ✅ Función para renovar token automáticamente
  scheduleTokenRefresh: (token) => {
    const remainingTime = getTokenRemainingTime(token);
    // Si queda menos de 5 minutos, programar refresh en el momento adecuado
    const refreshThreshold = 5 * 60 * 1000; // 5 minutos antes de expirar
    const timeToRefresh = Math.max(remainingTime - refreshThreshold, 0);
    
    if (timeToRefresh > 0 && timeToRefresh < 30 * 60 * 1000) { // Solo si queda menos de 30 min
      setTimeout(async () => {
        console.log('Intentando renovar token automáticamente...');
        try {
          await authService.refreshToken();
        } catch (error) {
          console.error('Error al renovar token automáticamente:', error);
          // No hacer logout automático aquí, dejar que el interceptor maneje el 401
        }
      }, timeToRefresh);
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
        
        // Programar próximo refresh
        this.scheduleTokenRefresh(newToken);
        
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
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    delete api.defaults.headers.common['Authorization'];
    console.log('Sesión cerrada correctamente');
  },

  getCurrentUser: () => {
    const userStr = sessionStorage.getItem(USER_KEY);
    const token = sessionStorage.getItem(TOKEN_KEY);
    
    // ✅ Verificar si el token expiró
    if (token && isTokenExpired(token)) {
      console.log('Token expirado al obtener usuario, cerrando sesión');
      authService.logout();
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

  // ✅ Método para obtener el token actual (válido)
  getToken: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token && !isTokenExpired(token)) {
      return token;
    }
    return null;
  },

  // ✅ Método para verificar si hay una sesión activa
  isAuthenticated: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return token !== null && !isTokenExpired(token);
  },

  // ✅ Método para actualizar datos del usuario sin hacer login
  updateUser: (userData) => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    }
    return null;
  },

  // ✅ Método para obtener tiempo restante de sesión
  getSessionRemainingTime: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return getTokenRemainingTime(token);
  }
};