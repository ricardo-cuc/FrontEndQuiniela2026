// src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { getGlobalSocket, subscribeToSocketEvent } from '../App';

export const useSocket = (quinielaId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const socket = getGlobalSocket();
    
    if (socket) {
      setIsConnected(socket.connected);
      
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      // Unirse a la sala si hay quinielaId
      if (quinielaId && socket.connected) {
        socket.emit('join-quiniela', quinielaId);
        console.log(`📡 Unido a sala quiniela_${quinielaId}`);
      }
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        
        if (quinielaId && socket) {
          socket.emit('leave-quiniela', quinielaId);
        }
      };
    }
  }, [quinielaId]);

  // Suscribirse a eventos
  useEffect(() => {
    const handleResultado = (data) => {
      console.log('📢 Evento resultado_actualizado:', data);
      setLastMessage(data);
    };
    
    const handleRanking = (data) => {
      console.log('📢 Evento ranking_actualizado:', data);
      setLastMessage(data);
    };
    
    const handlePrediccion = (data) => {
      console.log('📢 Evento nueva_prediccion:', data);
      setLastMessage(data);
    };
    
    const handlePrediccionesBloqueadas = (data) => {
      console.log('📢 Evento predicciones_bloqueadas:', data);
      setLastMessage(data);
    };
    
    const handlePrediccionesBloqueadasGlobal = (data) => {
      console.log('📢 Evento predicciones_bloqueadas_global:', data);
      setLastMessage(data);
    };
    
    const unsubscribe1 = subscribeToSocketEvent('resultado_actualizado', handleResultado);
    const unsubscribe2 = subscribeToSocketEvent('ranking_actualizado', handleRanking);
    const unsubscribe3 = subscribeToSocketEvent('nueva_prediccion', handlePrediccion);
    const unsubscribe4 = subscribeToSocketEvent('predicciones_bloqueadas', handlePrediccionesBloqueadas);
    const unsubscribe5 = subscribeToSocketEvent('predicciones_bloqueadas_global', handlePrediccionesBloqueadasGlobal);
    
    return () => {
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
      unsubscribe4();
      unsubscribe5();
    };
  }, []);

  return { isConnected, lastMessage };
};