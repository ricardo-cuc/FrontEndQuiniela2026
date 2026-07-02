// src/pages/PronosticosUsuarioPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, CheckCircle, ArrowLeft, Trophy, User, Award, Target, AlertCircle, Lock, EyeOff, Hourglass, Filter, ChevronDown, ChevronUp, Search, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PronosticosUsuarioPage = () => {
  const { quinielaId, usuarioCodigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [partidos, setPartidos] = useState([]);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [quinielaInfo, setQuinielaInfo] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [orden, setOrden] = useState('fecha'); // fecha, puntos, equipo

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
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Finalizado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        <Hourglass className="h-3 w-3 mr-1" />
        Pendiente
      </span>
    );
  };

  const getAciertoIndicator = (partido) => {
    if (!isPartidoFinalizado(partido)) return null;
    
    if (partido.GOLES_REALES_LOCAL === partido.GOLES_LOCAL_PRED && 
        partido.GOLES_REALES_VISITANTE === partido.GOLES_VISITANTE_PRED) {
      return <span className="text-green-600 font-bold">🎯 Exacto</span>;
    }
    
    const difLocal = Math.abs(partido.GOLES_REALES_LOCAL - partido.GOLES_LOCAL_PRED);
    const difVisit = Math.abs(partido.GOLES_REALES_VISITANTE - partido.GOLES_VISITANTE_PRED);
    
    if (difLocal === difVisit) {
      return <span className="text-yellow-600 font-bold">⚡ Diferencia</span>;
    }
    
    return <span className="text-red-400">✗</span>;
  };

  // Ordenar partidos
  const partidosOrdenados = [...partidos].sort((a, b) => {
    if (orden === 'fecha') {
      return new Date(a.FECHA) - new Date(b.FECHA);
    } else if (orden === 'puntos') {
      return (b.PUNTOS_OBTENIDOS || 0) - (a.PUNTOS_OBTENIDOS || 0);
    } else if (orden === 'equipo') {
      return a.EQUIPO_1_NOMBRE.localeCompare(b.EQUIPO_1_NOMBRE);
    }
    return 0;
  });

  const partidosFiltrados = partidosOrdenados.filter(partido => {
    if (filtroEstado === 'todos') return true;
    if (filtroEstado === 'finalizados') return isPartidoFinalizado(partido);
    if (filtroEstado === 'pendientes') return !isPartidoFinalizado(partido);
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const pronosticosRealizados = partidos.filter(p => p.YA_PREDICHO === 1).length;
  const totalPartidos = partidos.length;
  const puntosTotales = usuarioInfo?.PUNTOS_TOTALES || 0;
  const totalAciertos = usuarioInfo?.TOTAL_ACIERTOS || 0;

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

      {/* Header del usuario - Versión compacta y profesional */}
      {usuarioInfo && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
            <div className="bg-white/20 rounded-full p-4 flex-shrink-0">
              <User className="h-12 w-12 lg:h-14 lg:w-14" />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold">
                {usuarioInfo.U_NOMBRE} {usuarioInfo.U_APELLIDO}
              </h1>
              <p className="text-indigo-100 text-sm">Código: {usuarioInfo.U_CODIGO}</p>
              
              {quinielaInfo && (
                <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-3">
                  <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    <span className="font-semibold">{puntosTotales} pts</span>
                  </div>
                  <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    <span className="font-semibold">{totalAciertos} aciertos</span>
                  </div>
                  <div className="bg-white/20 px-4 py-2 rounded-xl flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    <span className="font-semibold">{pronosticosRealizados}/{totalPartidos}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Información de la quiniela */}
      {quinielaInfo && (
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {quinielaInfo.NOMBRE}
              </h2>
              <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {new Date(quinielaInfo.FECHA_INICIO).toLocaleDateString()} - {new Date(quinielaInfo.FECHA_FIN).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                {pronosticosRealizados} pronósticos
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Controles - Filtros y orden */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === 'todos' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroEstado('finalizados')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === 'finalizados' 
                  ? 'bg-green-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Finalizados
            </button>
            <button
              onClick={() => setFiltroEstado('pendientes')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === 'pendientes' 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pendientes
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Ordenar por:</span>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="fecha">Fecha</option>
            <option value="puntos">Puntos</option>
            <option value="equipo">Equipo</option>
          </select>
        </div>
      </div>

      {/* Tabla de partidos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabla para desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  # Partido
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipos
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pronóstico
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resultado
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acierto
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    No hay partidos que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                partidosFiltrados.map((partido, index) => {
                  const finalizado = isPartidoFinalizado(partido);
                  const tienePronostico = partido.YA_PREDICHO === 1;
                  
                  return (
                    <tr key={partido.NRO_PARTIDO} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {partido.EQUIPO_1_NOMBRE}
                        </div>
                        <div className="text-xs text-gray-500">vs</div>
                        <div className="text-sm font-medium text-gray-900">
                          {partido.EQUIPO_2_NOMBRE}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {partido.FECHA ? new Date(partido.FECHA).toLocaleDateString() : '-'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {partido.FECHA ? new Date(partido.FECHA).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getEstadoBadge(partido)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {tienePronostico ? (
                          finalizado ? (
                            <span className="text-sm font-bold text-blue-600">
                              {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">
                              <Lock className="h-4 w-4 inline" />
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {finalizado ? (
                          <span className="text-sm font-bold text-green-600">
                            {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            <Hourglass className="h-4 w-4 inline" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {finalizado && tienePronostico ? (
                          getAciertoIndicator(partido)
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {finalizado && tienePronostico ? (
                          <span className="text-lg font-bold text-indigo-600">
                            +{partido.PUNTOS_OBTENIDOS || 0}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Vista para tablet y móvil - Tarjetas */}
        <div className="lg:hidden divide-y divide-gray-100">
          {partidosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              No hay partidos que coincidan con los filtros
            </div>
          ) : (
            partidosFiltrados.map((partido, index) => {
              const finalizado = isPartidoFinalizado(partido);
              const tienePronostico = partido.YA_PREDICHO === 1;
              
              return (
                <div key={partido.NRO_PARTIDO} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                        <span className="text-sm font-semibold text-gray-800">
                          {partido.EQUIPO_1_NOMBRE} vs {partido.EQUIPO_2_NOMBRE}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {partido.FECHA ? new Date(partido.FECHA).toLocaleString() : '-'}
                      </div>
                    </div>
                    {getEstadoBadge(partido)}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                    <div>
                      <div className="text-xs text-gray-500">Pronóstico</div>
                      {tienePronostico ? (
                        finalizado ? (
                          <div className="text-sm font-bold text-blue-600">
                            {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                          </div>
                        ) : (
                          <Lock className="h-4 w-4 text-gray-400 mx-auto mt-1" />
                        )
                      ) : (
                        <div className="text-xs text-gray-400 mt-1">-</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Resultado</div>
                      {finalizado ? (
                        <div className="text-sm font-bold text-green-600">
                          {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
                        </div>
                      ) : (
                        <Hourglass className="h-4 w-4 text-gray-400 mx-auto mt-1" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Acierto</div>
                      {finalizado && tienePronostico ? (
                        getAciertoIndicator(partido)
                      ) : (
                        <div className="text-xs text-gray-400 mt-1">-</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Puntos</div>
                      {finalizado && tienePronostico ? (
                        <div className="text-base font-bold text-indigo-600">
                          +{partido.PUNTOS_OBTENIDOS || 0}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 mt-1">-</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Resumen de estadísticas */}
      {partidosFiltrados.length > 0 && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">
              {partidosFiltrados.length}
            </div>
            <div className="text-xs text-gray-500">Partidos</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {partidosFiltrados.filter(p => isPartidoFinalizado(p)).length}
            </div>
            <div className="text-xs text-gray-500">Finalizados</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {partidosFiltrados.filter(p => !isPartidoFinalizado(p)).length}
            </div>
            <div className="text-xs text-gray-500">Pendientes</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {partidosFiltrados.filter(p => p.YA_PREDICHO === 1).length}
            </div>
            <div className="text-xs text-gray-500">Con pronóstico</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PronosticosUsuarioPage;