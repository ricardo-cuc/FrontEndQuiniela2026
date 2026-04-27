// src/pages/PronosticosQuinielaPage.jsx
// ============================================
// PÁGINA DE PRONÓSTICOS DE UNA QUINIELA ESPECÍFICA
// ============================================
// Esta página muestra todos los partidos de una quiniela y permite al usuario
// hacer sus predicciones (pronósticos) de goles para cada partido.
// 
// Los datos vienen del SP sp_PartidosPorQuiniela que ya incluye:
// - Información de la quiniela
// - Lista de partidos con sus estados (DISPONIBLE, EN_CURSO, FINALIZADO)
// - Tiempo restante para cada partido
// - Predicciones ya realizadas por el usuario
// - Reglas de negocio (si puede predecir o no)
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,      // Icono de flecha para volver
  Calendar,       // Icono de calendario para la fecha
  CheckCircle,    // Icono de check para estados positivos
  XCircle,        // Icono de X para estados negativos
  Clock,          // Icono de reloj para tiempo restante
  Save,           // Icono de guardar
  Lock,           // Icono de candado para bloqueos
  AlertCircle,    // Icono de alerta para advertencias
  Info,           // Icono de información para mensajes
  Bell,           // Icono de campana para notificaciones
  Wifi,           // Icono de wifi para conexión
  WifiOff,        // Icono de wifi desconectado
  TrendingUp,     // Icono para ranking
  X               // Icono para cerrar notificación
} from 'lucide-react';
import api from '../services/api';      // Cliente HTTP configurado
import toast from 'react-hot-toast';    // Notificaciones tipo toast
import { useSocket } from '../hooks/useSocket';  // 🔥 NUEVO: Hook de Socket.IO

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const PronosticosQuinielaPage = () => {
  // useParams obtiene los parámetros de la URL
  // Ej: /quiniela/15 → id = 15
  const { id } = useParams();
  
  // ============================================
  // ESTADOS DEL COMPONENTE
  // ============================================
  
  // Datos de la quiniela (nombre, fechas, etc.)
  const [quiniela, setQuiniela] = useState(null);
  
  // Lista de partidos con toda su información
  const [partidos, setPartidos] = useState([]);
  
  // Estado de carga (muestra "Cargando..." mientras se obtienen datos)
  const [loading, setLoading] = useState(true);
  
  // Estado para el botón de guardar (evita múltiples envíos)
  // Ej: { 51: true, 45: false } → partido 51 está guardando
  const [enviando, setEnviando] = useState({});
  
  // Indica si la quiniela tiene las predicciones bloqueadas
  const [prediccionesBloqueadas, setPrediccionesBloqueadas] = useState(false);
  
  // Evitar múltiples cargas
  const cargadoRef = useRef(false);

  // 🔥 NUEVO: Socket.IO para tiempo real
  const { isConnected, lastMessage } = useSocket(id);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [rankingActualizado, setRankingActualizado] = useState(false);

  // ============================================
  // EFECTO: Cargar datos al montar el componente
  // ============================================
  useEffect(() => {
    if (!cargadoRef.current) {
      cargadoRef.current = true;
      cargarDatos();
    }
  }, [id]);

  // 🔥 NUEVO: Efecto para escuchar mensajes en tiempo real
  useEffect(() => {
    if (lastMessage) {
      let message = '';
      switch (lastMessage.type) {
        case 'RESULTADO_ACTUALIZADO':
          message = `⚽ Resultado actualizado: ${lastMessage.partido?.EQUIPO_1_NOMBRE} ${lastMessage.partido?.Q_GOLES_E1} - ${lastMessage.partido?.Q_GOLES_E2} ${lastMessage.partido?.EQUIPO_2_NOMBRE}`;
          // Recargar datos en segundo plano
          cargarDatos();
          break;
        case 'RANKING_ACTUALIZADO':
          message = `🏆 El ranking ha sido actualizado`;
          setRankingActualizado(true);
          setTimeout(() => setRankingActualizado(false), 3000);
          break;
        default:
          message = 'Actualización en la quiniela';
      }
      
      setNotificationMessage(message);
      setShowNotification(true);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [lastMessage]);

  // ============================================
  // FUNCIÓN PRINCIPAL: Cargar todos los datos
  // ============================================
  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/api/partidos/quiniela/${id}`);
      
      console.log('📦 Respuesta completa:', response.data);
      
      if (response.data?.data) {
        const { quiniela: datosQuiniela, partidos: partidosArray } = response.data.data;
        
        // USAR DATOS DE LA QUINIELA DEL ENCABEZADO
        if (datosQuiniela) {
          console.log('📋 Datos de quiniela:', datosQuiniela);
          
          setQuiniela({
            ID_QUINIELA: datosQuiniela.ID_QUINIELA,
            NOMBRE: datosQuiniela.NOMBRE || 'Quiniela',
            DESCRIPCION: datosQuiniela.DESCRIPCION || 'Sin descripción',
            C_CAMPEONATO: datosQuiniela.C_CAMPEONATO || 'M26',
            PUNTOS_TOTALES: 0,
            PREDICCIONES_BLOQUEADAS: datosQuiniela.PREDICCIONES_BLOQUEADAS === true,
            FECHA_INICIO: datosQuiniela.FECHA_INICIO,
            FECHA_FIN: datosQuiniela.FECHA_FIN,
            FECHA_LIMITE_PREDICCIONES: datosQuiniela.FECHA_LIMITE_PREDICCIONES
          });
          
          setPrediccionesBloqueadas(datosQuiniela.PREDICCIONES_BLOQUEADAS === true);
        }
        
        // Función para calcular tiempo restante (por si acaso)
        const calcularTiempoRestante = (fechaPartido) => {
          if (!fechaPartido) return null;
          const ahora = new Date();
          const fecha = new Date(fechaPartido);
          if (ahora >= fecha) return null;
          
          const diffMinutos = Math.floor((fecha - ahora) / 60000);
          
          if (diffMinutos >= 1440) {
            return `${Math.floor(diffMinutos / 1440)} días`;
          } else if (diffMinutos >= 60) {
            return `${Math.floor(diffMinutos / 60)} horas`;
          } else {
            return `${diffMinutos} minutos`;
          }
        };
        
        // Mapear partidos (ya vienen con los campos correctos)
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
          TIEMPO_HUMANO: p.TIEMPO_HUMANO || calcularTiempoRestante(p.FECHA),
          PUEDE_PREDECIR: p.PUEDE_PREDECIR
        }));
        
        setPartidos(partidosMapeados);
        
        console.log('📊 Partidos mapeados:', partidosMapeados.length);
        console.log('🔒 Quiniela bloqueada:', datosQuiniela?.PREDICCIONES_BLOQUEADAS);
        
      } else {
        console.error('❌ No se recibieron datos');
      }
      
    } catch (error) {
      console.error('❌ Error en cargarDatos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MANEJADOR: Cambio en inputs de predicción
  // ============================================
  const handlePrediccionChange = (partidoId, campo, valor) => {
    setPartidos(prev => prev.map(p => 
      p.NRO_PARTIDO === partidoId ? { ...p, [campo]: parseInt(valor) || 0 } : p
    ));
  };

  // ============================================
  // FUNCIÓN: Enviar predicción al backend
  // ============================================
  const enviarPrediccion = async (partido) => {
    // Validación 1: ¿Quiniela bloqueada?
    if (prediccionesBloqueadas) {
      toast.error('🔒 Las predicciones están bloqueadas para esta quiniela');
      return;
    }

    // Validación 2: ¿Ya tiene predicción?
    if (partido.YA_PREDICHO) {
      toast.error('Ya tienes una predicción para este partido');
      return;
    }

    // Validación 3: ¿Ingresó ambos goles?
    if (partido.GOLES_LOCAL_PRED === undefined || partido.GOLES_LOCAL_PRED === '' ||
        partido.GOLES_VISITANTE_PRED === undefined || partido.GOLES_VISITANTE_PRED === '') {
      toast.error('Ingresa los goles para ambos equipos');
      return;
    }

    // Marcar que este partido está en proceso de envío
    setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: true }));

    try {
      await api.post('/api/predicciones', {
        id_quiniela: parseInt(id),
        nro_partido: partido.NRO_PARTIDO,
        goles_local_pred: partido.GOLES_LOCAL_PRED,
        goles_visitante_pred: partido.GOLES_VISITANTE_PRED
      });

      toast.success(`✅ Predicción guardada para ${partido.EQUIPO_1_NOMBRE} vs ${partido.EQUIPO_2_NOMBRE}`);
      
      setPartidos(prev => prev.map(p => 
        p.NRO_PARTIDO === partido.NRO_PARTIDO 
          ? { 
              ...p, 
              YA_PREDICHO: true,
              GOLES_LOCAL_PRED: partido.GOLES_LOCAL_PRED,
              GOLES_VISITANTE_PRED: partido.GOLES_VISITANTE_PRED,
              ESTADO_USUARIO: 'YA_PREDICHO',
              PUEDE_PREDECIR: 0
            }
          : p
      ));
      
    } catch (error) {
      let mensaje = error.response?.data?.message || error.response?.data?.mensaje || 'Error al guardar predicción';
      
      if (error.response?.status === 401) {
        mensaje = '❌ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
      } else if (mensaje.includes('ya inició') || mensaje.includes('en curso')) {
        mensaje = '⏰ Este partido ya comenzó. No se aceptan más predicciones.';
      } else if (mensaje.includes('bloqueadas')) {
        mensaje = '🔒 Las predicciones están bloqueadas para esta quiniela.';
      } else if (mensaje.includes('Ya tienes una predicción')) {
        mensaje = '📝 Ya tienes una predicción para este partido.';
      }
      
      toast.error(mensaje);
    } finally {
      setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: false }));
    }
  };

  // ============================================
  // VALIDACIÓN: ¿El usuario puede predecir este partido?
  // ============================================
  const puedePredecirPartido = (partido) => {
    if (prediccionesBloqueadas) return false;
    if (partido.YA_PREDICHO) return false;
    // Usar ESTADO_USUARIO para saber si está disponible
    return partido.ESTADO_USUARIO === 'DISPONIBLE';
  };

  // ============================================
  // OBTENER: Razón por la que NO puede predecir
  // ============================================
  const getRazonNoPrediccion = (partido) => {
    if (partido.YA_PREDICHO) return 'Ya realizaste tu predicción';
    switch (partido.ESTADO_USUARIO) {
      case 'FINALIZADO':
        return 'Partido finalizado';
      case 'CERRADO':
        return 'El partido ya comenzó';
      default:
        return null;
    }
  };

  // ============================================
  // OBTENER: Texto del tiempo restante
  // ============================================
  const getTiempoRestanteTexto = (partido) => {
    // Usar directamente el tiempo que viene del SP
    if (partido.TIEMPO_HUMANO && partido.ESTADO_USUARIO === 'DISPONIBLE') {
      return partido.TIEMPO_HUMANO;
    }
    return null;
  };

  // ============================================
  // OBTENER: Mensaje informativo para el usuario
  // ============================================
  const getMensajeInformativo = (partido) => {
    if (partido.ESTADO_USUARIO === 'DISPONIBLE' && partido.TIEMPO_HUMANO) {
      return `⏰ El partido comienza en ${partido.TIEMPO_HUMANO}`;
    }
    if (partido.ESTADO_USUARIO === 'CERRADO') {
      return `⚽ El partido ya está en curso`;
    }
    if (partido.ESTADO_USUARIO === 'FINALIZADO') {
      return `🏁 El partido ya finalizó`;
    }
    return null;
  };

  // ============================================
  // RENDERIZAR: Badge de estado del partido
  // ============================================
  const getEstadoBadge = (partido) => {
    if (prediccionesBloqueadas) {
      return (
        <span className="flex items-center text-red-600 text-sm font-medium">
          <Lock className="h-4 w-4 mr-1" />
          Predicciones Bloqueadas
        </span>
      );
    }

    switch (partido.ESTADO_USUARIO) {
      case 'FINALIZADO':
        return (
          <span className="flex items-center text-green-600 text-sm font-medium">
            <CheckCircle className="h-4 w-4 mr-1" />
            Finalizado {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
          </span>
        );

      case 'YA_PREDICHO':
        const localPred = partido.GOLES_LOCAL_PRED !== '' ? partido.GOLES_LOCAL_PRED : '?';
        const visitPred = partido.GOLES_VISITANTE_PRED !== '' ? partido.GOLES_VISITANTE_PRED : '?';
        return (
          <span className="flex items-center text-blue-600 text-sm font-medium">
            <CheckCircle className="h-4 w-4 mr-1" />
            Predicción enviada: {localPred} - {visitPred}
          </span>
        );

      case 'CERRADO':
        return (
          <span className="flex items-center text-orange-600 text-sm font-medium">
            <AlertCircle className="h-4 w-4 mr-1" />
            En curso - No disponible
          </span>
        );

      case 'DISPONIBLE':
        return (
          <span className="flex items-center text-yellow-600 text-sm font-medium">
            <Clock className="h-4 w-4 mr-1" />
            Disponible para predicción
          </span>
        );

      default:
        return (
          <span className="flex items-center text-gray-400 text-sm font-medium">
            <Clock className="h-4 w-4 mr-1" />
            Cargando...
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando partidos...</div>
      </div>
    );
  }

  if (!quiniela && partidos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Quiniela no encontrada</p>
        <Link to="/mis-quinielas" className="text-indigo-600 hover:underline mt-4 inline-block">
          Volver a mis quinielas
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* 🔥 NUEVO: Notificación en tiempo real */}
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

      {/* 🔥 NUEVO: Indicador de conexión */}
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

      {/* 🔥 NUEVO: Indicador de ranking actualizado */}
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

      {/* Header de la quiniela - Fondo degradado */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
        <h1 className="text-2xl font-bold">{quiniela?.NOMBRE || 'Quiniela'}</h1>
        <p className="mt-2">{quiniela?.DESCRIPCION || 'Sin descripción'}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>🏆 {quiniela?.C_CAMPEONATO || 'M26'}</span>
          <span>⭐ Tus puntos: {quiniela?.PUNTOS_TOTALES || 0}</span>
        </div>
      </div>

      {/* Alerta de quiniela bloqueada */}
      {prediccionesBloqueadas && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-red-700 font-semibold">Predicciones Bloqueadas</p>
              <p className="text-red-600 text-sm">
                Esta quiniela tiene las predicciones bloqueadas. No puedes realizar nuevas predicciones.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de partidos */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">📋 Partidos - Realiza tus pronósticos</h2>
        
        {partidos.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No hay partidos disponibles para esta quiniela</p>
          </div>
        )}

        {/* Mapeo de cada partido a una tarjeta */}
        {partidos.map((partido) => {
          const tiempoTexto = getTiempoRestanteTexto(partido);
          const mensajeInfo = getMensajeInformativo(partido);
          const razonNoPrediccion = getRazonNoPrediccion(partido);
          
          return (
            <div key={partido.NRO_PARTIDO} className="bg-white rounded-lg shadow-md p-6">
              {/* Cabecera del partido */}
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
                  {partido.NOMBRE_GRUPO && (
                    <p className="text-xs text-gray-400 mt-1">Grupo {partido.NOMBRE_GRUPO}</p>
                  )}
                </div>
                {getEstadoBadge(partido)}
              </div>

              {/* ============================================ */}
              {/* CASO 1: Partido FINALIZADO (con resultado real) */}
              {/* ============================================ */}
              {partido.ESTADO_USUARIO === 'FINALIZADO' && (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
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

              {/* ============================================ */}
              {/* CASO 2: Partido con PREDICCIÓN ENVIADA (pendiente o finalizado) */}
              {/* ============================================ */}
              {partido.ESTADO_USUARIO === 'YA_PREDICHO' && (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    {partido.ESTADO_CALCULADO === 'FINALIZADO' ? 'Resultado final' : 'Partido pendiente'}
                  </p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {partido.ESTADO_CALCULADO === 'FINALIZADO'
                      ? `${partido.GOLES_REALES_LOCAL} - ${partido.GOLES_REALES_VISITANTE}`
                      : 'Pendiente'}
                  </p>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Tu predicción: {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                    </p>
                    {partido.ESTADO_CALCULADO === 'FINALIZADO' && (
                      partido.PUNTOS_OBTENIDOS > 0 ? (
                        <p className="text-green-600 font-medium">
                          ✅ Obtuviste {partido.PUNTOS_OBTENIDOS} puntos
                        </p>
                      ) : (
                        <p className="text-red-500 font-medium">
                          ❌ No obtuviste puntos
                        </p>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* ============================================ */}
              {/* CASO 3: Partido CERRADO (en curso, no se puede predecir) */}
              {/* ============================================ */}
              {partido.ESTADO_USUARIO === 'CERRADO' && (
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Partido en curso</p>
                  <p className="text-gray-500">No se aceptan más predicciones</p>
                </div>
              )}

              {/* ============================================ */}
              {/* CASO 4: Partido DISPONIBLE para predicción */}
              {/* ============================================ */}
              {partido.ESTADO_USUARIO === 'DISPONIBLE' && !partido.YA_PREDICHO && (
                <>
                  {/* Mensaje informativo (tiempo restante) */}
                  {mensajeInfo && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 text-sm flex items-center justify-center gap-2">
                        <Info className="h-4 w-4" />
                        {mensajeInfo}
                      </p>
                    </div>
                  )}

                  {/* Badge de tiempo restante */}
                  {tiempoTexto && (
                    <div className="mb-3 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        Comienza en: {tiempoTexto}
                      </span>
                    </div>
                  )}

                  {/* Inputs para ingresar goles */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-6">
                    {/* Equipo local */}
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
                        className="w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="?"
                      />
                    </div>
                    
                    <span className="text-2xl font-bold text-gray-400">VS</span>
                    
                    {/* Equipo visitante */}
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
                        className="w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="?"
                      />
                    </div>
                  </div>

                  {/* Botón guardar */}
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PronosticosQuinielaPage;