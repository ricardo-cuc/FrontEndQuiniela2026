// src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useSocket = (quinielaId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // 🔥 CONFIGURACIÓN PARA EVITAR ERRORES DE WEBSOCKET
    // Usar polling en lugar de websocket para mayor compatibilidad con túneles
    socketRef.current = io(SOCKET_URL, {
      transports: ['polling', 'websocket'], // Primero intenta polling, luego websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      forceNew: true
    });

    socketRef.current.on('connect', () => {
      console.log('🔌 Conectado al servidor Socket.IO');
      setIsConnected(true);
      
      if (quinielaId) {
        socketRef.current.emit('join-quiniela', quinielaId);
      }
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Desconectado del servidor Socket.IO:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.log('⚠️ Error de conexión Socket.IO:', error.message);
      setIsConnected(false);
    });

    // Escuchar eventos
    socketRef.current.on('resultado-actualizado', (data) => {
      console.log('📢 Evento resultado-actualizado:', data);
      setLastMessage(data);
    });

    socketRef.current.on('ranking-actualizado', (data) => {
      console.log('📢 Evento ranking-actualizado:', data);
      setLastMessage(data);
    });

    socketRef.current.on('nueva-prediccion', (data) => {
      console.log('📢 Evento nueva-prediccion:', data);
      setLastMessage(data);
    });

    return () => {
      if (socketRef.current) {
        if (quinielaId) {
          socketRef.current.emit('leave-quiniela', quinielaId);
        }
        socketRef.current.disconnect();
      }
    };
  }, [quinielaId]);

  return { socket: socketRef.current, isConnected, lastMessage };
};