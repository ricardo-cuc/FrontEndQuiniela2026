// components/SocketStatus.jsx
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { getGlobalSocket } from '../App';

export const SocketStatus = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      const socket = getGlobalSocket();
      setIsConnected(socket?.connected || false);
    };

    // Verificar inmediatamente
    checkConnection();

    // Escuchar eventos del socket global
    const socket = getGlobalSocket();
    if (socket) {
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
      socket.on('connect_error', () => setIsConnected(false));
    }

    // Verificar periódicamente
    const interval = setInterval(checkConnection, 3000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
        isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
      </div>
    </div>
  );
};