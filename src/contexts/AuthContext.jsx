// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '../services/authService';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Función para verificar si el token ha expirado
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      // Decodificar el token JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      return Date.now() >= exp;
    } catch (error) {
      console.error('Error al verificar token:', error);
      return true;
    }
  };

  // ✅ Función para limpiar sesión expirada
  const clearExpiredSession = () => {
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      console.log('Sesión expirada, limpiando...');
      authService.logout();
      setUser(null);
      return true;
    }
    return false;
  };

  // ✅ Inicialización con verificación de expiración
  useEffect(() => {
    const init = () => {
      // Verificar si la sesión expiró
      const sessionExpired = clearExpiredSession();
      
      if (!sessionExpired) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // ✅ Verificar expiración periódicamente (cada minuto)
  useEffect(() => {
    const checkSessionExpiration = () => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        console.log('Sesión expirada detectada durante verificación periódica');
        authService.logout();
        setUser(null);
        // Disparar evento personalizado para que otros componentes reaccionen
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      }
    };

    // Verificar cada 60 segundos
    const interval = setInterval(checkSessionExpiration, 60000);
    
    // También verificar cuando la ventana recupera el foco
    window.addEventListener('focus', checkSessionExpiration);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkSessionExpiration);
    };
  }, []);

  // ✅ Login con almacenamiento de datos completos
  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      
      // Verificar que los datos del usuario sean completos
      if (data.usuario) {
        // Asegurar que el email no sea null/undefined
        const userData = {
          ...data.usuario,
          U_EMAIL: data.usuario.U_EMAIL || data.usuario.email || null
        };
        setUser(userData);
        
        // Guardar el token con timestamp de expiración si no viene en el JWT
        const token = localStorage.getItem('token');
        if (token && !isTokenExpired(token)) {
          // Token válido, todo bien
        }
      }
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // ✅ Función register
  const register = async (userData) => {
    const response = await api.post('/api/usuarios/register', userData);
    return response.data;
  };

  // ✅ Logout con limpieza completa
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // ✅ Verificar autenticación con expiración
  const isAuthenticated = useMemo(() => {
    if (!user) return false;
    // Verificar token nuevamente
    const token = localStorage.getItem('token');
    return !!token && !isTokenExpired(token);
  }, [user]);

  const isAdmin = useMemo(() => user?.U_ROL === 'ADMIN', [user]);

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};