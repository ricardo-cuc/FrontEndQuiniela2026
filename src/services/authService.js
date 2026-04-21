// src/services/authService.js
import api from './api';

export const authService = {
  login: async (credentials) => {
    console.log('🔵 [authService] Intentando login con:', credentials.u_correo);
    
    // 🔥 Usar la ruta correcta según tu backend
    const response = await api.post('/api/usuarios/login', {
      u_correo: credentials.u_correo,
      u_password: credentials.u_password
    });
    
    console.log('🔵 [authService] Respuesta login:', response.data);
    
    if (response.data.token) {
      // Guardar token
      localStorage.setItem('token', response.data.token);
      
      // Guardar usuario (ajusta según la estructura de tu backend)
      const userData = response.data.usuario || {
        U_CODIGO: response.data.u_codigo,
        U_CORREO: credentials.u_correo,
        U_ROL: response.data.rol || 'USER'
      };
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 🔥 IMPORTANTE: Configurar el token en axios para todas las peticiones
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      console.log('✅ [authService] Token guardado y configurado en axios');
    }
    
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/api/usuarios/register', userData);
    return response.data;
  },

  logout: () => {
    console.log('🔵 [authService] Cerrando sesión');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    window.location.href = '/login';
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // Restaurar token en axios si existe
    if (token && user) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('🔵 [authService] Token restaurado en axios');
    }
    
    return user ? JSON.parse(user) : null;
  },
  
  getToken: () => localStorage.getItem('token'),
  
  isAuthenticated: () => !!localStorage.getItem('token')
};