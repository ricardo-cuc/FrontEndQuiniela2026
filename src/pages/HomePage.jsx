import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Users, Award, TrendingUp, CheckCircle, Star, Bell, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';
import { DriverTour } from '../components/onboarding/DriverTour';
import { FloatingHelpWidget } from '../components/help/FloatingHelpWidget';
import { InfoTooltip } from '../components/common/InfoTooltip';
import { ModalParticipantes } from '../components/participantes/ModalParticipantes';

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
  const [showTour, setShowTour] = useState(false);
  const [misQuinielasList, setMisQuinielasList] = useState([]);
  
  const [showModalParticipantes, setShowModalParticipantes] = useState(false);
  const [quinielaSeleccionada, setQuinielaSeleccionada] = useState(null);
  const [showSelectorQuinielas, setShowSelectorQuinielas] = useState(false);
  const [quinielasDisponibles, setQuinielasDisponibles] = useState([]);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState({});
  const [totalMensajesNoLeidos, setTotalMensajesNoLeidos] = useState(0);
  
  // ✅ Nuevo estado para selector de ranking
  const [showRankingSelector, setShowRankingSelector] = useState(false);
  
  const { isConnected, lastMessage } = useSocket(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [estadisticasActualizadas, setEstadisticasActualizadas] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mensajes_no_leidos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMensajesNoLeidos(parsed);
        const total = Object.values(parsed).reduce((a, b) => a + b, 0);
        setTotalMensajesNoLeidos(total);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mensajes_no_leidos', JSON.stringify(mensajesNoLeidos));
    const total = Object.values(mensajesNoLeidos).reduce((a, b) => a + b, 0);
    setTotalMensajesNoLeidos(total);
  }, [mensajesNoLeidos]);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('driver_tour_completed');
    if (!tourCompleted && user && !loading) {
      setTimeout(() => setShowTour(true), 1500);
    }
  }, [user, loading]);

  useEffect(() => {
    if (lastMessage) {
      let message = '';
      switch (lastMessage.type) {
        case 'RESULTADO_ACTUALIZADO':
          message = `⚽ Resultado actualizado`;
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
        case 'NUEVO_MENSAJE_CHAT':
          const quinielaId = lastMessage.quinielaId;
          if (quinielaId) {
            setMensajesNoLeidos(prev => ({
              ...prev,
              [quinielaId]: (prev[quinielaId] || 0) + 1
            }));
          }
          message = `💬 Nuevo mensaje en el chat`;
          break;
        default:
          message = '🔄 Actualización en tus quinielas';
          cargarEstadisticas();
      }
      setNotificationMessage(message);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
  }, [lastMessage]);

  const marcarComoLeidos = (quinielaId) => {
    setMensajesNoLeidos(prev => ({ ...prev, [quinielaId]: 0 }));
  };

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const misQuinielasRes = await api.post('/api/quinielas/mis-quinielas');
      const data = misQuinielasRes.data.data;
      let misQuinielas = [];
      
      if (Array.isArray(data)) misQuinielas = data;
      else if (data?.quinielas) misQuinielas = data.quinielas;
      else misQuinielas = [];
      
      setMisQuinielasList(misQuinielas);
      
      let totalPredicciones = 0, miPuntuacion = 0, totalAciertos = 0;
      for (const quiniela of misQuinielas) {
        totalPredicciones += quiniela.TOTAL_PREDICCIONES || 0;
        miPuntuacion += quiniela.PUNTOS_TOTALES || 0;
        totalAciertos += quiniela.TOTAL_ACIERTOS || 0;
      }
      
      let totalParticipantes = 0;
      for (const quiniela of misQuinielas.slice(0, 5)) {
        try {
          const res = await api.get(`/api/quinielas/${quiniela.ID_QUINIELA}/participantes/count`);
          totalParticipantes += res.data.data?.total_participantes || 0;
        } catch (e) {}
      }
      
      setStats({
        misQuinielas: misQuinielas.length,
        misPredicciones: totalPredicciones,
        participantes: totalParticipantes,
        miPuntuacion: miPuntuacion,
        totalAciertos: totalAciertos
      });
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarEstadisticas(); }, []);

  const handleParticipantesClick = () => {
    if (misQuinielasList.length === 0) {
      toast.error('No estás inscrito en ninguna quiniela');
      return;
    }
    if (misQuinielasList.length === 1) {
      setQuinielaSeleccionada(misQuinielasList[0]);
      marcarComoLeidos(misQuinielasList[0].ID_QUINIELA);
      setShowModalParticipantes(true);
    } else {
      setQuinielasDisponibles(misQuinielasList);
      setShowSelectorQuinielas(true);
    }
  };

  // ✅ Nueva función para manejar el ranking dinámico
  const handleRankingClick = () => {
    if (misQuinielasList.length === 0) {
      toast.error('No estás inscrito en ninguna quiniela');
      return;
    }
    if (misQuinielasList.length === 1) {
      navigate(`/ranking/${misQuinielasList[0].ID_QUINIELA}`);
    } else {
      setQuinielasDisponibles(misQuinielasList);
      setShowRankingSelector(true);
    }
  };

  // ✅ Nueva función para navegar al ranking desde el selector
  const handleRankingSelect = (quiniela) => {
    navigate(`/ranking/${quiniela.ID_QUINIELA}`);
    setShowRankingSelector(false);
  };

  // ✅ Calcular posición promedio (aproximada) para mostrar
  const posicionPromedio = misQuinielasList.length > 0 ? 'Top' : '?';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {showTour && <DriverTour onComplete={() => setShowTour(false)} />}
      <FloatingHelpWidget />

      {/* Selector de quinielas para Participantes */}
      {showSelectorQuinielas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden mx-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 sm:p-5 text-white">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold">Seleccionar quiniela</h2>
                  <p className="text-xs sm:text-sm text-indigo-200">Elige en qué quiniela interactuar</p>
                </div>
                {totalMensajesNoLeidos > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {totalMensajesNoLeidos} nuevo(s)
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
              {quinielasDisponibles.map((q) => {
                const noLeidos = mensajesNoLeidos[q.ID_QUINIELA] || 0;
                return (
                  <button
                    key={q.ID_QUINIELA}
                    onClick={() => {
                      setQuinielaSeleccionada(q);
                      marcarComoLeidos(q.ID_QUINIELA);
                      setShowSelectorQuinielas(false);
                      setShowModalParticipantes(true);
                    }}
                    className="w-full text-left p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition active:bg-indigo-100"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                          {q.NOMBRE}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          🏆 {q.C_CAMPEONATO} | ⭐ {q.PUNTOS_TOTALES || 0} pts
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {noLeidos > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                            {noLeidos > 9 ? '9+' : noLeidos}
                          </span>
                        )}
                        <span className="text-indigo-400 group-hover:translate-x-1 transition">→</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="p-3 sm:p-4 border-t border-gray-200">
              <button onClick={() => setShowSelectorQuinielas(false)} className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Nuevo Selector de quinielas para Ranking */}
      {showRankingSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden mx-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-5 text-white">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex-1">
                  <h2 className="text-lg sm:text-xl font-bold">Ver Ranking</h2>
                  <p className="text-xs sm:text-sm text-purple-200">Selecciona una quiniela</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
              {quinielasDisponibles.map((q) => (
                <button
                  key={q.ID_QUINIELA}
                  onClick={() => handleRankingSelect(q)}
                  className="w-full text-left p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition active:bg-purple-100"
                >
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                        {q.NOMBRE}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        🏆 {q.C_CAMPEONATO} | ⭐ {q.PUNTOS_TOTALES || 0} pts
                      </p>
                    </div>
                    <span className="text-purple-400 group-hover:translate-x-1 transition">→</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 sm:p-4 border-t border-gray-200">
              <button onClick={() => setShowRankingSelector(false)} className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showModalParticipantes && (
        <ModalParticipantes
          isOpen={showModalParticipantes}
          onClose={() => {
            setShowModalParticipantes(false);
            setQuinielaSeleccionada(null);
          }}
          quinielaId={quinielaSeleccionada?.ID_QUINIELA}
          quinielaNombre={quinielaSeleccionada?.NOMBRE}
        />
      )}

      {/* Notificación */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 bg-indigo-600 text-white rounded-lg shadow-lg p-3 sm:p-4 max-w-md mx-3 sm:mx-0 flex items-center gap-3 animate-slide-up">
          <Bell className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{notificationMessage}</p>
            <p className="text-xs opacity-75">{new Date().toLocaleTimeString()}</p>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-white/70 hover:text-white flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {estadisticasActualizadas && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 bg-green-500 text-white rounded-lg shadow-lg p-3 animate-slide-down max-w-sm mx-3 sm:mx-0">
          <TrendingUp className="h-5 w-5 inline mr-2" />
          ¡Tus estadísticas se han actualizado!
        </div>
      )}

      {/* Banner de bienvenida */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 md:p-8 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              ¡Bienvenido, {user?.U_NOMBRE || 'Usuario'}! 👋
            </h1>
            <p className="text-sm sm:text-base">
              Participa en nuestras quinielas, predice los resultados y gana puntos.
              {isConnected && <span className="ml-2 text-xs sm:text-sm opacity-75">📡 Tiempo real activo</span>}
            </p>
          </div>
          <InfoTooltip message="Las estadísticas se actualizan automáticamente" position="bottom" />
        </div>
      </div>

      {/* Tarjetas - Grid responsivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Mis Quinielas */}
        <div onClick={() => navigate('/mis-quinielas')} id="mis-quinielas-link" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer hover:bg-indigo-50 active:bg-indigo-100 group">
          <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Mis Quinielas</h3>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{stats.misQuinielas}</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Activas donde participas</p>
        </div>

        {/* Mis Predicciones */}
        <div onClick={() => navigate('/mis-predicciones')} id="mis-predicciones-link" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer hover:bg-blue-50 active:bg-blue-100 group">
          <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Mis Predicciones</h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.misPredicciones}</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Pronósticos realizados</p>
        </div>

        {/* Mis Aciertos */}
        <div onClick={() => navigate('/mis-aciertos')} id="mis-aciertos-link" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer hover:bg-green-50 active:bg-green-100 group">
          <Star className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Mis Aciertos</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.totalAciertos}</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Resultados correctos</p>
        </div>

        {/* Mi Puntuación */}
        <div onClick={() => navigate('/mis-quinielas')} id="mi-puntuacion-link" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer hover:bg-yellow-50 active:bg-yellow-100 group">
          <Award className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Mi Puntuación</h3>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{stats.miPuntuacion} pts</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Puntos totales</p>
        </div>

        {/* Participantes */}
        <div onClick={handleParticipantesClick} id="participantes-link" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer hover:bg-indigo-50 active:bg-indigo-100 group">
          <div className="relative inline-block">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mb-2 group-hover:scale-110 transition" />
            {totalMensajesNoLeidos > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {totalMensajesNoLeidos > 9 ? '9+' : totalMensajesNoLeidos}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Participantes y Chat</h3>
          <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{stats.participantes}</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">¡Interactúa con ellos!</p>
          {totalMensajesNoLeidos > 0 && (
            <p className="text-xs text-red-500 mt-1 animate-pulse font-medium">📨 {totalMensajesNoLeidos} nuevo(s)</p>
          )}
        </div>

        {/* ✅ Ranking DINÁMICO */}
        <div onClick={handleRankingClick} id="ranking-link" className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition cursor-pointer hover:bg-purple-50 active:bg-purple-100 group">
          <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-700">Ranking</h3>
          <p className="text-2xl sm:text-3xl font-bold text-purple-600">{posicionPromedio}</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {misQuinielasList.length === 0 
              ? 'No estás inscrito' 
              : misQuinielasList.length === 1 
                ? 'Tu posición' 
                : `${misQuinielasList.length} quinielas`}
          </p>
          {misQuinielasList.length > 1 && (
            <p className="text-xs text-purple-500 mt-2 font-medium">📊 Seleccionar quiniela</p>
          )}
        </div>
      </div>

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