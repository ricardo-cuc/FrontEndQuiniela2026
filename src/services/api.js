// src/services/api.js
import axios from 'axios';

// ============================================
// CONFIGURACIÓN - LEER VARIABLES DE ENTORNO
// ============================================
const API_URL = import.meta.env.VITE_API_URL || 'https://rvp8br8p-3000.use2.devtunnels.ms/';
const API_KEY = import.meta.env.VITE_API_KEY;



// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY || '',
  },
});

// ============================================
// INTERCEPTOR DE SOLICITUDES (REQUEST)
// ============================================
api.interceptors.request.use(
  (config) => {
    // Asegurar que la API Key esté presente
    if (!config.headers['X-API-Key'] && API_KEY) {
      config.headers['X-API-Key'] = API_KEY;
    }

    // Agregar token JWT si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
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
// ============================================
api.interceptors.response.use(
  (response) => {
    console.log(`📥 Respuesta ${response.status} de ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ Error ${error.response?.status} en ${error.config?.url}`);
    console.error('  Detalle:', error.response?.data);
    
    // Si es error 401 (No autorizado)
    if (error.response?.status === 401) {
      console.warn('  🔒 Sesión expirada o API Key inválida');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;