// src/pages/PronosticosUsuarioPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, CheckCircle, ArrowLeft, Trophy, User, Award, Target, AlertCircle, Lock, Hourglass, Filter, Search, TrendingUp, TrendingDown, FileCheck, Clock, Star, Zap } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PronosticosUsuarioPage = () => {
  const { quinielaId, usuarioCodigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [partidos, setPartidos] = useState([]);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [quinielaInfo, setQuinielaInfo] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarPronosticosUsuario();
  }, [quinielaId, usuarioCodigo]);

  const cargarPronosticosUsuario = async () => {
    try {
      setLoading(true);
      const response = await api.post(`/api/quinielas/${quinielaId}/pronosticos-usuario`, {
        usuario_codigo: usuarioCodigo
      });
      const data = response.data.data;
      if (data.partidos) setPartidos(data.partidos);
      if (data.usuario) setUsuarioInfo(data.usuario);
      if (data.quiniela) setQuinielaInfo(data.quiniela);
    } catch (error) {
      console.error('Error cargando pronósticos:', error);
      toast.error('Error al cargar los pronósticos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const isPartidoFinalizado = (partido) => {
    return partido.ESTADO_PARTIDO === 'FINALIZADO' || 
           (partido.GOLES_REALES_LOCAL !== null && partido.GOLES_REALES_LOCAL !== undefined);
  };

  const getEstadoBadge = (partido) => {
    if (isPartidoFinalizado(partido)) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Finalizado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Clock className="h-3 w-3 mr-1" />
        Pendiente
      </span>
    );
  };

  // Función para calcular el tipo de acierto
  const getTipoAcierto = (partido) => {
    if (!isPartidoFinalizado(partido) || partido.YA_PREDICHO !== 1) return null;
    
    const realLocal = partido.GOLES_REALES_LOCAL;
    const realVisit = partido.GOLES_REALES_VISITANTE;
    const predLocal = partido.GOLES_LOCAL_PRED;
    const predVisit = partido.GOLES_VISITANTE_PRED;
    
    // Resultado exacto
    if (realLocal === predLocal && realVisit === predVisit) {
      return { tipo: 'exacto', label: '🎯 Exacto', puntos: partido.PUNTOS_OBTENIDOS || 3 };
    }
    
    // Diferencia de goles acertada
    const difReal = realLocal - realVisit;
    const difPred = predLocal - predVisit;
    
    if (difReal === difPred) {
      return { tipo: 'diferencia', label: '⚡ Diferencia', puntos: partido.PUNTOS_OBTENIDOS || 2 };
    }
    
    // Ganador acertado
    const ganadorReal = realLocal > realVisit ? 'local' : realLocal < realVisit ? 'visitante' : 'empate';
    const ganadorPred = predLocal > predVisit ? 'local' : predLocal < predVisit ? 'visitante' : 'empate';
    
    if (ganadorReal === ganadorPred) {
      return { tipo: 'ganador', label: '👏 Ganador', puntos: partido.PUNTOS_OBTENIDOS || 1 };
    }
    
    return { tipo: 'fallo', label: '❌ Fallo', puntos: 0 };
  };

  // ORDENAMIENTO: Finalizados primero, luego pendientes
  const partidosOrdenados = useMemo(() => {
    return [...partidos].sort((a, b) => {
      const aFinalizado = isPartidoFinalizado(a);
      const bFinalizado = isPartidoFinalizado(b);

      // Finalizados primero
      if (aFinalizado && !bFinalizado) return -1;
      if (!aFinalizado && bFinalizado) return 1;

      // Ambos finalizados: por puntos (mayor primero) y luego fecha
      if (aFinalizado && bFinalizado) {
        if ((a.PUNTOS_OBTENIDOS || 0) !== (b.PUNTOS_OBTENIDOS || 0)) {
          return (b.PUNTOS_OBTENIDOS || 0) - (a.PUNTOS_OBTENIDOS || 0);
        }
        return new Date(b.FECHA) - new Date(a.FECHA);
      }

      // Ambos pendientes: por fecha (más próximo primero)
      if (!aFinalizado && !bFinalizado) {
        return new Date(a.FECHA) - new Date(b.FECHA);
      }

      return 0;
    });
  }, [partidos]);

  // FILTRADO
  const partidosFiltrados = useMemo(() => {
    let filtrados = partidosOrdenados;
    
    // Filtro por estado
    if (filtroEstado === 'finalizados') {
      filtrados = filtrados.filter(p => isPartidoFinalizado(p));
    } else if (filtroEstado === 'pendientes') {
      filtrados = filtrados.filter(p => !isPartidoFinalizado(p));
    } else if (filtroEstado === 'con-puntos') {
      filtrados = filtrados.filter(p => isPartidoFinalizado(p) && (p.PUNTOS_OBTENIDOS || 0) > 0);
    }
    
    // Filtro por búsqueda
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(p => 
        p.EQUIPO_1_NOMBRE?.toLowerCase().includes(term) ||
        p.EQUIPO_2_NOMBRE?.toLowerCase().includes(term)
      );
    }
    
    return filtrados;
  }, [partidosOrdenados, filtroEstado, busqueda]);

  // Estadísticas para mostrar
  const stats = useMemo(() => {
    const total = partidos.length;
    const finalizados = partidos.filter(p => isPartidoFinalizado(p));
    const pendientes = partidos.filter(p => !isPartidoFinalizado(p));
    const conPronostico = partidos.filter(p => p.YA_PREDICHO === 1);
    const puntos = usuarioInfo?.PUNTOS_TOTALES || 0;
    
    const exactos = finalizados.filter(p => {
      if (p.YA_PREDICHO !== 1) return false;
      return p.GOLES_REALES_LOCAL === p.GOLES_LOCAL_PRED && 
             p.GOLES_REALES_VISITANTE === p.GOLES_VISITANTE_PRED;
    }).length;
    
    const diferencia = finalizados.filter(p => {
      if (p.YA_PREDICHO !== 1) return false;
      const difReal = p.GOLES_REALES_LOCAL - p.GOLES_REALES_VISITANTE;
      const difPred = p.GOLES_LOCAL_PRED - p.GOLES_VISITANTE_PRED;
      return difReal === difPred && 
             !(p.GOLES_REALES_LOCAL === p.GOLES_LOCAL_PRED && p.GOLES_REALES_VISITANTE === p.GOLES_VISITANTE_PRED);
    }).length;
    
    return {
      total,
      finalizados: finalizados.length,
      pendientes: pendientes.length,
      conPronostico: conPronostico.length,
      puntos,
      exactos,
      diferencia,
      efectividad: finalizados.length > 0 ? Math.round((exactos + diferencia) / finalizados.length * 100) : 0
    };
  }, [partidos, usuarioInfo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Navegación */}
      <Link 
        to={`/quinielas/${quinielaId}/ranking`} 
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver al Ranking
      </Link>

      {/* Header del usuario - Más amigable */}
      {usuarioInfo && (
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 flex-shrink-0">
              <User className="h-14 w-14 lg:h-16 lg:w-16" />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold">
                {usuarioInfo.U_NOMBRE} {usuarioInfo.U_APELLIDO}
              </h1>
              <p className="text-indigo-100 text-sm">Código: {usuarioInfo.U_CODIGO}</p>
              
              <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-3">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <span className="font-bold text-lg">{stats.puntos}</span>
                  <span className="text-xs text-indigo-200">pts totales</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  <span className="font-bold">{stats.exactos + stats.diferencia}</span>
                  <span className="text-xs text-indigo-200">aciertos</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <span className="font-bold">{stats.conPronostico}/{stats.total}</span>
                  <span className="text-xs text-indigo-200">pronósticos</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-bold">{stats.efectividad}%</span>
                  <span className="text-xs text-indigo-200">efectividad</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información de la quiniela */}
      {quinielaInfo && (
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {quinielaInfo.NOMBRE}
              </h2>
              <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {new Date(quinielaInfo.FECHA_INICIO).toLocaleDateString()} - {new Date(quinielaInfo.FECHA_FIN).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 font-medium">{stats.finalizados} partidos finalizados</span>
            </div>
          </div>
        </div>
      )}

      {/* Controles - Filtros mejorados */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === 'todos' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setFiltroEstado('finalizados')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === 'finalizados' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✅ Finalizados ({stats.finalizados})
            </button>
            <button
              onClick={() => setFiltroEstado('pendientes')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === 'pendientes' 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⏳ Pendientes ({stats.pendientes})
            </button>
            <button
              onClick={() => setFiltroEstado('con-puntos')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === 'con-puntos' 
                  ? 'bg-purple-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⭐ Con puntos
            </button>
          </div>
        </div>
        
        <div className="w-full md:w-64 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
        </div>
      </div>

      {/* Tabla de partidos - Diseño más limpio */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partido
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pronóstico
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resultado
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acierto
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    {busqueda ? 'No se encontraron partidos con esa búsqueda' : 'No hay partidos que coincidan con los filtros'}
                  </td>
                </tr>
              ) : (
                partidosFiltrados.map((partido) => {
                  const finalizado = isPartidoFinalizado(partido);
                  const tienePronostico = partido.YA_PREDICHO === 1;
                  const tipoAcierto = finalizado && tienePronostico ? getTipoAcierto(partido) : null;
                  
                  return (
                    <tr key={partido.NRO_PARTIDO} className={`hover:bg-gray-50 transition-colors ${finalizado && tipoAcierto?.tipo === 'exacto' ? 'bg-green-50/30' : ''}`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {partido.EQUIPO_1_NOMBRE} vs {partido.EQUIPO_2_NOMBRE}
                            </div>
                            <div className="text-xs text-gray-400">
                              {partido.FECHA ? new Date(partido.FECHA).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {getEstadoBadge(partido)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {tienePronostico ? (
                          finalizado ? (
                            <span className="text-sm font-bold text-blue-600">
                              {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 flex items-center justify-center gap-1">
                              <Lock className="h-3 w-3" />
                              <span>{partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}</span>
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">Sin pronóstico</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {finalizado ? (
                          <span className="text-sm font-bold text-gray-800">
                            {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {tipoAcierto ? (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            tipoAcierto.tipo === 'exacto' ? 'bg-green-100 text-green-700' :
                            tipoAcierto.tipo === 'diferencia' ? 'bg-yellow-100 text-yellow-700' :
                            tipoAcierto.tipo === 'ganador' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {tipoAcierto.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {tipoAcierto && tipoAcierto.puntos > 0 ? (
                          <span className="inline-flex items-center justify-center font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg min-w-[2.5rem]">
                            +{tipoAcierto.puntos}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen de estadísticas */}
      {partidosFiltrados.length > 0 && stats.finalizados > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {stats.exactos}
              </div>
              <div className="text-xs text-green-600 font-medium">🎯 Exactos</div>
              <div className="text-xs text-green-500 mt-1">
                {stats.finalizados > 0 ? Math.round(stats.exactos / stats.finalizados * 100) : 0}%
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {stats.diferencia}
              </div>
              <div className="text-xs text-yellow-600 font-medium">⚡ Diferencia</div>
              <div className="text-xs text-yellow-500 mt-1">
                {stats.finalizados > 0 ? Math.round(stats.diferencia / stats.finalizados * 100) : 0}%
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">
                {stats.exactos + stats.diferencia}
              </div>
              <div className="text-xs text-purple-600 font-medium">✅ Aciertos totales</div>
              <div className="text-xs text-purple-500 mt-1">
                {stats.finalizados > 0 ? Math.round((stats.exactos + stats.diferencia) / stats.finalizados * 100) : 0}%
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4 border border-indigo-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-700">
                {stats.finalizados}
              </div>
              <div className="text-xs text-indigo-600 font-medium">📊 Finalizados</div>
              <div className="text-xs text-indigo-500 mt-1">
                {stats.total > 0 ? Math.round(stats.finalizados / stats.total * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PronosticosUsuarioPage;