import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 MODO NGROK - Forzar usuario para pruebas
    // Comenta este bloque cuando quieras volver a la autenticación normal
    //console.log('🔓 [NGROK MODE] Forzando usuario autenticado');
    const testUser = {
      U_CODIGO: '00656',
      U_ROL: 'ADMIN',
      U_CORREO: 'admin@quiniela.com',
      U_NOMBRES: 'Admin',
      U_APELLIDOS: 'Test'
    };
    setUser(testUser);
    localStorage.setItem('token', 'test-token-ngrok');
    localStorage.setItem('user', JSON.stringify(testUser));
    setLoading(false);
    //console.log('✅ Usuario forzado:', testUser);
    return; // Salir del useEffect
    // 🔥 FIN DEL MODO NGROK
    
    // Código original (comentado)
    // const currentUser = authService.getCurrentUser();
    // setUser(currentUser);
    // setLoading(false);
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

  const isAdmin = () => {
    return user?.U_ROL === 'ADMIN';
  };

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
        isAdmin,           
        isAuthenticated,   
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};