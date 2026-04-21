// src/pages/PronosticosQuinielaPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Trophy, CheckCircle, XCircle, Clock, Save, Lock, AlertCircle, Info } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PronosticosQuinielaPage = () => {
  const { id } = useParams();
  const [quiniela, setQuiniela] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState({});
  const [prediccionesBloqueadas, setPrediccionesBloqueadas] = useState(false);
  const [estadosPartidos, setEstadosPartidos] = useState({});
  const [cargandoEstados, setCargandoEstados] = useState(false);
  const [verificandoPartido, setVerificandoPartido] = useState({}); // Para tracking individual
  const estadosCargadosRef = useRef(false);

  useEffect(() => {
    cargarDatos();
  }, [id]);

  // ✅ ELIMINAR este useEffect - Ya no cargamos estados al inicio
  // useEffect(() => {
  //   if (partidos.length > 0 && !estadosCargadosRef.current && !cargandoEstados && !prediccionesBloqueadas) {
  //     cargarEstadosIniciales();
  //   }
  // }, [partidos, prediccionesBloqueadas]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const quinielasRes = await api.post('/api/quinielas/mis-quinielas');
      const quinielaEncontrada = quinielasRes.data.data?.find(q => q.ID_QUINIELA === parseInt(id));
      setQuiniela(quinielaEncontrada);
      
      if (quinielaEncontrada) {
        setPrediccionesBloqueadas(quinielaEncontrada.PREDICCIONES_BLOQUEADAS === 1 || quinielaEncontrada.PREDICCIONES_BLOQUEADAS === true);
      }

      const partidosRes = await api.post(`/api/quinielas/${id}/partidos-con-predicciones`);
      setPartidos(partidosRes.data.data || []);
      
    } catch (error) {
      toast.error('Error al cargar los datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🔥 FUNCIÓN PARA VERIFICAR ESTADO INDIVIDUAL (BAJO DEMANDA)
  // ============================================
  const verificarEstadoPartido = async (partido) => {
    // Si ya tenemos el estado, no volver a consultar
    if (estadosPartidos[partido.NRO_PARTIDO]) {
      return estadosPartidos[partido.NRO_PARTIDO];
    }
    
    // Si ya está en curso una verificación para este partido, esperar
    if (verificandoPartido[partido.NRO_PARTIDO]) {
      return null;
    }
    
    setVerificandoPartido(prev => ({ ...prev, [partido.NRO_PARTIDO]: true }));
    
    try {
      const response = await api.post('/api/partidos/verificar-estado', {
        nro_partido: partido.NRO_PARTIDO,
        id_quiniela: parseInt(id)
      });
      
      if (response.data && response.data.ok && response.data.data) {
        const estado = response.data.data;
        // Actualizar solo ese partido en el estado
        setEstadosPartidos(prev => ({
          ...prev,
          [partido.NRO_PARTIDO]: estado
        }));
        return estado;
      }
    } catch (error) {
      console.error(`Error verificando partido ${partido.NRO_PARTIDO}:`, error);
      // No mostrar toast para no molestar al usuario
    } finally {
      setVerificandoPartido(prev => ({ ...prev, [partido.NRO_PARTIDO]: false }));
    }
    return null;
  };

  // ✅ Eliminar la función cargarEstadosIniciales (ya no se usa)
  // const cargarEstadosIniciales = async () => { ... }

  const handlePrediccionChange = (partidoId, campo, valor) => {
    setPartidos(prev => prev.map(p => 
      p.NRO_PARTIDO === partidoId ? { ...p, [campo]: parseInt(valor) || 0 } : p
    ));
  };

  const enviarPrediccion = async (partido) => {
    if (prediccionesBloqueadas) {
      toast.error('🔒 Las predicciones están bloqueadas para esta quiniela');
      return;
    }

    if (partido.YA_PREDICHO) {
      toast.error('Ya tienes una predicción para este partido');
      return;
    }

    if (partido.GOLES_LOCAL_PRED === undefined || partido.GOLES_VISITANTE_PRED === undefined) {
      toast.error('Ingresa los goles para ambos equipos');
      return;
    }

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
              GOLES_VISITANTE_PRED: partido.GOLES_VISITANTE_PRED
            }
          : p
      ));
      
      // Limpiar el estado de ese partido (ya no necesita verificación)
      setEstadosPartidos(prev => {
        const newState = { ...prev };
        delete newState[partido.NRO_PARTIDO];
        return newState;
      });
      
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

  const puedePredecirPartido = (partido) => {
    if (prediccionesBloqueadas) return false;
    if (partido.YA_PREDICHO) return false;
    if (partido.PUEDE_PREDECIR === 0) return false;
    
    const estadoPartido = estadosPartidos[partido.NRO_PARTIDO];
    if (estadoPartido) {
      if (estadoPartido.estado === 'EN_CURSO') return false;
      if (estadoPartido.estado === 'FINALIZADO') return false;
      if (estadoPartido.estado === 'PREDICCIONES_BLOQUEADAS') return false;
    }
    
    return true;
  };

  const getTiempoRestanteTexto = (partido) => {
    const estadoPartido = estadosPartidos[partido.NRO_PARTIDO];
    if (estadoPartido && estadoPartido.tiempo_texto && estadoPartido.estado === 'DISPONIBLE') {
      return estadoPartido.tiempo_texto;
    }
    return null;
  };

  const getMensajeInformativo = (partido) => {
    const estadoPartido = estadosPartidos[partido.NRO_PARTIDO];
    if (estadoPartido && estadoPartido.estado === 'DISPONIBLE' && estadoPartido.tiempo_texto) {
      return `⏰ El partido comienza en ${estadoPartido.tiempo_texto}`;
    }
    if (estadoPartido && estadoPartido.estado === 'EN_CURSO') {
      return `⚽ El partido ya está en curso`;
    }
    if (estadoPartido && estadoPartido.estado === 'FINALIZADO') {
      return `🏁 El partido ya finalizó`;
    }
    return null;
  };

  // ============================================
  // 🔥 getEstadoBadge MODIFICADO - Verifica bajo demanda
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
    
    const estadoPartido = estadosPartidos[partido.NRO_PARTIDO];
    
    // Si el partido ya tiene resultado real
    if (partido.GOLES_REALES_LOCAL !== null && partido.GOLES_REALES_VISITANTE !== null) {
      return (
        <span className="flex items-center text-green-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4 mr-1" />
          Finalizado {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
        </span>
      );
    }
    
    // Si el partido ya tiene predicción
    if (partido.YA_PREDICHO) {
      return (
        <span className="flex items-center text-blue-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4 mr-1" />
          Predicción enviada: {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
        </span>
      );
    }
    
    // Si ya tenemos el estado del partido
    if (estadoPartido) {
      if (estadoPartido.estado === 'EN_CURSO') {
        return (
          <span className="flex items-center text-orange-600 text-sm font-medium">
            <AlertCircle className="h-4 w-4 mr-1" />
            En curso - No disponible
          </span>
        );
      }
      
      if (estadoPartido.estado === 'FINALIZADO') {
        return (
          <span className="flex items-center text-red-600 text-sm font-medium">
            <XCircle className="h-4 w-4 mr-1" />
            Finalizado - No disponible
          </span>
        );
      }
      
      if (estadoPartido.estado === 'DISPONIBLE') {
        return (
          <span className="flex items-center text-yellow-600 text-sm font-medium">
            <Clock className="h-4 w-4 mr-1" />
            Disponible para predicción
          </span>
        );
      }
    }
    
    // ✅ NO tenemos el estado - verificar bajo demanda (sin bloquear UI)
    // Usar useEffect o setTimeout para no bloquear el render
    setTimeout(() => {
      verificarEstadoPartido(partido);
    }, 0);
    
    return (
      <span className="flex items-center text-gray-400 text-sm font-medium">
        <Clock className="h-4 w-4 mr-1" />
        Verificando...
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando partidos...</div>
      </div>
    );
  }

  if (!quiniela) {
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
      <Link to="/mis-quinielas" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Mis Quinielas
      </Link>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
        <h1 className="text-2xl font-bold">{quiniela.NOMBRE}</h1>
        <p className="mt-2">{quiniela.DESCRIPCION || 'Sin descripción'}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span>🏆 {quiniela.C_CAMPEONATO}</span>
          <span>📅 {new Date(quiniela.FECHA_INICIO).toLocaleDateString()} - {new Date(quiniela.FECHA_FIN).toLocaleDateString()}</span>
          <span>⭐ Tus puntos: {quiniela.PUNTOS_TOTALES || 0}</span>
          {quiniela.FECHA_LIMITE_PREDICCIONES && (
            <span>⏰ Límite: {new Date(quiniela.FECHA_LIMITE_PREDICCIONES).toLocaleString()}</span>
          )}
        </div>
      </div>

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

      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">📋 Partidos - Realiza tus pronósticos</h2>
        
        {partidos.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No hay partidos disponibles para esta quiniela</p>
          </div>
        )}

        {partidos.map((partido) => {
          const tiempoTexto = getTiempoRestanteTexto(partido);
          const mensajeInfo = getMensajeInformativo(partido);
          
          return (
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
              ) : (
                <>
                  {mensajeInfo && !partido.YA_PREDICHO && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-700 text-sm flex items-center justify-center gap-2">
                        <Info className="h-4 w-4" />
                        {mensajeInfo}
                      </p>
                    </div>
                  )}

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
                        disabled={!puedePredecirPartido(partido)}
                        className={`w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                          ${!puedePredecirPartido(partido) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
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
                        disabled={!puedePredecirPartido(partido)}
                        className={`w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                          ${!puedePredecirPartido(partido) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                        placeholder="?"
                      />
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    {!puedePredecirPartido(partido) && !partido.YA_PREDICHO && !prediccionesBloqueadas && (
                      <p className="text-orange-500 text-sm mb-2 flex items-center justify-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        ⚠️ Este partido ya comenzó o está en curso. No se aceptan más predicciones.
                      </p>
                    )}
                    <button
                      onClick={() => enviarPrediccion(partido)}
                      disabled={!puedePredecirPartido(partido) || enviando[partido.NRO_PARTIDO]}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="h-4 w-4" />
                      {enviando[partido.NRO_PARTIDO] ? 'Guardando...' : (partido.YA_PREDICHO ? 'Predicción Guardada' : 'Guardar Predicción')}
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