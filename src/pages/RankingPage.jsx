// src/pages/RankingPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Medal, ArrowLeft, TrendingUp, Award, Star, RefreshCw, ChevronUp, ChevronDown, Bell, Wifi, WifiOff, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

const RankingPage = () => {
  const { id } = useParams();
  const [ranking, setRanking] = useState([]);
  const [previousRanking, setPreviousRanking] = useState({});
  const [loading, setLoading] = useState(true);
  const [quinielaNombre, setQuinielaNombre] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [animating, setAnimating] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 🔥 Socket.IO para tiempo real
  const { isConnected, lastMessage } = useSocket(id);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [rankingActualizado, setRankingActualizado] = useState(false);

  // 🔥 Efecto para escuchar mensajes en tiempo real del ranking
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'RANKING_ACTUALIZADO') {
      setNotificationMessage('🏆 El ranking ha sido actualizado en tiempo real');
      setShowNotification(true);
      setRankingActualizado(true);
      
      // Recargar ranking silenciosamente
      cargarRanking(true); // true = silencioso (sin mostrar loading)
      
      setTimeout(() => {
        setShowNotification(false);
        setRankingActualizado(false);
      }, 4000);
    } else if (lastMessage && lastMessage.type === 'RESULTADO_ACTUALIZADO') {
      setNotificationMessage(`⚽ Resultado actualizado: ${lastMessage.partido?.EQUIPO_1_NOMBRE} vs ${lastMessage.partido?.EQUIPO_2_NOMBRE}`);
      setShowNotification(true);
      
      // Recargar ranking silenciosamente
      cargarRanking(true);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 4000);
    }
  }, [lastMessage]);

  const cargarRanking = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      // Guardar ranking anterior para detectar cambios
      const previous = {};
      ranking.forEach((item, idx) => {
        previous[item.U_CODIGO] = idx;
      });
      setPreviousRanking(previous);
      
      const response = await api.get(`/api/quinielas/${id}/ranking`);
      const newRanking = response.data.data || [];
      
      // Detectar cambios de posición para animar
      const posicionCambios = {};
      newRanking.forEach((item, newPos) => {
        const oldPos = previous[item.U_CODIGO];
        if (oldPos !== undefined && oldPos !== newPos) {
          posicionCambios[item.U_CODIGO] = oldPos > newPos ? 'up' : 'down';
        }
      });
      setAnimating(posicionCambios);
      
      setRanking(newRanking);
      setLastUpdate(new Date());
      
      if (newRanking.length > 0 && !quinielaNombre) {
        setQuinielaNombre(newRanking[0].NOMBRE_QUINIELA);
      }
      
      // Limpiar animaciones después de 2 segundos
      setTimeout(() => {
        setAnimating({});
      }, 2000);
      
    } catch (error) {
      if (!silencioso) {
        toast.error('Error al cargar ranking');
      }
      //console.error(error);
    } finally {
      if (!silencioso) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [id, ranking, quinielaNombre]);

  useEffect(() => {
    cargarRanking();
  }, [id]);

  // Auto-refresh cada 30 segundos (solo si no está conectado por Socket)
  useEffect(() => {
    if (!autoRefresh || isConnected) return;
    
    const interval = setInterval(() => {
      cargarRanking(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, cargarRanking, isConnected]);

  const getMedalIcon = (posicion) => {
    if (posicion === 1) return <Medal className="h-6 w-6 text-yellow-500" />;
    if (posicion === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (posicion === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return null;
  };

  const getPositionBadge = (posicion) => {
    if (posicion === 1) return "bg-yellow-100 text-yellow-800";
    if (posicion === 2) return "bg-gray-100 text-gray-800";
    if (posicion === 3) return "bg-amber-100 text-amber-800";
    return "bg-gray-50 text-gray-600";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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

      {/* 🔥 Indicador de ranking actualizado */}
      {rankingActualizado && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white rounded-lg shadow-lg p-3 animate-slide-down">
          <TrendingUp className="h-5 w-5 inline mr-2" />
          ¡Ranking actualizado!
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
            <span className="text-xs text-gray-500">
              {autoRefresh ? 'Actualizando cada 30s' : 'Desconectado'}
            </span>
          </>
        )}
      </div>

      <Link to="/mis-quinielas" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Mis Quinielas
      </Link>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Ranking</h1>
              <button
                onClick={() => cargarRanking(false)}
                disabled={isRefreshing}
                className="p-1 hover:bg-white/20 rounded-full transition disabled:opacity-50"
                title="Actualizar ranking"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="mt-2 text-indigo-100">{quinielaNombre || `Quiniela #${id}`}</p>
            {lastUpdate && (
              <p className="text-xs text-indigo-200 mt-1">
                Última actualización: {lastUpdate.toLocaleTimeString()}
                {!isConnected && autoRefresh && " (actualizando cada 30s)"}
                {isConnected && " (tiempo real activo)"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                disabled={isConnected}
                className="rounded disabled:opacity-50"
              />
              Auto-refresh
            </label>
            <TrendingUp className="h-12 w-12 opacity-30" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aciertos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicciones</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exactos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efectividad</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ranking.map((item, index) => {
                const position = index + 1;
                const cambio = animating[item.U_CODIGO];
                const animationClass = cambio === 'up' ? 'animate-bounce-up bg-green-50' : 
                                      cambio === 'down' ? 'animate-bounce-down bg-red-50' : '';
                
                return (
                  <tr 
                    key={item.U_CODIGO} 
                    className={`${position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''} ${animationClass} transition-all duration-500`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getMedalIcon(position)}
                        <span className={`font-bold px-2 py-1 rounded-full text-sm ${getPositionBadge(position)}`}>
                          #{position}
                        </span>
                        {cambio === 'up' && <ChevronUp className="h-4 w-4 text-green-500 animate-pulse" />}
                        {cambio === 'down' && <ChevronDown className="h-4 w-4 text-red-500 animate-pulse" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {item.U_NOMBRE} {item.U_APELLIDO}
                      </div>
                      <div className="text-xs text-gray-500">{item.U_CODIGO}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="text-lg font-bold text-indigo-600">
                          {item.PUNTOS_TOTALES || 0} pts
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-semibold text-green-600">
                          {item.TOTAL_ACIERTOS  || 0}
                        </span>
                        <span className="text-xs text-gray-400">
                          / {item.TOTAL_PREDICCIONES || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {item.TOTAL_PREDICCIONES || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-600">
                          {item.ACIERTOS_EXACTOS || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(item.PORCENTAJE_ACIERTO || 0, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {item.PORCENTAJE_ACIERTO || 0}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {ranking.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay datos de ranking disponibles</p>
            <p className="text-sm text-gray-400 mt-2">Los resultados aparecerán cuando los partidos finalicen</p>
          </div>
        )}
      </div>

      {/* Animaciones CSS */}
      <style>{`
        @keyframes bounceUp {
          0%, 100% { transform: translateY(0); background-color: transparent; }
          50% { transform: translateY(-5px); background-color: rgb(220, 252, 231); }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); background-color: transparent; }
          50% { transform: translateY(5px); background-color: rgb(254, 226, 226); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-bounce-up { animation: bounceUp 0.6s ease-in-out; }
        .animate-bounce-down { animation: bounceDown 0.6s ease-in-out; }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default RankingPage;