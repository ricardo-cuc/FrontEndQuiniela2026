// src/components/admin/UsuariosActivos.jsx
import React, { useState, useEffect } from 'react';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { io } from 'socket.io-client';

const UsuariosActivos = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('🔌 Admin conectado a presencia');
      setConnected(true);
    });

    newSocket.on('usuarios-actualizados', (listaUsuarios) => {
      setUsuarios(listaUsuarios);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // También puedes obtener la lista via API
  const fetchUsuarios = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const API_KEY = 'QNL_537490A8DF994B36BB687DEE';
      const response = await fetch('http://localhost:3000/api/usuarios/activos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-api-key': API_KEY
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsuarios(data.usuarios);
      }
    } catch (error) {
      console.error('Error fetching usuarios activos:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-600" />
          Usuarios Activos
        </h3>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center text-xs text-green-500">
              <Wifi className="h-3 w-3 mr-1" /> Tiempo real
            </span>
          ) : (
            <span className="flex items-center text-xs text-gray-400">
              <WifiOff className="h-3 w-3 mr-1" /> Sin conexión
            </span>
          )}
          <button
            onClick={fetchUsuarios}
            className="text-xs text-indigo-500 hover:text-indigo-700"
          >
            Actualizar
          </button>
        </div>
      </div>
      
      <div className="text-2xl font-bold text-indigo-600 mb-2">{usuarios.length}</div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {usuarios.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay usuarios activos</p>
        ) : (
          usuarios.map((usuario, index) => (
            <div key={index} className="flex items-center justify-between text-sm border-b pb-2">
              <span className="font-medium">{usuario.nombre}</span>
              <span className="text-gray-400 text-xs">{usuario.u_codigo}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsuariosActivos;