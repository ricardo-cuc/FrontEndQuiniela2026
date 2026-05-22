import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, ArrowLeft, Trophy, Clock, Bell, Wifi, WifiOff, TrendingUp, X, Lock, Unlock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

const MisPrediccionesPage = () => {
  const [quinielas, setQuinielas] = useState([]);
  const [quinielaSeleccionada, setQuinielaSeleccionada] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoPartidos, setCargandoPartidos] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  
  // Socket.IO para tiempo real
  const { isConnected, lastMessage } = useSocket(quinielaSeleccionada?.ID_QUINIELA);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationIcon, setNotificationIcon] = useState(null);
  const [puntosActualizados, setPuntosActualizados] = useState(false);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    cargarMisQuinielas();
  }, []);

  // Sincronizar quinielaSeleccionada cuando cambia el bloqueo
  useEffect(() => {
    if (quinielaSeleccionada && quinielas.length > 0) {
      const quinielaActualizada = quinielas.find(q => q.ID_QUINIELA === quinielaSeleccionada.ID_QUINIELA);
      if (quinielaActualizada && quinielaActualizada.PREDICCIONES_BLOQUEADAS !== quinielaSeleccionada.PREDICCIONES_BLOQUEADAS) {
        setQuinielaSeleccionada(prev => ({ ...prev, PREDICCIONES_BLOQUEADAS: quinielaActualizada.PREDICCIONES_BLOQUEADAS }));
      }
    }
  }, [quinielas, quinielaSeleccionada?.ID_QUINIELA]);

  // Escuchar eventos de WebSocket
  useEffect(() => {
    if (lastMessage && !isUpdatingRef.current) {
      //console.log('📡 Evento recibido en MisPrediccionesPage:', lastMessage);
      
      isUpdatingRef.current = true;
      
      // Detectar resultado actualizado
      if (lastMessage.type === 'RESULTADO_ACTUALIZADO' || 
          (lastMessage.EQUIPO_1_NOMBRE && lastMessage.Q_GOLES_E1 !== undefined)) {
        
        const equipo1 = lastMessage.EQUIPO_1_NOMBRE || 'Local';
        const equipo2 = lastMessage.EQUIPO_2_NOMBRE || 'Visitante';
        const goles1 = lastMessage.Q_GOLES_E1 ?? 0;
        const goles2 = lastMessage.Q_GOLES_E2 ?? 0;
        
        setNotificationMessage(`⚽ ${equipo1} ${goles1} - ${goles2} ${equipo2}`);
        setNotificationIcon('⚽');
        setShowNotification(true);
        
        if (quinielaSeleccionada) {
          setTimeout(() => {
            seleccionarQuiniela(quinielaSeleccionada.ID_QUINIELA);
          }, 500);
        }
        
        setPuntosActualizados(true);
        setTimeout(() => setPuntosActualizados(false), 3000);
        
      } else if (lastMessage.type === 'RANKING_ACTUALIZADO') {
        setNotificationMessage(`🏆 Tus puntos pueden haber cambiado`);
        setNotificationIcon('🏆');
        setShowNotification(true);
        
        if (quinielaSeleccionada) {
          setTimeout(() => {
            seleccionarQuiniela(quinielaSeleccionada.ID_QUINIELA);
            cargarMisQuinielas();
          }, 500);
        }
        
        setPuntosActualizados(true);
        setTimeout(() => setPuntosActualizados(false), 3000);
        
      } else if (lastMessage.type === 'PREDICCIONES_BLOQUEADAS') {
        const bloqueado = lastMessage.bloqueado === true;
        const quinielaId = lastMessage.quinielaId;
        
        //console.log('🔍 Actualizando bloqueo:', { quinielaId, bloqueado });
        
        // 🔥 ACTUALIZAR EL ESTADO LOCAL DE LAS QUINIELAS
        setQuinielas(prev => {
          const nuevas = prev.map(q => 
            q.ID_QUINIELA === quinielaId 
              ? { ...q, PREDICCIONES_BLOQUEADAS: bloqueado }
              : q
          );
          //console.log('📊 Quinielas actualizadas:', nuevas.map(q => ({ id: q.ID_QUINIELA, bloqueada: q.PREDICCIONES_BLOQUEADAS })));
          return nuevas;
        });
        
        // 🔥 ACTUALIZAR LA QUINIELA SELECCIONADA SI ES LA MISMA
        if (quinielaSeleccionada?.ID_QUINIELA === quinielaId) {
          setQuinielaSeleccionada(prev => ({ ...prev, PREDICCIONES_BLOQUEADAS: bloqueado }));
          //console.log('✅ Quiniela seleccionada actualizada:', bloqueado);
        }
        
        const message = bloqueado 
          ? '🔒 Predicciones BLOQUEADAS. No podrás hacer nuevas predicciones.'
          : '🔓 Predicciones DESBLOQUEADAS. Ya puedes hacer predicciones.';
        
        setNotificationMessage(message);
        setNotificationIcon(bloqueado ? '🔒' : '🔓');
        setShowNotification(true);
        
        // Recargar partidos para actualizar botones si es necesario
        if (quinielaSeleccionada?.ID_QUINIELA === quinielaId) {
          setTimeout(() => {
            seleccionarQuiniela(quinielaId);
          }, 500);
        }
      }
      
      setTimeout(() => {
        setShowNotification(false);
        setNotificationIcon(null);
        isUpdatingRef.current = false;
      }, 5000);
    }
  }, [lastMessage, quinielaSeleccionada]);

  const cargarMisQuinielas = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/quinielas/mis-quinielas');
      
      const data = response.data.data;
      
      let quinielasArray = [];
      
      if (Array.isArray(data)) {
        quinielasArray = data;
      } else if (data && data.quinielas && Array.isArray(data.quinielas)) {
        quinielasArray = data.quinielas;
        setUserInfo({
          nombre: data.NOMBRE_COMPLETO,
          codigo: data.U_CODIGO
        });
      } else if (data && Array.isArray(data.data)) {
        quinielasArray = data.data;
      } else {
        quinielasArray = [];
      }
      
      setQuinielas(quinielasArray);
      
      if (quinielasArray.length > 0 && !quinielaSeleccionada) {
        await seleccionarQuiniela(quinielasArray[0].ID_QUINIELA);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Error al cargar tus quinielas');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarQuiniela = async (idQuiniela) => {
    try {
      setCargandoPartidos(true);
      const quiniela = quinielas.find(q => q.ID_QUINIELA === idQuiniela);
      setQuinielaSeleccionada(quiniela);
      
      const response = await api.post(`/api/quinielas/${idQuiniela}/partidos-con-predicciones`);
      
      let partidosData = [];
      if (response.data?.data) {
        if (response.data.data.partidos) {
          partidosData = response.data.data.partidos;
        } else if (Array.isArray(response.data.data)) {
          partidosData = response.data.data;
        } else {
          partidosData = [];
        }
      }
      
      setPartidos(partidosData);
      
    } catch (error) {
      console.error('❌ Error cargando partidos:', error);
      toast.error('Error al cargar las predicciones');
    } finally {
      setCargandoPartidos(false);
    }
  };

  const getEstadoBadge = (partido) => {
    if (partido.GOLES_REALES_LOCAL !== null && partido.GOLES_REALES_VISITANTE !== null) {
      return (
        <span className="flex items-center text-green-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4 mr-1" />
          Finalizado
        </span>
      );
    }
    if (partido.YA_PREDICHO) {
      return (
        <span className="flex items-center text-blue-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4 mr-1" />
          Predicción enviada
        </span>
      );
    }
    return (
      <span className="flex items-center text-yellow-600 text-sm font-medium">
        <Clock className="h-4 w-4 mr-1" />
        Pendiente
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando tus quinielas...</div>
      </div>
    );
  }

  if (quinielas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No tienes quinielas activas</h2>
          <p className="text-gray-500 mb-4">Aún no estás inscrito en ninguna quiniela</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Notificación en tiempo real */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white rounded-lg shadow-lg p-4 max-w-md flex items-center gap-3 animate-slide-up">
          <div className="text-xl">{notificationIcon || <Bell className="h-5 w-5" />}</div>
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

      {/* Indicador de puntos actualizados */}
      {puntosActualizados && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white rounded-lg shadow-lg p-3 animate-slide-down">
          <TrendingUp className="h-5 w-5 inline mr-2" />
          ¡Datos actualizados!
        </div>
      )}

      <h1 className="text-2xl font-bold mb-2">Mis Predicciones</h1>
      {userInfo.nombre && (
        <p className="text-gray-500 mb-6">Bienvenido, {userInfo.nombre}</p>
      )}

      {/* Selector de quiniela */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Quiniela
        </label>
        <select
          value={quinielaSeleccionada?.ID_QUINIELA || ''}
          onChange={(e) => seleccionarQuiniela(Number(e.target.value))}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {quinielas.map((q) => (
            <option key={q.ID_QUINIELA} value={q.ID_QUINIELA}>
              {q.NOMBRE} {q.PREDICCIONES_BLOQUEADAS ? '🔒' : ''}
            </option>
          ))}
        </select>
      </div>

      {quinielaSeleccionada && (
        <div className={`rounded-lg shadow-lg p-6 text-white mb-8 ${
          quinielaSeleccionada.PREDICCIONES_BLOQUEADAS 
            ? 'bg-gradient-to-r from-red-600 to-orange-600' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600'
        }`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{quinielaSeleccionada.NOMBRE}</h1>
              <p className="mt-2">{quinielaSeleccionada.DESCRIPCION || 'Sin descripción'}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <span>🏆 {quinielaSeleccionada.C_CAMPEONATO}</span>
                <span>📅 {new Date(quinielaSeleccionada.FECHA_INICIO).toLocaleDateString()} - {new Date(quinielaSeleccionada.FECHA_FIN).toLocaleDateString()}</span>
                <span>⭐ Tus puntos: {quinielaSeleccionada.PUNTOS_TOTALES || 0}</span>
                {isConnected && <span className="text-green-300">● Tiempo real</span>}
              </div>
            </div>
            {quinielaSeleccionada.PREDICCIONES_BLOQUEADAS && (
              <div className="bg-red-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-semibold">BLOQUEADA</span>
              </div>
            )}
          </div>
        </div>
      )}

      {cargandoPartidos ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Cargando tus predicciones...</div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">📋 Mis Predicciones</h2>
          
          {partidos.length === 0 && (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No hay partidos disponibles para esta quiniela</p>
            </div>
          )}

          {partidos.filter(p => p.YA_PREDICHO === 1).length === 0 && (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No has realizado predicciones en esta quiniela</p>
              {/* {!quinielaSeleccionada?.PREDICCIONES_BLOQUEADAS && (
                // <Link 
                //   to={`/quinielas/${quinielaSeleccionada?.ID_QUINIELA}/pronosticos`}
                //   className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                // >
                //   Hacer predicciones ahora
                // </Link>
              )} */}
              {quinielaSeleccionada?.PREDICCIONES_BLOQUEADAS && (
                <p className="mt-4 text-red-500 text-sm">Las predicciones están bloqueadas en esta quiniela</p>
              )}
            </div>
          )}

          {partidos
            .filter(partido => partido.YA_PREDICHO === 1)
            .map((partido) => (
              <div key={partido.NRO_PARTIDO} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {partido.EQUIPO_1_NOMBRE} vs {partido.EQUIPO_2_NOMBRE}
                    </h3>
                    {partido.FECHA && (
                      <p className="text-sm text-gray-500 mt-1">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {new Date(partido.FECHA).toLocaleString()}
                      </p>
                    )}
                    {(partido.NOMBRE_GRUPO || partido.NOMBRE_FASE) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {partido.NOMBRE_GRUPO && `Grupo ${partido.NOMBRE_GRUPO}`}
                        {partido.NOMBRE_FASE && ` - ${partido.NOMBRE_FASE}`}
                      </p>
                    )}
                  </div>
                  {getEstadoBadge(partido)}
                </div>

                {partido.GOLES_REALES_LOCAL !== null ? (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Resultado final</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Tu predicción: {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}</p>
                      {partido.PUNTOS_OBTENIDOS > 0 ? (
                        <p className="text-green-600 font-medium">✅ Obtuviste {partido.PUNTOS_OBTENIDOS} puntos</p>
                      ) : (
                        <p className="text-red-500 font-medium">❌ No obtuviste puntos</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-600">Tu predicción</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Esperando resultado del partido</p>
                  </div>
                )}
              </div>
            ))}
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

export default MisPrediccionesPage;