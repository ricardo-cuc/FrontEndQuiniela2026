// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Users, Award, TrendingUp, CheckCircle, Star, Bell, Wifi, WifiOff, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    misQuinielas: 0,
    misPredicciones: 0,
    participantes: 0,
    miPuntuacion: 0,
    totalAciertos: 0
  });
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({});
  
  // Socket.IO para tiempo real
  const { isConnected, lastMessage } = useSocket(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [estadisticasActualizadas, setEstadisticasActualizadas] = useState(false);

  // Efecto para escuchar mensajes en tiempo real
  useEffect(() => {
    if (lastMessage) {
      let message = '';
      switch (lastMessage.type) {
        case 'RESULTADO_ACTUALIZADO':
          message = `⚽ Resultado actualizado: ${lastMessage.partido?.EQUIPO_1_NOMBRE} vs ${lastMessage.partido?.EQUIPO_2_NOMBRE}`;
          cargarEstadisticas();
          setEstadisticasActualizadas(true);
          setTimeout(() => setEstadisticasActualizadas(false), 3000);
          break;
        case 'RANKING_ACTUALIZADO':
          message = `🏆 Tu puntuación ha sido actualizada`;
          cargarEstadisticas();
          setEstadisticasActualizadas(true);
          setTimeout(() => setEstadisticasActualizadas(false), 3000);
          break;
        case 'NUEVA_PREDICCION':
          message = `📝 Nueva predicción realizada`;
          cargarEstadisticas();
          break;
        default:
          message = 'Actualización en tus quinielas';
          cargarEstadisticas();
      }
      
      setNotificationMessage(message);
      setShowNotification(true);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [lastMessage]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      const misQuinielasRes = await api.post('/api/quinielas/mis-quinielas');
      
      if (!misQuinielasRes.data || !misQuinielasRes.data.data) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      const data = misQuinielasRes.data.data;
      
      let misQuinielas = [];
      
      if (Array.isArray(data)) {
        misQuinielas = data;
      } else if (data && data.quinielas) {
        misQuinielas = data.quinielas || [];
        setUserInfo({
          U_CODIGO: data.U_CODIGO,
          NOMBRE_COMPLETO: data.NOMBRE_COMPLETO
        });
      } else if (data && Array.isArray(data.data)) {
        misQuinielas = data.data;
      } else {
        misQuinielas = [];
      }
      
      const totalMisQuinielas = misQuinielas.length;
      
      let totalPredicciones = 0;
      let miPuntuacion = 0;
      let totalAciertos = 0;
      
      for (const quiniela of misQuinielas) {
        totalPredicciones += quiniela.TOTAL_PREDICCIONES || 0;
        miPuntuacion += quiniela.PUNTOS_TOTALES || 0;
        totalAciertos += quiniela.TOTAL_ACIERTOS || 0;
      }
      
      let totalParticipantes = 0;
      const quinielasParaParticipantes = misQuinielas.slice(0, 5);
      
      for (const quiniela of quinielasParaParticipantes) {
        try {
          const participantesRes = await api.get(`/api/quinielas/${quiniela.ID_QUINIELA}/participantes/count`);
          totalParticipantes += participantesRes.data.data?.total_participantes || 0;
        } catch (e) {
          // Error silencioso
        }
      }
      
      setStats({
        misQuinielas: totalMisQuinielas,
        misPredicciones: totalPredicciones,
        participantes: totalParticipantes,
        miPuntuacion: miPuntuacion,
        totalAciertos: totalAciertos
      });
      
    } catch (error) {
      //console.error('Error cargando estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const handleMisQuinielasClick = () => {
    navigate('/mis-quinielas');
  };

  const handleMisPrediccionesClick = () => {
    navigate('/mis-predicciones');
  };

  const handleMisAciertosClick = () => {
    navigate('/mis-aciertos');
  };

  const handleMiPuntuacionClick = () => {
    navigate('/mis-quinielas');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Notificación en tiempo real */}
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

      {/* Indicador de estadísticas actualizadas */}
      {estadisticasActualizadas && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white rounded-lg shadow-lg p-3 animate-slide-down">
          <TrendingUp className="h-5 w-5 inline mr-2" />
          ¡Tus estadísticas se han actualizado!
        </div>
      )}

      {/* Indicador de conexión Socket.IO */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-md">
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-xs text-gray-500">Tiempo real</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-xs text-gray-500">Sin conexión</span>
          </>
        )}
      </div>

      {/* Banner de bienvenida */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">
          ¡Bienvenido, {userInfo.NOMBRE_COMPLETO || user?.U_NOMBRE || 'Usuario'}! 👋
        </h1>
        <p className="text-lg">
          Participa en nuestras quinielas, predice los resultados y gana puntos.
          {isConnected && <span className="ml-2 text-sm opacity-75">📡 Tiempo real activo</span>}
        </p>
      </div>

      {/* Estadísticas con navegación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Tarjeta de Mis Quinielas */}
        <div
          onClick={handleMisQuinielasClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-indigo-50 group"
        >
          <Trophy className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mis Quinielas</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.misQuinielas}</p>
          <p className="text-sm text-gray-400 mt-2">Activas donde participas</p>
        </div>

        {/* Tarjeta de Mis Predicciones */}
        <div
          onClick={handleMisPrediccionesClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-blue-50 group"
        >
          <CheckCircle className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mis Predicciones</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.misPredicciones}</p>
          <p className="text-sm text-gray-400 mt-2">Realizadas</p>
        </div>

        {/* Tarjeta de Mis Aciertos */}
        <div
          onClick={handleMisAciertosClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-green-50 group"
        >
          <Star className="h-8 w-8 text-green-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mis Aciertos</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalAciertos}</p>
          <p className="text-sm text-gray-400 mt-2">En todas las quinielas</p>
        </div>

        {/* Tarjeta de Mi Puntuación */}
        <div
          onClick={handleMiPuntuacionClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-yellow-50 group"
        >
          <Award className="h-8 w-8 text-yellow-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mi Puntuación</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.miPuntuacion} pts</p>
          <p className="text-sm text-gray-400 mt-2">Ver mis quinielas</p>
        </div>

        {/* Tarjeta de Participantes */}
        <div className="bg-white rounded-lg shadow p-6">
          <Users className="h-8 w-8 text-indigo-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-700">Participantes</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.participantes}</p>
          <p className="text-sm text-gray-400 mt-2">En tus quinielas</p>
        </div>
      </div>

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

export default HomePage;