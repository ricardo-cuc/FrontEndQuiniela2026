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
  
  // Estados para el modal de participantes
  const [showModalParticipantes, setShowModalParticipantes] = useState(false);
  const [quinielaSeleccionada, setQuinielaSeleccionada] = useState(null);
  const [showSelectorQuinielas, setShowSelectorQuinielas] = useState(false);
  const [quinielasDisponibles, setQuinielasDisponibles] = useState([]);
  
  // Estados para mensajes no leídos
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState({});
  const [totalMensajesNoLeidos, setTotalMensajesNoLeidos] = useState(0);
  
  // Socket.IO para tiempo real
  const { isConnected, lastMessage } = useSocket(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [estadisticasActualizadas, setEstadisticasActualizadas] = useState(false);

  // Cargar mensajes no leídos desde localStorage al iniciar
  useEffect(() => {
    const saved = localStorage.getItem('mensajes_no_leidos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMensajesNoLeidos(parsed);
        const total = Object.values(parsed).reduce((a, b) => a + b, 0);
        setTotalMensajesNoLeidos(total);
      } catch (e) {
        console.error('Error parsing mensajes_no_leidos:', e);
      }
    }
  }, []);

  // Guardar mensajes no leídos en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem('mensajes_no_leidos', JSON.stringify(mensajesNoLeidos));
    const total = Object.values(mensajesNoLeidos).reduce((a, b) => a + b, 0);
    setTotalMensajesNoLeidos(total);
  }, [mensajesNoLeidos]);

  // Verificar si debe mostrar el tour
  useEffect(() => {
    const tourCompleted = localStorage.getItem('driver_tour_completed');
    if (!tourCompleted && user && !loading) {
      setTimeout(() => setShowTour(true), 1500);
    }
  }, [user, loading]);

  // Efecto para escuchar mensajes en tiempo real
  useEffect(() => {
    if (lastMessage) {
      let message = '';
      switch (lastMessage.type) {
        case 'RESULTADO_ACTUALIZADO':
          message = `⚽ Resultado actualizado: ${lastMessage.partido?.EQUIPO_1_NOMBRE || 'Local'} vs ${lastMessage.partido?.EQUIPO_2_NOMBRE || 'Visitante'}`;
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
        case 'NUEVO_MENSAJE_CHAT':
          const quinielaId = lastMessage.quinielaId;
          if (quinielaId) {
            setMensajesNoLeidos(prev => ({
              ...prev,
              [quinielaId]: (prev[quinielaId] || 0) + 1
            }));
          }
          message = `💬 Nuevo mensaje en ${lastMessage.quinielaNombre || 'una quiniela'}`;
          break;
        default:
          message = '🔄 Actualización en tus quinielas';
          cargarEstadisticas();
      }
      
      setNotificationMessage(message);
      setShowNotification(true);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [lastMessage]);

  // Marcar mensajes como leídos para una quiniela
  const marcarComoLeidos = (quinielaId) => {
    setMensajesNoLeidos(prev => ({
      ...prev,
      [quinielaId]: 0
    }));
  };

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
      
      setMisQuinielasList(misQuinielas);
      
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
          console.error('Error al contar participantes:', e);
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
      console.error('Error cargando estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // Función para manejar clic en Participantes
  const handleParticipantesClick = () => {
    if (misQuinielasList.length === 0) {
      toast.error('No estás inscrito en ninguna quiniela');
      return;
    }
    
    if (misQuinielasList.length === 1) {
      const quiniela = misQuinielasList[0];
      setQuinielaSeleccionada(quiniela);
      marcarComoLeidos(quiniela.ID_QUINIELA);
      setShowModalParticipantes(true);
    } else {
      setQuinielasDisponibles(misQuinielasList);
      setShowSelectorQuinielas(true);
    }
  };

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
      {/* Tour guiado interactivo para nuevos usuarios */}
      {showTour && <DriverTour onComplete={() => setShowTour(false)} />}

      {/* Widget de ayuda flotante */}
      <FloatingHelpWidget />

      {/* Selector de quinielas (cuando hay múltiples) */}
      {showSelectorQuinielas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Seleccionar quiniela</h2>
                  <p className="text-sm text-indigo-200">Elige en qué quiniela quieres interactuar</p>
                </div>
                {totalMensajesNoLeidos > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {totalMensajesNoLeidos} nuevo(s)
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
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
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition group"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600">
                          {q.NOMBRE}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          🏆 {q.C_CAMPEONATO} | ⭐ {q.PUNTOS_TOTALES || 0} pts
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {noLeidos > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[20px] text-center animate-pulse">
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
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowSelectorQuinielas(false)}
                className="w-full text-gray-500 hover:text-gray-700 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Participantes */}
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

      {/* Banner de bienvenida */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-4">
              ¡Bienvenido, {userInfo.NOMBRE_COMPLETO || user?.U_NOMBRE || 'Usuario'}! 👋
            </h1>
            <p className="text-lg">
              Participa en nuestras quinielas, predice los resultados y gana puntos.
              {isConnected && <span className="ml-2 text-sm opacity-75">📡 Tiempo real activo</span>}
            </p>
          </div>
          <InfoTooltip 
            message="Las estadísticas se actualizan automáticamente cuando hay cambios en tus quinielas"
            position="bottom"
          />
        </div>
      </div>

      {/* Estadísticas con navegación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Tarjeta de Mis Quinielas */}
        <div
          onClick={handleMisQuinielasClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-indigo-50 group relative"
          id="mis-quinielas-link"
        >
          <Trophy className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mis Quinielas</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.misQuinielas}</p>
          <p className="text-sm text-gray-400 mt-2">Activas donde participas</p>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <InfoTooltip message="Ver todas tus quinielas activas" position="left" />
          </div>
        </div>

        {/* Tarjeta de Mis Predicciones */}
        <div
          onClick={handleMisPrediccionesClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-blue-50 group relative"
        >
          <CheckCircle className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mis Predicciones</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.misPredicciones}</p>
          <p className="text-sm text-gray-400 mt-2">Realizadas</p>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <InfoTooltip message="Total de pronósticos que has realizado" position="left" />
          </div>
        </div>

        {/* Tarjeta de Mis Aciertos */}
        <div
          onClick={handleMisAciertosClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-green-50 group relative"
        >
          <Star className="h-8 w-8 text-green-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mis Aciertos</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalAciertos}</p>
          <p className="text-sm text-gray-400 mt-2">En todas las quinielas</p>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <InfoTooltip message="Veces que acertaste el resultado exacto" position="left" />
          </div>
        </div>

        {/* Tarjeta de Mi Puntuación */}
        <div
          onClick={handleMiPuntuacionClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-yellow-50 group relative"
        >
          <Award className="h-8 w-8 text-yellow-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mi Puntuación</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.miPuntuacion} pts</p>
          <p className="text-sm text-gray-400 mt-2">Acumulados</p>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <InfoTooltip message="Puntos totales acumulados en todas tus quinielas" position="left" />
          </div>
        </div>

        {/* Tarjeta de Participantes */}
        <div
          onClick={handleParticipantesClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-indigo-50 group relative"
          id="participantes-link"
        >
          <div className="relative inline-block">
            <Users className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition" />
            {totalMensajesNoLeidos > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {totalMensajesNoLeidos > 9 ? '9+' : totalMensajesNoLeidos}
              </span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Participantes</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.participantes}</p>
          <p className="text-sm text-gray-400 mt-2">¡Interactúa con ellos!</p>
          {totalMensajesNoLeidos > 0 && (
            <p className="text-xs text-red-500 mt-1 animate-pulse font-medium">
              📨 {totalMensajesNoLeidos} mensaje(s) nuevo(s)
            </p>
          )}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <InfoTooltip message="Ver participantes y enviar reacciones" position="left" />
          </div>
        </div>

        {/* Tarjeta de Ranking */}
        <div
          onClick={() => navigate('/ranking/15')}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-purple-50 group relative"
          id="ranking-link"
        >
          <Trophy className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Ranking</h3>
          <p className="text-3xl font-bold text-purple-600">#1</p>
          <p className="text-sm text-gray-400 mt-2">Tu posición</p>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
            <InfoTooltip message="Ver el ranking de esta quiniela" position="left" />
          </div>
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