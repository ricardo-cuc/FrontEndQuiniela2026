// src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API
export const useSocket = (quinielaId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
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
        console.log(`📡 Unido a sala quiniela_${quinielaId}`);
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

    // Evento para sala específica
    socketRef.current.on('resultado_actualizado', (data) => {
      console.log('📢 Evento resultado_actualizado recibido:', data);
      setLastMessage(data);
    });

    socketRef.current.on('ranking_actualizado', (data) => {
      console.log('📢 Evento ranking_actualizado recibido:', data);
      setLastMessage(data);
    });

    socketRef.current.on('nueva_prediccion', (data) => {
      console.log('📢 Evento nueva_prediccion recibido:', data);
      setLastMessage(data);
    });

    // Evento para sala específica (predicciones bloqueadas)
    socketRef.current.on('predicciones_bloqueadas', (data) => {
      console.log('📢 Evento predicciones_bloqueadas recibido:', data);
      setLastMessage(data);
    });

    // 🔥 NUEVO: Evento GLOBAL para predicciones bloqueadas (para MisQuinielasPage)
    socketRef.current.on('predicciones_bloqueadas_global', (data) => {
      console.log('📢 Evento predicciones_bloqueadas_global recibido:', data);
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