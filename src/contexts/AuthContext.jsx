import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ============================================
  // INIT AUTH
  // ============================================
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

  // ============================================
  // LOGIN
  // ============================================
  const login = async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.usuario);
    return data;
  };

  // ============================================
  // LOGOUT
  // ============================================
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  // ============================================
  // HELPERS (ENTERPRISE FIX)
  // ============================================
  const isAuthenticated = useMemo(() => {
    return !!user;
  }, [user]);

  const isAdmin = useMemo(() => {
    return user?.U_ROL === 'ADMIN';
  }, [user]);

  const value = {
    user,
    login,
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