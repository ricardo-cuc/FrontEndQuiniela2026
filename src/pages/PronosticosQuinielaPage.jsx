// src/pages/PronosticosQuinielaPage.jsx
// ============================================
// PÁGINA DE PRONÓSTICOS DE UNA QUINIELA ESPECÍFICA
// ============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, CheckCircle, XCircle, Clock, Save, Lock, 
  AlertCircle, Info, Bell, Wifi, WifiOff, TrendingUp, X, RefreshCw
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

const PronosticosQuinielaPage = () => {
  const { id } = useParams();
  
  // Estados
  const [quiniela, setQuiniela] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState({});
  const [prediccionesBloqueadas, setPrediccionesBloqueadas] = useState(false);
  
  // Estados para tiempo real
  const { isConnected, lastMessage } = useSocket(id);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [rankingActualizado, setRankingActualizado] = useState(false);
  
  // Refs para evitar loops
  const cargadoRef = useRef(false);
  const actualizandoRef = useRef(false);

  // ============================================
  // FUNCIÓN: Cargar datos (optimizada)
  // ============================================
  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/api/partidos/quiniela/${id}`);
      
      if (response.data?.data) {
        const { quiniela: datosQuiniela, partidos: partidosArray } = response.data.data;
        
        // Calcular puntos totales
        const puntosTotales = (partidosArray || []).reduce((total, partido) => {
          return total + (partido.PUNTOS_OBTENIDOS || 0);
        }, 0);
        
        // Datos de la quiniela
        if (datosQuiniela) {
          setQuiniela({
            ID_QUINIELA: datosQuiniela.ID_QUINIELA,
            NOMBRE: datosQuiniela.NOMBRE || 'Quiniela',
            DESCRIPCION: datosQuiniela.DESCRIPCION || 'Sin descripción',
            C_CAMPEONATO: datosQuiniela.C_CAMPEONATO || 'M26',
            PUNTOS_TOTALES: puntosTotales,
            PREDICCIONES_BLOQUEADAS: datosQuiniela.PREDICCIONES_BLOQUEADAS === true,
            FECHA_INICIO: datosQuiniela.FECHA_INICIO,
            FECHA_FIN: datosQuiniela.FECHA_FIN,
            FECHA_LIMITE_PREDICCIONES: datosQuiniela.FECHA_LIMITE_PREDICCIONES
          });
          
          setPrediccionesBloqueadas(datosQuiniela.PREDICCIONES_BLOQUEADAS === true);
        }
        
        // Mapear partidos
        const partidosMapeados = (partidosArray || []).map(p => ({
          ...p,
          NRO_PARTIDO: p.NRO_PARTIDO,
          EQUIPO_1_NOMBRE: p.EQUIPO_1_NOMBRE,
          EQUIPO_2_NOMBRE: p.EQUIPO_2_NOMBRE,
          FECHA: p.FECHA,
          GOLES_REALES_LOCAL: p.GOLES_REALES_LOCAL,
          GOLES_REALES_VISITANTE: p.GOLES_REALES_VISITANTE,
          YA_PREDICHO: p.YA_PREDICHO === 1,
          GOLES_LOCAL_PRED: p.GOLES_LOCAL_PRED !== null ? p.GOLES_LOCAL_PRED : '',
          GOLES_VISITANTE_PRED: p.GOLES_VISITANTE_PRED !== null ? p.GOLES_VISITANTE_PRED : '',
          PUNTOS_OBTENIDOS: p.PUNTOS_OBTENIDOS || 0,
          NOMBRE_GRUPO: p.NOMBRE_GRUPO,
          NOMBRE_FASE: p.NOMBRE_FASE,
          ESTADO_CALCULADO: p.ESTADO_CALCULADO,
          ESTADO_USUARIO: p.ESTADO_USUARIO,
          TIEMPO_HUMANO: p.TIEMPO_HUMANO,
          PUEDE_PREDECIR: p.PUEDE_PREDECIR
        }));
        
        setPartidos(partidosMapeados);
      }
      
    } catch (error) {
      console.error('❌ Error en cargarDatos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ============================================
  // FUNCIÓN: Actualizar SOLO un partido (sin recargar todo)
  // ============================================
  const actualizarPartidoLocal = (partidoId, nuevosDatos) => {
    setPartidos(prev => prev.map(p => 
      p.NRO_PARTIDO === partidoId ? { ...p, ...nuevosDatos } : p
    ));
  };

  // ============================================
  // FUNCIÓN: Actualizar puntos totales localmente
  // ============================================
  const actualizarPuntosTotales = (nuevosPuntos) => {
    setQuiniela(prev => prev ? { ...prev, PUNTOS_TOTALES: (prev.PUNTOS_TOTALES || 0) + nuevosPuntos } : prev);
  };

  // ============================================
  // EFECTO: Cargar datos al montar
  // ============================================
  useEffect(() => {
    if (!cargadoRef.current) {
      cargadoRef.current = true;
      cargarDatos();
    }
  }, [id, cargarDatos]);

  // ============================================
  // EFECTO: Escuchar mensajes en tiempo real
  // ============================================
  useEffect(() => {
    if (lastMessage && !actualizandoRef.current) {
      actualizandoRef.current = true;
      
      console.log('📡 Evento recibido:', lastMessage);
      
      let message = '';
      
      if (lastMessage.type === 'PREDICCIONES_BLOQUEADAS') {
        const bloqueado = lastMessage.bloqueado === true;
        setPrediccionesBloqueadas(bloqueado);
        setQuiniela(prev => prev ? { ...prev, PREDICCIONES_BLOQUEADAS: bloqueado } : prev);
        message = bloqueado ? '🔒 Predicciones BLOQUEADAS' : '🔓 Predicciones DESBLOQUEADAS';
        
        // Recargar datos silenciosamente
        cargarDatos();
        
      } else if (lastMessage.type === 'RESULTADO_ACTUALIZADO') {
        const equipo1 = lastMessage.EQUIPO_1_NOMBRE || 'Local';
        const equipo2 = lastMessage.EQUIPO_2_NOMBRE || 'Visitante';
        const goles1 = lastMessage.Q_GOLES_E1 ?? 0;
        const goles2 = lastMessage.Q_GOLES_E2 ?? 0;
        message = `⚽ ${equipo1} ${goles1} - ${goles2} ${equipo2}`;
        
        // Actualizar SOLO el partido afectado
        actualizarPartidoLocal(lastMessage.NRO_PARTIDO, {
          GOLES_REALES_LOCAL: goles1,
          GOLES_REALES_VISITANTE: goles2,
          ESTADO_CALCULADO: 'FINALIZADO'
        });
        
      } else if (lastMessage.type === 'RANKING_ACTUALIZADO') {
        message = '🏆 Ranking actualizado';
        setRankingActualizado(true);
        setTimeout(() => setRankingActualizado(false), 3000);
        
        // Solo recargar puntos totales, no todos los partidos
        cargarDatos();
      }
      
      if (message) {
        setNotificationMessage(message);
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
          actualizandoRef.current = false;
        }, 5000);
      } else {
        setTimeout(() => {
          actualizandoRef.current = false;
        }, 1000);
      }
    }
  }, [lastMessage, cargarDatos]);

  // ============================================
  // MANEJADOR: Cambio en inputs
  // ============================================
  const handlePrediccionChange = (partidoId, campo, valor) => {
    setPartidos(prev => prev.map(p => 
      p.NRO_PARTIDO === partidoId ? { ...p, [campo]: parseInt(valor) || 0 } : p
    ));
  };

  // ============================================
  // FUNCIÓN: Enviar predicción (SIN RECARGAR PÁGINA)
  // ============================================
  const enviarPrediccion = async (partido) => {
    if (prediccionesBloqueadas) {
      toast.error('🔒 Las predicciones están bloqueadas');
      return;
    }

    if (partido.YA_PREDICHO) {
      toast.error('Ya tienes una predicción');
      return;
    }

    if (partido.GOLES_LOCAL_PRED === undefined || partido.GOLES_LOCAL_PRED === '' ||
        partido.GOLES_VISITANTE_PRED === undefined || partido.GOLES_VISITANTE_PRED === '') {
      toast.error('Ingresa los goles para ambos equipos');
      return;
    }

    setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: true }));

    try {
      const response = await api.post('/api/predicciones', {
        id_quiniela: parseInt(id),
        nro_partido: partido.NRO_PARTIDO,
        goles_local_pred: partido.GOLES_LOCAL_PRED,
        goles_visitante_pred: partido.GOLES_VISITANTE_PRED
      });

      toast.success(`✅ Predicción guardada para ${partido.EQUIPO_1_NOMBRE} vs ${partido.EQUIPO_2_NOMBRE}`);
      
      // ✅ ACTUALIZACIÓN LOCAL - SIN RECARGAR
      actualizarPartidoLocal(partido.NRO_PARTIDO, {
        YA_PREDICHO: true,
        GOLES_LOCAL_PRED: partido.GOLES_LOCAL_PRED,
        GOLES_VISITANTE_PRED: partido.GOLES_VISITANTE_PRED,
        ESTADO_USUARIO: 'YA_PREDICHO',
        PUEDE_PREDECIR: 0,
        PUNTOS_OBTENIDOS: response.data?.puntos_obtenidos || 0
      });
      
      // Actualizar puntos totales si vienen en la respuesta
      if (response.data?.puntos_obtenidos) {
        actualizarPuntosTotales(response.data.puntos_obtenidos);
      }
      
    } catch (error) {
      let mensaje = error.response?.data?.message || error.response?.data?.mensaje || 'Error al guardar predicción';
      
      if (error.response?.status === 401) {
        mensaje = '❌ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      } else if (mensaje.includes('ya inició') || mensaje.includes('en curso')) {
        mensaje = '⏰ Este partido ya comenzó. No se aceptan más predicciones.';
      } else if (mensaje.includes('bloqueadas')) {
        mensaje = '🔒 Las predicciones están bloqueadas.';
      } else if (mensaje.includes('Ya tienes una predicción')) {
        mensaje = '📝 Ya tienes una predicción para este partido.';
      }
      
      toast.error(mensaje);
    } finally {
      setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: false }));
    }
  };

  // ============================================
  // ORDENAR PARTIDOS: Los NO pronosticados PRIMERO
  // ============================================
  const partidosOrdenados = [...partidos].sort((a, b) => {
    // Primero los que NO tienen predicción
    if (!a.YA_PREDICHO && b.YA_PREDICHO) return -1;
    if (a.YA_PREDICHO && !b.YA_PREDICHO) return 1;
    
    // Luego por fecha (los más próximos primero)
    if (a.FECHA && b.FECHA) {
      return new Date(a.FECHA) - new Date(b.FECHA);
    }
    return 0;
  });

  // Separar partidos para mostrar estadísticas
  const partidosPendientes = partidos.filter(p => !p.YA_PREDICHO && p.ESTADO_USUARIO !== 'FINALIZADO');
  const partidosCompletados = partidos.filter(p => p.YA_PREDICHO || p.ESTADO_USUARIO === 'FINALIZADO');

  // ============================================
  // VALIDACIONES
  // ============================================
  const puedePredecirPartido = (partido) => {
    if (prediccionesBloqueadas) return false;
    if (partido.YA_PREDICHO) return false;
    return partido.ESTADO_USUARIO === 'DISPONIBLE';
  };

  const getRazonNoPrediccion = (partido) => {
    if (prediccionesBloqueadas) return 'Predicciones bloqueadas';
    if (partido.YA_PREDICHO) return 'Ya realizaste tu predicción';
    switch (partido.ESTADO_USUARIO) {
      case 'FINALIZADO': return 'Partido finalizado';
      case 'CERRADO': return 'Partido en curso';
      default: return null;
    }
  };

  const getTiempoRestanteTexto = (partido) => {
    if (partido.TIEMPO_HUMANO && partido.ESTADO_USUARIO === 'DISPONIBLE') {
      return partido.TIEMPO_HUMANO;
    }
    return null;
  };

  const getMensajeInformativo = (partido) => {
    if (partido.ESTADO_USUARIO === 'DISPONIBLE' && partido.TIEMPO_HUMANO) {
      return `⏰ El partido comienza en ${partido.TIEMPO_HUMANO}`;
    }
    if (partido.ESTADO_USUARIO === 'CERRADO') {
      return `⚽ Partido en curso`;
    }
    return null;
  };

  const getEstadoBadge = (partido) => {
    if (prediccionesBloqueadas) {
      return <span className="flex items-center text-red-600 text-sm font-medium"><Lock className="h-4 w-4 mr-1" />Bloqueado</span>;
    }
    switch (partido.ESTADO_USUARIO) {
      case 'FINALIZADO':
        return <span className="flex items-center text-green-600 text-sm font-medium"><CheckCircle className="h-4 w-4 mr-1" />Finalizado</span>;
      case 'YA_PREDICHO':
        return <span className="flex items-center text-blue-600 text-sm font-medium"><CheckCircle className="h-4 w-4 mr-1" />Predicción enviada</span>;
      case 'CERRADO':
        return <span className="flex items-center text-orange-600 text-sm font-medium"><AlertCircle className="h-4 w-4 mr-1" />En curso</span>;
      case 'DISPONIBLE':
        return <span className="flex items-center text-yellow-600 text-sm font-medium"><Clock className="h-4 w-4 mr-1" />Disponible</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando partidos...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Notificaciones */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white rounded-lg shadow-lg p-4 max-w-md flex items-center gap-3 animate-slide-up">
          <Bell className="h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{notificationMessage}</p>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-white hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {rankingActualizado && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white rounded-lg shadow-lg p-3 animate-slide-down">
          <TrendingUp className="h-5 w-5 inline mr-2" />
          ¡Ranking actualizado!
        </div>
      )}

      <Link to="/mis-quinielas" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Mis Quinielas
      </Link>

      {/* Header */}
      <div className={`rounded-lg shadow-lg p-6 text-white mb-8 ${
        prediccionesBloqueadas ? 'bg-gradient-to-r from-red-600 to-orange-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{quiniela?.NOMBRE || 'Quiniela'}</h1>
            <p className="mt-2">{quiniela?.DESCRIPCION || 'Sin descripción'}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span>🏆 {quiniela?.C_CAMPEONATO}</span>
              <span>⭐ Tus puntos: {quiniela?.PUNTOS_TOTALES || 0}</span>
              <span>📋 Pendientes: {partidosPendientes.length}</span>
              <span>✅ Completados: {partidosCompletados.length}</span>
              {isConnected && <span className="text-green-300">● Tiempo real</span>}
            </div>
          </div>
          {prediccionesBloqueadas && (
            <div className="bg-red-500/30 px-3 py-1 rounded-full flex items-center gap-1">
              <Lock className="h-4 w-4" />
              <span className="text-xs font-semibold">BLOQUEADA</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerta de bloqueo */}
      {prediccionesBloqueadas && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-red-700 font-semibold">Predicciones Bloqueadas</p>
              <p className="text-red-600 text-sm">No puedes realizar nuevas predicciones.</p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECCIÓN 1: PARTIDOS PENDIENTES (ARRIBA) */}
      {/* ============================================ */}
      {partidosPendientes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            📝 Partidos por pronosticar ({partidosPendientes.length})
          </h2>
          <div className="space-y-4">
            {partidosPendientes.map((partido) => (
              <PartidoCard
                key={partido.NRO_PARTIDO}
                partido={partido}
                prediccionesBloqueadas={prediccionesBloqueadas}
                enviando={enviando}
                puedePredecirPartido={puedePredecirPartido}
                getRazonNoPrediccion={getRazonNoPrediccion}
                getTiempoRestanteTexto={getTiempoRestanteTexto}
                getMensajeInformativo={getMensajeInformativo}
                getEstadoBadge={getEstadoBadge}
                handlePrediccionChange={handlePrediccionChange}
                enviarPrediccion={enviarPrediccion}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECCIÓN 2: PARTIDOS COMPLETADOS (ABAJO) */}
      {/* ============================================ */}
      {partidosCompletados.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            ✅ Partidos completados ({partidosCompletados.length})
          </h2>
          <div className="space-y-4">
            {partidosCompletados.map((partido) => (
              <PartidoCard
                key={partido.NRO_PARTIDO}
                partido={partido}
                prediccionesBloqueadas={prediccionesBloqueadas}
                enviando={enviando}
                puedePredecirPartido={puedePredecirPartido}
                getRazonNoPrediccion={getRazonNoPrediccion}
                getTiempoRestanteTexto={getTiempoRestanteTexto}
                getMensajeInformativo={getMensajeInformativo}
                getEstadoBadge={getEstadoBadge}
                handlePrediccionChange={handlePrediccionChange}
                enviarPrediccion={enviarPrediccion}
                esCompletado={true}
              />
            ))}
          </div>
        </div>
      )}

      {partidos.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No hay partidos disponibles para esta quiniela</p>
        </div>
      )}

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

// ============================================
// COMPONENTE: PartidoCard (DRY - No repetir código)
// ============================================
const PartidoCard = ({ 
  partido, 
  prediccionesBloqueadas, 
  enviando, 
  puedePredecirPartido,
  getRazonNoPrediccion,
  getTiempoRestanteTexto,
  getMensajeInformativo,
  getEstadoBadge,
  handlePrediccionChange,
  enviarPrediccion,
  esCompletado = false
}) => {
  const tiempoTexto = getTiempoRestanteTexto(partido);
  const mensajeInfo = getMensajeInformativo(partido);
  const puedePredecir = puedePredecirPartido(partido);
  const razonNoPrediccion = getRazonNoPrediccion(partido);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Cabecera */}
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
        </div>
        {getEstadoBadge(partido)}
      </div>

      {/* Resultado o estado */}
      {(partido.ESTADO_USUARIO === 'FINALIZADO' || (esCompletado && partido.YA_PREDICHO)) && (
        <div className="text-center py-4 bg-gray-50 rounded-lg mb-4">
          <p className="text-gray-600">Resultado final</p>
          <p className="text-2xl font-bold text-indigo-600">
            {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
          </p>
          {partido.YA_PREDICHO && (
            <div className="mt-2">
              <p className="text-sm text-gray-500">Tu predicción: {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}</p>
              {partido.PUNTOS_OBTENIDOS > 0 ? (
                <p className="text-green-600 font-medium">✅ Obtuviste {partido.PUNTOS_OBTENIDOS} puntos</p>
              ) : (
                <p className="text-red-500 font-medium">❌ No obtuviste puntos</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Partido con predicción enviada (no finalizado) */}
      {partido.ESTADO_USUARIO === 'YA_PREDICHO' && partido.ESTADO_CALCULADO !== 'FINALIZADO' && (
        <div className="text-center py-4 bg-blue-50 rounded-lg mb-4">
          <p className="text-blue-600">Tu predicción: {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}</p>
          <p className="text-sm text-gray-500 mt-1">⏳ Esperando resultado del partido</p>
        </div>
      )}

      {/* Partido en curso */}
      {partido.ESTADO_USUARIO === 'CERRADO' && (
        <div className="text-center py-4 bg-orange-50 rounded-lg mb-4">
          <p className="text-orange-600">⚽ Partido en curso - No se aceptan más predicciones</p>
        </div>
      )}

      {/* Formulario para predicción */}
      {partido.ESTADO_USUARIO === 'DISPONIBLE' && !partido.YA_PREDICHO && (
        <>
          {mensajeInfo && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm flex items-center justify-center gap-2">
                <Info className="h-4 w-4" />
                {mensajeInfo}
              </p>
            </div>
          )}

          {tiempoTexto && !prediccionesBloqueadas && (
            <div className="mb-3 text-center">
              <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                Comienza en: {tiempoTexto}
              </span>
            </div>
          )}

          {!prediccionesBloqueadas ? (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-6">
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {partido.EQUIPO_1_NOMBRE}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={partido.GOLES_LOCAL_PRED ?? ''}
                    onChange={(e) => handlePrediccionChange(partido.NRO_PARTIDO, 'GOLES_LOCAL_PRED', e.target.value)}
                    className="w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="?"
                  />
                </div>
                
                <span className="text-2xl font-bold text-gray-400">VS</span>
                
                <div className="text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {partido.EQUIPO_2_NOMBRE}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={partido.GOLES_VISITANTE_PRED ?? ''}
                    onChange={(e) => handlePrediccionChange(partido.NRO_PARTIDO, 'GOLES_VISITANTE_PRED', e.target.value)}
                    className="w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="?"
                  />
                </div>
              </div>

              <div className="mt-4 text-center">
                <button
                  onClick={() => enviarPrediccion(partido)}
                  disabled={enviando[partido.NRO_PARTIDO]}
                  className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {enviando[partido.NRO_PARTIDO] ? 'Guardando...' : 'Guardar Predicción'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-red-500 flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Predicciones bloqueadas
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PronosticosQuinielaPage;