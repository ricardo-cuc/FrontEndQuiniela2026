import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Users, Calendar, ArrowLeft, Bell, Wifi, WifiOff, X, TrendingUp, Award, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

const QuinielaDetailPage = () => {
  const { id } = useParams();
  const [quiniela, setQuiniela] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalParticipantes: 0,
    totalPredicciones: 0,
    partidosFinalizados: 0
  });
  
  // 🔥 Socket.IO para tiempo real
  const { isConnected, lastMessage } = useSocket(id);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationData, setNotificationData] = useState(null);
  const [participantesActualizados, setParticipantesActualizados] = useState(false);

  useEffect(() => {
    cargarDetalle();
    cargarEstadisticas();
  }, [id]);

  // 🔥 Efecto para escuchar mensajes en tiempo real
  useEffect(() => {
    if (lastMessage) {
      //console.log('📡 Evento recibido en frontend:', lastMessage);
      
      let message = '';
      
      // 🔥 Detectar por tipo o por estructura del mensaje
      const isResultado = lastMessage.type === 'RESULTADO_ACTUALIZADO' || 
                         (lastMessage.EQUIPO_1_NOMBRE && lastMessage.Q_GOLES_E1 !== undefined);
      
      const isRanking = lastMessage.type === 'RANKING_ACTUALIZADO' ||
                       (lastMessage.ranking_actualizado !== undefined);
      
      if (isResultado) {
        // Mostrar notificación detallada del resultado
        const equipo1 = lastMessage.EQUIPO_1_NOMBRE || 'Local';
        const equipo2 = lastMessage.EQUIPO_2_NOMBRE || 'Visitante';
        const goles1 = lastMessage.Q_GOLES_E1 ?? lastMessage.goles_local ?? 0;
        const goles2 = lastMessage.Q_GOLES_E2 ?? lastMessage.goles_visitante ?? 0;
        
        message = `⚽ ${equipo1} ${goles1} - ${goles2} ${equipo2}`;
        setNotificationData({ equipo1, goles1, equipo2, goles2 });
        cargarEstadisticas();
      } 
      else if (isRanking) {
        message = `🏆 ¡El ranking se ha actualizado!`;
        cargarEstadisticas();
        setParticipantesActualizados(true);
        setTimeout(() => setParticipantesActualizados(false), 3000);
      }
      else if (lastMessage.type === 'NUEVA_PREDICCION') {
        message = `📝 Nueva predicción registrada en esta quiniela`;
        cargarEstadisticas();
        setParticipantesActualizados(true);
        setTimeout(() => setParticipantesActualizados(false), 3000);
      }
      else {
        message = '🔄 Actualización en esta quiniela';
        cargarEstadisticas();
      }
      
      setNotificationMessage(message);
      setShowNotification(true);
      
      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        setShowNotification(false);
        setNotificationData(null);
      }, 5000);
    }
  }, [lastMessage]);

  const cargarDetalle = async () => {
    try {
      const response = await api.get('/api/quinielas');
      const encontrada = response.data.data?.find(q => q.ID_QUINIELA === parseInt(id));
      setQuiniela(encontrada);
    } catch (error) {
      toast.error('Error al cargar detalles');
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      // Cargar participantes
      const participantesRes = await api.get(`/api/quinielas/${id}/participantes/count`);
      const totalParticipantes = participantesRes.data.data?.total_participantes || 0;
      
      // Cargar predicciones y partidos
      const prediccionesRes = await api.post(`/api/quinielas/${id}/partidos-con-predicciones`);
      const partidos = prediccionesRes.data.data?.partidos || [];
      
      const totalPredicciones = partidos.filter(p => p.YA_PREDICHO === 1).length;
      const partidosFinalizados = partidos.filter(p => p.GOLES_REALES_LOCAL !== null).length;
      
      setEstadisticas({
        totalParticipantes,
        totalPredicciones,
        partidosFinalizados
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!quiniela) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Quiniela no encontrada</p>
        <Link to="/quinielas" className="text-indigo-600 hover:underline mt-4 inline-block">
          Volver a quinielas
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* 🔥 Notificación en tiempo real - VERSION MEJORADA */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white rounded-lg shadow-lg p-4 max-w-md flex items-center gap-3 animate-slide-up">
          {notificationData ? (
            // Notificación con resultado de partido
            <div className="flex items-center gap-3 w-full">
              <div className="bg-white/20 rounded-full p-2">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">{notificationData.equipo1} vs {notificationData.equipo2}</p>
                <p className="text-lg font-black">
                  {notificationData.goles1} - {notificationData.goles2}
                </p>
              </div>
            </div>
          ) : (
            // Notificación genérica
            <>
              <Bell className="h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{notificationMessage}</p>
                <p className="text-xs opacity-75">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </>
          )}
          <button 
            onClick={() => setShowNotification(false)} 
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 🔥 Indicador de actualización */}
      {participantesActualizados && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white rounded-lg shadow-lg p-3 animate-slide-down">
          <TrendingUp className="h-5 w-5 inline mr-2" />
          ¡Estadísticas actualizadas!
        </div>
      )}

      {/* 🔥 Indicador de conexión Socket.IO */}
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

      <Link to="/quinielas" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver
      </Link>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-4">{quiniela.NOMBRE}</h1>
            <p className="text-gray-600 mb-6">{quiniela.DESCRIPCION || 'Sin descripción'}</p>
          </div>
          {isConnected && (
            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              En vivo
            </div>
          )}
        </div>
        
        {/* Estadísticas en tiempo real */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <Users className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-indigo-600">{estadisticas.totalParticipantes}</p>
            <p className="text-sm text-gray-500">Participantes</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{estadisticas.totalPredicciones}</p>
            <p className="text-sm text-gray-500">Predicciones realizadas</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <CheckCircle className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{estadisticas.partidosFinalizados}</p>
            <p className="text-sm text-gray-500">Partidos finalizados</p>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-gray-700">
            <Trophy className="h-5 w-5 mr-3 text-indigo-600" />
            <span><strong>Campeonato:</strong> {quiniela.C_CAMPEONATO}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Calendar className="h-5 w-5 mr-3 text-indigo-600" />
            <span><strong>Período:</strong> {new Date(quiniela.FECHA_INICIO).toLocaleDateString()} - {new Date(quiniela.FECHA_FIN).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Users className="h-5 w-5 mr-3 text-indigo-600" />
            <span><strong>Estado:</strong> {quiniela.ESTADO}</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Link
            to={`/ranking/${id}`}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition"
          >
            Ver Ranking
          </Link>
          <Link
            to={`/quinielas/${id}/pronosticos`}
            className={`py-2 px-4 rounded-md transition ${
              quiniela.PREDICCIONES_BLOQUEADAS 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            onClick={(e) => {
              if (quiniela.PREDICCIONES_BLOQUEADAS) {
                e.preventDefault();
                toast.error('Esta quiniela tiene las predicciones bloqueadas');
              }
            }}
          >
            Hacer Pronósticos
          </Link>
        </div>

        {/* Información de tiempo real */}
        {isConnected && (
          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <Wifi className="h-3 w-3 text-green-500" />
              Datos actualizados en tiempo real. Los cambios se reflejan automáticamente.
            </p>
          </div>
        )}
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

export default QuinielaDetailPage;