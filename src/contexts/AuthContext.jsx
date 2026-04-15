import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.usuario);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    return response;
  };

  // ✅ isAdmin como función (no como valor booleano)
  const isAdmin = () => {
    return user?.U_ROL === 'ADMIN';
  };

  // ✅ isAuthenticated como función
  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        register,
        isAdmin,           // ← Ahora es una función
        isAuthenticated,   // ← Ahora es una función
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};