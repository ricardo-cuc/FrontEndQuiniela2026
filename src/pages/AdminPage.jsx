import React, { useState, useEffect } from 'react';
import { Shield, Users, Trophy, Calendar, PlusCircle, CheckCircle, LayoutGrid, Bell, Wifi, WifiOff, X, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

const AdminPage = () => {
  // 🔥 Socket.IO para tiempo real (modo admin - escucha todas las quinielas)
  const { isConnected, lastMessage } = useSocket(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [ultimaActividad, setUltimaActividad] = useState(null);

  // 🔥 Efecto para escuchar mensajes en tiempo real
  useEffect(() => {
    if (lastMessage) {
      let message = '';
      let icon = '';
      switch (lastMessage.type) {
        case 'RESULTADO_ACTUALIZADO':
          message = `⚽ Resultado actualizado: ${lastMessage.partido?.EQUIPO_1_NOMBRE} ${lastMessage.partido?.Q_GOLES_E1} - ${lastMessage.partido?.Q_GOLES_E2} ${lastMessage.partido?.EQUIPO_2_NOMBRE}`;
          setUltimaActividad({
            tipo: 'RESULTADO',
            mensaje: message,
            timestamp: new Date()
          });
          toast.success(message);
          break;
        case 'RANKING_ACTUALIZADO':
          message = `🏆 Ranking actualizado para quiniela ID: ${lastMessage.quinielaId}`;
          setUltimaActividad({
            tipo: 'RANKING',
            mensaje: message,
            timestamp: new Date()
          });
          toast.info(message);
          break;
        case 'NUEVA_PREDICCION':
          message = `📝 Nueva predicción de ${lastMessage.prediccion?.usuario || 'un usuario'}`;
          setUltimaActividad({
            tipo: 'PREDICCION',
            mensaje: message,
            timestamp: new Date()
          });
          toast.success(message);
          break;
        default:
          message = 'Actualización en el sistema';
      }
      
      setNotificationMessage(message);
      setShowNotification(true);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [lastMessage]);

  const adminSections = [
    {
      title: 'Campeonatos',
      description: 'Crea y gestiona los campeonatos',
      icon: <LayoutGrid className="h-8 w-8 text-orange-600" />,
      link: '/admin/campeonatos',
      color: 'bg-orange-50',
      badge: ultimaActividad?.tipo === 'CAMPEONATO' ? 'Nuevo' : null
    },
    {
      title: 'Crear Equipo',
      description: 'Registra nuevos equipos en el sistema',
      icon: <Users className="h-8 w-8 text-green-600" />,
      link: '/admin/crear-equipo',
      color: 'bg-green-50'
    },
    {
      title: 'Crear Grupo',
      description: 'Organiza equipos en grupos',
      icon: <Calendar className="h-8 w-8 text-yellow-600" />,
      link: '/admin/crear-grupo',
      color: 'bg-yellow-50'
    },
    {
      title: 'Crear Partido',
      description: 'Programa nuevos partidos',
      icon: <PlusCircle className="h-8 w-8 text-purple-600" />,
      link: '/admin/crear-partido',
      color: 'bg-purple-50'
    },
    {
      title: 'Inscribir Usuarios',
      description: 'Agrega usuarios a quinielas',
      icon: <Users className="h-8 w-8 text-blue-600" />,
      link: '/admin/inscribir-usuario',
      color: 'bg-blue-50'
    }
    //,
    // {
    //   title: 'Registrar Resultados',
    //   description: 'Ingresa los resultados de los partidos y calcula puntos automáticamente',
    //   icon: <CheckCircle className="h-8 w-8 text-green-600" />,
    //   link: '/admin/resultados',
    //   color: 'bg-green-50',
    //   highlight: true
    // }
  ];

  return (
    <div>
      {/* 🔥 Notificación en tiempo real */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white rounded-lg shadow-lg p-4 max-w-md flex items-center gap-3 animate-slide-up">
          <Bell className="h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{notificationMessage}</p>
            <p className="text-xs opacity-75">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-white hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 🔥 Indicador de conexión Socket.IO */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-md">
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-xs text-gray-500">Monitor en tiempo real</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-xs text-gray-500">Sin conexión</span>
          </>
        )}
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-12 w-12 mr-4" />
            <div>
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
              <p className="mt-2">Gestiona campeonatos, quinielas, equipos, grupos, resultados y más</p>
              {isConnected && (
                <p className="text-xs text-indigo-200 mt-1 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Monitor en tiempo real activo
                </p>
              )}
            </div>
          </div>
          {ultimaActividad && (
            <div className="bg-white/20 rounded-lg p-3 text-sm hidden lg:block">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Última actividad:</span>
                <span className="font-medium">{ultimaActividad.mensaje.substring(0, 40)}...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section, index) => (
          <Link
            key={index}
            to={section.link}
            className={`${section.color} rounded-lg shadow-md p-6 hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer relative ${
              section.highlight ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </div>
              {section.icon}
            </div>
            {section.badge && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                {section.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Panel de estadísticas en tiempo real */}
      {isConnected && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Actividad en tiempo real
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              ✅ Conectado al servidor de eventos en tiempo real
            </p>
            <p className="text-sm text-gray-500">
              📡 Los cambios en resultados y ranking se reflejarán instantáneamente
            </p>
            <p className="text-sm text-gray-500">
              👥 Todos los administradores ven las actualizaciones en simultáneo
            </p>
          </div>
        </div>
      )}

      {/* Animaciones CSS */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default AdminPage;