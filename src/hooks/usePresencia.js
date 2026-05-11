// src/hooks/usePresencia.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API;

export const usePresencia = () => {
  const [socket, setSocket] = useState(null);
  const [usuariosActivos, setUsuariosActivos] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true
    });

    newSocket.on('connect', () => {
      console.log('🔌 Conectado a presencia');
      setConnected(true);
      
      // Registrar usuario actual
      const token = sessionStorage.getItem('token');
      if (token) {
        // Obtener datos del usuario
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (user.U_CODIGO) {
          newSocket.emit('registrar-usuario', {
            u_codigo: user.U_CODIGO,
            nombre: `${user.U_NOMBRE} ${user.U_APELLIDO}`
          });
        }
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('usuarios-actualizados', (usuarios) => {
      console.log('📊 Usuarios activos actualizados:', usuarios);
      setUsuariosActivos(usuarios);
    });

    newSocket.on('sesion-duplicada', (data) => {
      console.warn('⚠️ Sesión duplicada:', data);
      alert('Tu sesión se ha abierto en otro dispositivo');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return { socket, usuariosActivos, connected, total: usuariosActivos.length };
};