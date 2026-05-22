// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '../services/authService';
import { scheduleTokenRefresh, clearTokenSchedule } from '../services/tokenScheduler';
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
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() >= exp;
    } catch (error) {
      console.error('Error al verificar token:', error);
      return true;
    }
  };

  // ✅ Función para limpiar sesión expirada
  const clearExpiredSession = () => {
    const token = sessionStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      //console.log('Sesión expirada, limpiando...');
      authService.logout();
      clearTokenSchedule();
      setUser(null);
      return true;
    }
    return false;
  };

  // ✅ Inicialización con verificación de expiración
  useEffect(() => {
    const init = () => {
      const sessionExpired = clearExpiredSession();
      
      if (!sessionExpired) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          //console.log('🔴 [AUTH] Usuario cargado de sessionStorage:', currentUser);
          setUser(currentUser);
          scheduleTokenRefresh();
        } else {
          setUser(null);
          clearTokenSchedule();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // ✅ Verificar expiración periódicamente
  useEffect(() => {
    const checkSessionExpiration = () => {
      const token = sessionStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        //console.log('Sesión expirada detectada durante verificación periódica');
        authService.logout();
        clearTokenSchedule();
        setUser(null);
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      }
    };

    const interval = setInterval(checkSessionExpiration, 60000);
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
      
      //console.log('=========================================');
      //console.log('🔴 [AUTH] Respuesta del login:');
      //console.log('   - data completo:', data);
      //console.log('   - data.usuario:', data.usuario);
      //console.log('   - Propiedades de data.usuario:', Object.keys(data.usuario || {}));
      //console.log('=========================================');
      
      if (data.usuario) {
        const userData = {
          U_CODIGO: data.usuario.U_CODIGO || data.usuario.codigo || data.usuario.id,
          U_NOMBRE: data.usuario.U_NOMBRE || data.usuario.nombre,
          U_APELLIDO: data.usuario.U_APELLIDO || data.usuario.apellido,
          U_CORREO: data.usuario.U_CORREO || data.usuario.email || data.usuario.U_EMAIL,
          U_EMAIL: data.usuario.U_EMAIL || data.usuario.email || data.usuario.U_CORREO,
          U_ROL: data.usuario.U_ROL || data.usuario.rol,
        };
        
        //console.log('🔴 [AUTH] userData normalizado a guardar:', userData);
        //console.log('🔴 [AUTH] U_CODIGO guardado:', userData.U_CODIGO);
        
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
        
        scheduleTokenRefresh();
      }
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // ✅ Función register - CORREGIDA con valores por defecto
  const register = async (userData) => {
    try {
      // ✅ Agregar campos por defecto si no vienen
      const dataToSend = {
        U_CODIGO: userData.U_CODIGO,
        U_NOMBRE: userData.U_NOMBRE,
        U_APELLIDO: userData.U_APELLIDO,
        U_CORREO: userData.U_CORREO,
        U_PASSWORD: userData.U_PASSWORD,
        U_ROL: userData.U_ROL || 'USUARIO',
        U_ESTADO: userData.U_ESTADO || 'ACTIVO'
      };
      
      //console.log('=========================================');
      //console.log('🔴 [AUTH REGISTER] Enviando al backend:');
      //console.log('   - dataToSend:', dataToSend);
      //console.log('=========================================');
      
      const response = await api.post('/api/usuarios/register', dataToSend);
      return response.data;
    } catch (error) {
      console.error('❌ [AUTH REGISTER] Error:', error.response?.data);
      throw error;
    }
  };

  // ✅ Logout con limpieza completa
  const logout = () => {
    clearTokenSchedule();
    authService.logout();
    setUser(null);
  };

  // ✅ Verificar autenticación
  const isAuthenticated = useMemo(() => {
    if (!user) return false;
    const token = sessionStorage.getItem('token');
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