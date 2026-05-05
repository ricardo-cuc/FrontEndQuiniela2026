// src/services/api.js
import axios from 'axios';

// ============================================
// CONFIGURACIÓN - LEER VARIABLES DE ENTORNO
// ============================================
const API_URL = import.meta.env.VITE_API_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

// console.log('🔧 API Configuración:');
// console.log('  URL:', API_URL);
// console.log('  API Key:', API_KEY ? '✅ presente' : '❌ falta');

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  },
  withCredentials: false,
  timeout: 30000
});

// ============================================
// INTERCEPTOR DE SOLICITUDES (REQUEST)
// ============================================
api.interceptors.request.use(
  (config) => {
    // console.log(`🔵 [API] ${config.method?.toUpperCase()} ${config.url}`);
    
    // Asegurar que la API Key esté presente
    if (!config.headers['X-API-Key'] && API_KEY) {
      config.headers['X-API-Key'] = API_KEY;
    }

    // Agregar token JWT si existe (desde localStorage)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // console.log(`🔵 [API] Token añadido a ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Error en petición:', error);
    return Promise.reject(error);
  }
);

// ============================================
// INTERCEPTOR DE RESPUESTAS (RESPONSE)
// 🔥 SIN REDIRECCIONES AUTOMÁTICAS
// ============================================
api.interceptors.response.use(
  (response) => {
    // console.log(`✅ [API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
   // console.error(`❌ [API] Error ${error.response?.status} en ${error.config?.url}`);
    //console.error('  Detalle:', error.response?.data);
    
    // Solo limpiar localStorage pero NO redirigir automáticamente
    if (error.response?.status === 401) {
      console.warn('  🔒 Sesión expirada o token inválido - Limpiando localStorage');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      // 🔥 COMENTADO - No redirigir automáticamente
      // if (!error.config?.url?.includes('/verificar-estado')) {
      //   window.location.href = '/login';
      // }
    }
    
    return Promise.reject(error);
  }
);

export default api;