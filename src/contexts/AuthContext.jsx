// contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '../services/authService';
import api from '../services/api'; // ← Agrega esta importación

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.usuario);
    return data;
  };

  // ✅ AGREGAR FUNCIÓN REGISTER
  const register = async (userData) => {
    const response = await api.post('/api/usuarios/register', userData);
    return response.data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAuthenticated = useMemo(() => !!user, [user]);
  const isAdmin = useMemo(() => user?.U_ROL === 'ADMIN', [user]);

  const value = {
    user,
    login,
    register,  // ← Agrega register aquí
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