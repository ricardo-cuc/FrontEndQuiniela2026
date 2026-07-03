// src/pages/PronosticosUsuarioPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, CheckCircle, ArrowLeft, Trophy, User, Award, Target, 
  AlertCircle, Lock, Filter, Search, FileCheck, Clock, Zap, 
  X, ChevronDown, ChevronUp, ArrowUpDown, Layers, Circle
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const PronosticosUsuarioPage = () => {
  const { quinielaId, usuarioCodigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [partidos, setPartidos] = useState([]);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [quinielaInfo, setQuinielaInfo] = useState(null);
  const [metadata, setMetadata] = useState(null);
  
  // Estados de filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroAcierto, setFiltroAcierto] = useState('todos');
  const [filtroPronostico, setFiltroPronostico] = useState('todos');
  const [filtroFase, setFiltroFase] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('fecha');
  const [ordenDireccion, setOrdenDireccion] = useState('desc');
  
  // Filtros avanzados
  const [mostrarAvanzados, setMostrarAvanzados] = useState(false);
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    soloConPuntos: false,
    ocultarFallos: false,
    mostrarEmpates: false,
    fechaDesde: null,
    fechaHasta: null,
    rangoPuntos: [0, 100]
  });

  // ============================================
  // OBTENER FASES ÚNICAS (desde metadata o calcular)
  // ============================================
  const fasesUnicas = useMemo(() => {
    if (metadata?.fasesDisponibles?.length > 0) {
      return metadata.fasesDisponibles;
    }
    const fases = new Set();
    partidos.forEach(p => {
      if (p.FASE) {
        fases.add(p.FASE);
      }
    });
    return Array.from(fases).sort();
  }, [metadata, partidos]);

  // ============================================
  // EFECTOS Y CARGA DE DATOS
  // ============================================
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
      if (data.metadata) setMetadata(data.metadata);
      
      // console.log('📊 Datos cargados:', {
      //   partidos: data.partidos?.length || 0,
      //   fases: data.metadata?.fasesDisponibles || [],
      //   usuario: data.usuario?.U_NOMBRE
      // });
      
    } catch (error) {
      // console.error('❌ Error cargando pronósticos:', error);
      toast.error('Error al cargar los pronósticos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES UTILITARIAS
  // ============================================
  const isPartidoFinalizado = (partido) => {
    return partido.ESTADO_PARTIDO === 'FINALIZADO' || 
           (partido.GOLES_REALES_LOCAL !== null && partido.GOLES_REALES_LOCAL !== undefined);
  };

  const getTipoAcierto = (partido) => {
    if (!isPartidoFinalizado(partido) || partido.YA_PREDICHO !== 1) return null;
    
    const realLocal = partido.GOLES_REALES_LOCAL;
    const realVisit = partido.GOLES_REALES_VISITANTE;
    const predLocal = partido.GOLES_LOCAL_PRED;
    const predVisit = partido.GOLES_VISITANTE_PRED;
    
    // Verificar que los datos existen
    if (realLocal === null || realLocal === undefined || 
        realVisit === null || realVisit === undefined ||
        predLocal === null || predLocal === undefined ||
        predVisit === null || predVisit === undefined) {
      return null;
    }
    
    if (realLocal === predLocal && realVisit === predVisit) {
      return { tipo: 'exacto', label: 'Exacto', puntos: partido.PUNTOS_OBTENIDOS || 3 };
    }
    
    const difReal = realLocal - realVisit;
    const difPred = predLocal - predVisit;
    
    if (difReal === difPred) {
      return { tipo: 'diferencia', label: 'Diferencia', puntos: partido.PUNTOS_OBTENIDOS || 2 };
    }
    
    const ganadorReal = realLocal > realVisit ? 'local' : realLocal < realVisit ? 'visitante' : 'empate';
    const ganadorPred = predLocal > predVisit ? 'local' : predLocal < predVisit ? 'visitante' : 'empate';
    
    if (ganadorReal === ganadorPred) {
      return { tipo: 'ganador', label: 'Ganador', puntos: partido.PUNTOS_OBTENIDOS || 1 };
    }
    
    return { tipo: 'fallo', label: 'Fallo', puntos: 0 };
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

  // ============================================
  // ORDENAMIENTO
  // ============================================
  const partidosOrdenados = useMemo(() => {
    return [...partidos].sort((a, b) => {
      const aFinalizado = isPartidoFinalizado(a);
      const bFinalizado = isPartidoFinalizado(b);
      const aPuntos = a.PUNTOS_OBTENIDOS || 0;
      const bPuntos = b.PUNTOS_OBTENIDOS || 0;
      const aFecha = new Date(a.FECHA);
      const bFecha = new Date(b.FECHA);
      
      let comparacion = 0;

      switch (orden) {
        case 'finalizacion':
          if (aFinalizado && !bFinalizado) return -1 * (ordenDireccion === 'asc' ? 1 : -1);
          if (!aFinalizado && bFinalizado) return 1 * (ordenDireccion === 'asc' ? 1 : -1);
          if (aFinalizado && bFinalizado) {
            comparacion = bPuntos - aPuntos;
            if (comparacion === 0) comparacion = bFecha - aFecha;
            return comparacion * (ordenDireccion === 'asc' ? -1 : 1);
          }
          comparacion = aFecha - bFecha;
          return comparacion * (ordenDireccion === 'asc' ? 1 : -1);

        case 'puntos':
          comparacion = bPuntos - aPuntos;
          if (comparacion === 0) comparacion = bFecha - aFecha;
          return comparacion * (ordenDireccion === 'asc' ? -1 : 1);

        case 'fecha':
          comparacion = aFecha - bFecha;
          return comparacion * (ordenDireccion === 'asc' ? 1 : -1);

        case 'equipo':
          comparacion = (a.EQUIPO_1_NOMBRE || '').localeCompare(b.EQUIPO_1_NOMBRE || '');
          return comparacion * (ordenDireccion === 'asc' ? 1 : -1);

        case 'fase':
          comparacion = (a.FASE || '').localeCompare(b.FASE || '');
          return comparacion * (ordenDireccion === 'asc' ? 1 : -1);

        default:
          return 0;
      }
    });
  }, [partidos, orden, ordenDireccion]);

  // ============================================
  // FILTRADO
  // ============================================
  const partidosFiltrados = useMemo(() => {
    let filtrados = partidosOrdenados;
    
    // Filtro por estado
    if (filtroEstado === 'finalizados') {
      filtrados = filtrados.filter(p => isPartidoFinalizado(p));
    } else if (filtroEstado === 'pendientes') {
      filtrados = filtrados.filter(p => !isPartidoFinalizado(p));
    }
    
    // Filtro por tipo de acierto
    if (filtroAcierto !== 'todos') {
      filtrados = filtrados.filter(p => {
        if (!isPartidoFinalizado(p) || p.YA_PREDICHO !== 1) return false;
        const acierto = getTipoAcierto(p);
        if (!acierto) return false;
        return acierto.tipo === filtroAcierto;
      });
    }
    
    // Filtro por pronóstico
    if (filtroPronostico === 'llenado') {
      filtrados = filtrados.filter(p => p.YA_PREDICHO === 1);
    } else if (filtroPronostico === 'no-llenado') {
      filtrados = filtrados.filter(p => p.YA_PREDICHO !== 1);
    }
    
    // Filtro por fase
    if (filtroFase !== 'todas') {
      filtrados = filtrados.filter(p => p.FASE === filtroFase);
    }
    
    // Filtros avanzados
    if (filtrosAvanzados.soloConPuntos) {
      filtrados = filtrados.filter(p => (p.PUNTOS_OBTENIDOS || 0) > 0);
    }
    
    if (filtrosAvanzados.ocultarFallos) {
      filtrados = filtrados.filter(p => {
        if (!isPartidoFinalizado(p) || p.YA_PREDICHO !== 1) return true;
        const acierto = getTipoAcierto(p);
        return acierto?.tipo !== 'fallo';
      });
    }
    
    if (filtrosAvanzados.mostrarEmpates) {
      filtrados = filtrados.filter(p => {
        if (!isPartidoFinalizado(p)) return false;
        return p.GOLES_REALES_LOCAL === p.GOLES_REALES_VISITANTE;
      });
    }
    
    // Rango de fechas
    if (filtrosAvanzados.fechaDesde) {
      const fechaDesde = new Date(filtrosAvanzados.fechaDesde);
      filtrados = filtrados.filter(p => new Date(p.FECHA) >= fechaDesde);
    }
    
    if (filtrosAvanzados.fechaHasta) {
      const fechaHasta = new Date(filtrosAvanzados.fechaHasta);
      fechaHasta.setHours(23, 59, 59);
      filtrados = filtrados.filter(p => new Date(p.FECHA) <= fechaHasta);
    }
    
    // Rango de puntos
    if (filtrosAvanzados.rangoPuntos[1] < 100) {
      filtrados = filtrados.filter(p => (p.PUNTOS_OBTENIDOS || 0) <= filtrosAvanzados.rangoPuntos[1]);
    }
    
    // Búsqueda
    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      filtrados = filtrados.filter(p => 
        (p.EQUIPO_1_NOMBRE?.toLowerCase() || '').includes(term) ||
        (p.EQUIPO_2_NOMBRE?.toLowerCase() || '').includes(term) ||
        (p.FASE?.toLowerCase() || '').includes(term)
      );
    }
    
    return filtrados;
  }, [partidosOrdenados, filtroEstado, filtroAcierto, filtroPronostico, 
      filtroFase, busqueda, filtrosAvanzados]);

  // ============================================
  // ESTADÍSTICAS
  // ============================================
  const stats = useMemo(() => {
    // Si tenemos metadata del backend, usarla
    if (metadata?.resumen) {
      const fasesStats = {};
      metadata.fasesDisponibles?.forEach(fase => {
        fasesStats[fase] = metadata.estadisticasPorFase?.[fase] || {
          total: 0,
          finalizados: 0,
          pendientes: 0,
          conPronostico: 0
        };
      });

      // Calcular aciertos desde los partidos
      const finalizados = partidos.filter(p => isPartidoFinalizado(p));
      const exactos = finalizados.filter(p => {
        if (p.YA_PREDICHO !== 1) return false;
        const acierto = getTipoAcierto(p);
        return acierto?.tipo === 'exacto';
      }).length;
      
      const diferencia = finalizados.filter(p => {
        if (p.YA_PREDICHO !== 1) return false;
        const acierto = getTipoAcierto(p);
        return acierto?.tipo === 'diferencia';
      }).length;
      
      const ganador = finalizados.filter(p => {
        if (p.YA_PREDICHO !== 1) return false;
        const acierto = getTipoAcierto(p);
        return acierto?.tipo === 'ganador';
      }).length;
      
      const fallos = finalizados.filter(p => {
        if (p.YA_PREDICHO !== 1) return false;
        const acierto = getTipoAcierto(p);
        return acierto?.tipo === 'fallo';
      }).length;

      return {
        total: metadata.resumen.totalPartidos || 0,
        finalizados: metadata.resumen.totalFinalizados || 0,
        pendientes: metadata.resumen.totalPendientes || 0,
        conPronostico: metadata.resumen.totalConPronostico || 0,
        sinPronostico: metadata.resumen.totalSinPronostico || 0,
        puntos: usuarioInfo?.PUNTOS_TOTALES || 0,
        exactos,
        diferencia,
        ganador,
        fallos,
        fasesStats,
        efectividad: finalizados.length > 0 ? Math.round((exactos + diferencia + ganador) / finalizados.length * 100) : 0
      };
    }

    // Fallback: calcular en frontend
    const total = partidos.length;
    const finalizados = partidos.filter(p => isPartidoFinalizado(p));
    const pendientes = partidos.filter(p => !isPartidoFinalizado(p));
    const conPronostico = partidos.filter(p => p.YA_PREDICHO === 1);
    const sinPronostico = partidos.filter(p => p.YA_PREDICHO !== 1);
    const puntos = usuarioInfo?.PUNTOS_TOTALES || 0;
    
    const fasesStats = {};
    fasesUnicas.forEach(fase => {
      const partidosFase = partidos.filter(p => p.FASE === fase);
      fasesStats[fase] = {
        total: partidosFase.length,
        finalizados: partidosFase.filter(p => isPartidoFinalizado(p)).length,
        pendientes: partidosFase.filter(p => !isPartidoFinalizado(p)).length,
        conPronostico: partidosFase.filter(p => p.YA_PREDICHO === 1).length
      };
    });
    
    const exactos = finalizados.filter(p => {
      if (p.YA_PREDICHO !== 1) return false;
      const acierto = getTipoAcierto(p);
      return acierto?.tipo === 'exacto';
    }).length;
    
    const diferencia = finalizados.filter(p => {
      if (p.YA_PREDICHO !== 1) return false;
      const acierto = getTipoAcierto(p);
      return acierto?.tipo === 'diferencia';
    }).length;
    
    const ganador = finalizados.filter(p => {
      if (p.YA_PREDICHO !== 1) return false;
      const acierto = getTipoAcierto(p);
      return acierto?.tipo === 'ganador';
    }).length;
    
    const fallos = finalizados.filter(p => {
      if (p.YA_PREDICHO !== 1) return false;
      const acierto = getTipoAcierto(p);
      return acierto?.tipo === 'fallo';
    }).length;
    
    return {
      total,
      finalizados: finalizados.length,
      pendientes: pendientes.length,
      conPronostico: conPronostico.length,
      sinPronostico: sinPronostico.length,
      puntos,
      exactos,
      diferencia,
      ganador,
      fallos,
      fasesStats,
      efectividad: finalizados.length > 0 ? Math.round((exactos + diferencia + ganador) / finalizados.length * 100) : 0
    };
  }, [partidos, usuarioInfo, fasesUnicas, metadata]);

  // ============================================
  // FUNCIONES DE CONTROL
  // ============================================
  const cambiarOrden = (nuevoOrden) => {
    if (orden === nuevoOrden) {
      setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc');
    } else {
      setOrden(nuevoOrden);
      setOrdenDireccion('desc');
    }
  };

  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFiltroAcierto('todos');
    setFiltroPronostico('todos');
    setFiltroFase('todas');
    setBusqueda('');
    setOrden('fecha');
    setOrdenDireccion('desc');
    setFiltrosAvanzados({
      soloConPuntos: false,
      ocultarFallos: false,
      mostrarEmpates: false,
      fechaDesde: null,
      fechaHasta: null,
      rangoPuntos: [0, 100]
    });
  };

  // Contar filtros activos
  const filtrosActivos = [
    filtroEstado !== 'todos',
    filtroAcierto !== 'todos',
    filtroPronostico !== 'todos',
    filtroFase !== 'todas',
    filtrosAvanzados.soloConPuntos,
    filtrosAvanzados.ocultarFallos,
    filtrosAvanzados.mostrarEmpates,
    !!filtrosAvanzados.fechaDesde,
    !!filtrosAvanzados.fechaHasta,
    filtrosAvanzados.rangoPuntos[1] < 100
  ].filter(Boolean).length;

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ==========================================
          NAVEGACIÓN
          ========================================== */}
      <Link 
        to={`/quinielas/${quinielaId}/ranking`} 
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver al Ranking
      </Link>

      {/* ==========================================
          HEADER DEL USUARIO
          ========================================== */}
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
                  <span className="font-bold">{stats.exactos + stats.diferencia + stats.ganador}</span>
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

      {/* ==========================================
          INFORMACIÓN DE LA QUINIELA
          ========================================== */}
      {quinielaInfo && (
        <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {quinielaInfo.NOMBRE}
              </h2>
              <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {quinielaInfo.FECHA_INICIO ? new Date(quinielaInfo.FECHA_INICIO).toLocaleDateString() : 'Fecha no disponible'} - 
                {quinielaInfo.FECHA_FIN ? new Date(quinielaInfo.FECHA_FIN).toLocaleDateString() : 'Fecha no disponible'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
              <FileCheck className="h-4 w-4 text-blue-600" />
              <span className="text-blue-700 font-medium">{stats.finalizados} partidos finalizados</span>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SECCIÓN DE FILTROS
          ========================================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        
        {/* NIVEL 1: Barra Superior Integrada */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 w-full sm:w-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar partido, equipo o fase..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
              />
            </div>

            <div className="text-sm text-gray-500 whitespace-nowrap">
              <span className="font-medium text-gray-700">{partidosFiltrados.length}</span> resultados
            </div>

            {filtrosActivos > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">Filtros:</span>
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-medium">
                  {filtrosActivos} activos
                </span>
              </div>
            )}

            <button
              onClick={limpiarFiltros}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filtrosActivos > 0 || busqueda
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              disabled={filtrosActivos === 0 && !busqueda}
            >
              <X className="h-4 w-4" />
              Limpiar
            </button>
          </div>

          {/* Chips de filtros activos */}
          {(filtroEstado !== 'todos' || filtroAcierto !== 'todos' || 
            filtroPronostico !== 'todos' || filtroFase !== 'todas') && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
              {filtroEstado !== 'todos' && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                  Estado: {filtroEstado}
                  <button onClick={() => setFiltroEstado('todos')} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtroAcierto !== 'todos' && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                  Acierto: {filtroAcierto}
                  <button onClick={() => setFiltroAcierto('todos')} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtroPronostico !== 'todos' && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                  Pronóstico: {filtroPronostico}
                  <button onClick={() => setFiltroPronostico('todos')} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtroFase !== 'todas' && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                  Fase: {filtroFase}
                  <button onClick={() => setFiltroFase('todas')} className="hover:text-red-500">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* NIVEL 2: Filtros Rápidos */}
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Estado */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5" />
                Estado
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  active={filtroEstado === 'todos'}
                  onClick={() => setFiltroEstado('todos')}
                  count={stats.total}
                >
                  Todos
                </FilterChip>
                <FilterChip
                  active={filtroEstado === 'finalizados'}
                  onClick={() => setFiltroEstado('finalizados')}
                  count={stats.finalizados}
                  variant="success"
                >
                  Finalizados
                </FilterChip>
                <FilterChip
                  active={filtroEstado === 'pendientes'}
                  onClick={() => setFiltroEstado('pendientes')}
                  count={stats.pendientes}
                  variant="warning"
                >
                  Pendientes
                </FilterChip>
              </div>
            </div>

            {/* Acierto */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Target className="h-3.5 w-3.5" />
                Acierto
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  active={filtroAcierto === 'todos'}
                  onClick={() => setFiltroAcierto('todos')}
                >
                  Todos
                </FilterChip>
                <FilterChip
                  active={filtroAcierto === 'exacto'}
                  onClick={() => setFiltroAcierto('exacto')}
                  count={stats.exactos}
                  variant="exacto"
                >
                  Exactos
                </FilterChip>
                <FilterChip
                  active={filtroAcierto === 'diferencia'}
                  onClick={() => setFiltroAcierto('diferencia')}
                  count={stats.diferencia}
                  variant="diferencia"
                >
                  Diferencia
                </FilterChip>
                <FilterChip
                  active={filtroAcierto === 'ganador'}
                  onClick={() => setFiltroAcierto('ganador')}
                  count={stats.ganador}
                  variant="ganador"
                >
                  Ganador
                </FilterChip>
                <FilterChip
                  active={filtroAcierto === 'fallo'}
                  onClick={() => setFiltroAcierto('fallo')}
                  count={stats.fallos}
                  variant="fallo"
                >
                  Fallos
                </FilterChip>
              </div>
            </div>

            {/* Pronóstico */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <CheckCircle className="h-3.5 w-3.5" />
                Pronóstico
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  active={filtroPronostico === 'todos'}
                  onClick={() => setFiltroPronostico('todos')}
                >
                  Todos
                </FilterChip>
                <FilterChip
                  active={filtroPronostico === 'llenado'}
                  onClick={() => setFiltroPronostico('llenado')}
                  count={stats.conPronostico}
                  variant="info"
                >
                  Llenados
                </FilterChip>
                <FilterChip
                  active={filtroPronostico === 'no-llenado'}
                  onClick={() => setFiltroPronostico('no-llenado')}
                  count={stats.sinPronostico}
                  variant="neutral"
                >
                  No llenados
                </FilterChip>
              </div>
            </div>

            {/* Fase */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5" />
                Fase
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  active={filtroFase === 'todas'}
                  onClick={() => setFiltroFase('todas')}
                  count={stats.total}
                >
                  Todas
                </FilterChip>
                {fasesUnicas.map(fase => {
                  const count = partidos.filter(p => p.FASE === fase).length;
                  return (
                    <FilterChip
                      key={fase}
                      active={filtroFase === fase}
                      onClick={() => setFiltroFase(fase)}
                      count={count}
                      variant="neutral"
                    >
                      {fase}
                    </FilterChip>
                  );
                })}
              </div>
            </div>

            {/* Ordenar */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Ordenar por
              </div>
              <div className="flex flex-wrap gap-1.5">
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="h-8 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                >
                  <option value="fecha">Fecha</option>
                  <option value="puntos">Puntos</option>
                  <option value="equipo">Equipo</option>
                  <option value="fase">Fase</option>
                  <option value="finalizacion">Finalización</option>
                </select>
                <button
                  onClick={() => setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')}
                  className="h-8 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition"
                >
                  {ordenDireccion === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* NIVEL 3: Filtros Avanzados */}
        <div className="p-2">
          <button
            onClick={() => setMostrarAvanzados(!mostrarAvanzados)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded-lg transition"
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="h-4 w-4" />
              <span>Filtros avanzados</span>
              {[filtrosAvanzados.soloConPuntos, filtrosAvanzados.ocultarFallos, 
                filtrosAvanzados.mostrarEmpates, !!filtrosAvanzados.fechaDesde, 
                !!filtrosAvanzados.fechaHasta, filtrosAvanzados.rangoPuntos[1] < 100]
                .some(v => v) && (
                <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-medium">
                  Activos
                </span>
              )}
            </div>
            {mostrarAvanzados ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {mostrarAvanzados && (
            <div className="px-3 pb-3 pt-1 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={filtrosAvanzados.soloConPuntos}
                      onChange={(e) => setFiltrosAvanzados({
                        ...filtrosAvanzados,
                        soloConPuntos: e.target.checked
                      })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Solo partidos con puntos
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={filtrosAvanzados.ocultarFallos}
                      onChange={(e) => setFiltrosAvanzados({
                        ...filtrosAvanzados,
                        ocultarFallos: e.target.checked
                      })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Ocultar fallos
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={filtrosAvanzados.mostrarEmpates}
                      onChange={(e) => setFiltrosAvanzados({
                        ...filtrosAvanzados,
                        mostrarEmpates: e.target.checked
                      })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Mostrar empates
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-600">Rango de fechas</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="date"
                      className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                      value={filtrosAvanzados.fechaDesde || ''}
                      onChange={(e) => setFiltrosAvanzados({
                        ...filtrosAvanzados,
                        fechaDesde: e.target.value
                      })}
                    />
                    <span className="text-gray-400 self-center hidden sm:block">→</span>
                    <input
                      type="date"
                      className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                      value={filtrosAvanzados.fechaHasta || ''}
                      onChange={(e) => setFiltrosAvanzados({
                        ...filtrosAvanzados,
                        fechaHasta: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <label>Rango de puntos</label>
                    <span>0 - {filtrosAvanzados.rangoPuntos[1]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filtrosAvanzados.rangoPuntos[1]}
                    onChange={(e) => setFiltrosAvanzados({
                      ...filtrosAvanzados,
                      rangoPuntos: [0, parseInt(e.target.value)]
                    })}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          TABLA DE PARTIDOS
          ========================================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partido
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fase
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
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    {busqueda ? 'No se encontraron partidos con esa búsqueda' : 'No hay partidos que coincidan con los filtros'}
                  </td>
                </tr>
              ) : (
                partidosFiltrados.map((partido) => {
                  const finalizado = isPartidoFinalizado(partido);
                  const tienePronostico = partido.YA_PREDICHO === 1;
                  const tipoAcierto = finalizado && tienePronostico ? getTipoAcierto(partido) : null;
                  
                  let bgColor = '';
                  if (finalizado && tienePronostico && tipoAcierto) {
                    if (tipoAcierto.tipo === 'exacto') bgColor = 'bg-green-50/50';
                    else if (tipoAcierto.tipo === 'diferencia') bgColor = 'bg-yellow-50/50';
                    else if (tipoAcierto.tipo === 'ganador') bgColor = 'bg-blue-50/50';
                    else if (tipoAcierto.tipo === 'fallo') bgColor = 'bg-red-50/50';
                  }
                  
                  return (
                    <tr key={partido.NRO_PARTIDO} className={`hover:bg-gray-50 transition-colors ${bgColor}`}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {partido.EQUIPO_1_NOMBRE || 'Equipo 1'} vs {partido.EQUIPO_2_NOMBRE || 'Equipo 2'}
                            </div>
                            <div className="text-xs text-gray-400">
                              {partido.FECHA ? new Date(partido.FECHA).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Fecha no disponible'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {partido.FASE ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            <Layers className="h-3 w-3 mr-1" />
                            {partido.FASE}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {getEstadoBadge(partido)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {tienePronostico ? (
                          finalizado ? (
                            <span className="text-sm font-bold text-blue-600">
                              {partido.GOLES_LOCAL_PRED ?? '?'} - {partido.GOLES_VISITANTE_PRED ?? '?'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 flex items-center justify-center gap-1">
                              <Lock className="h-3 w-3" />
                              <span>{partido.GOLES_LOCAL_PRED ?? '?'} - {partido.GOLES_VISITANTE_PRED ?? '?'}</span>
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                            <Circle className="h-3 w-3" />
                            Sin pronóstico
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {finalizado ? (
                          <span className="text-sm font-bold text-gray-800">
                            {partido.GOLES_REALES_LOCAL ?? '?'} - {partido.GOLES_REALES_VISITANTE ?? '?'}
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
                            {tipoAcierto.tipo === 'exacto' && '🎯'}
                            {tipoAcierto.tipo === 'diferencia' && '⚡'}
                            {tipoAcierto.tipo === 'ganador' && '👏'}
                            {tipoAcierto.tipo === 'fallo' && '❌'}
                            {' '}{tipoAcierto.label}
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

      {/* ==========================================
          RESUMEN DE ESTADÍSTICAS
          ========================================== */}
      {partidosFiltrados.length > 0 && stats.finalizados > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
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
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">
                {stats.ganador}
              </div>
              <div className="text-xs text-blue-600 font-medium">👏 Ganador</div>
              <div className="text-xs text-blue-500 mt-1">
                {stats.finalizados > 0 ? Math.round(stats.ganador / stats.finalizados * 100) : 0}%
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">
                {stats.exactos + stats.diferencia + stats.ganador}
              </div>
              <div className="text-xs text-purple-600 font-medium">✅ Aciertos totales</div>
              <div className="text-xs text-purple-500 mt-1">
                {stats.finalizados > 0 ? Math.round((stats.exactos + stats.diferencia + stats.ganador) / stats.finalizados * 100) : 0}%
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

// ============================================
// COMPONENTE FILTER CHIP REUTILIZABLE
// ============================================
const FilterChip = ({ 
  active, 
  onClick, 
  children, 
  count, 
  variant = 'default',
  className = '' 
}) => {
  const variantStyles = {
    default: 'bg-gray-50 border-gray-200 text-gray-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    exacto: 'bg-green-50 border-green-200 text-green-700',
    diferencia: 'bg-amber-50 border-amber-200 text-amber-700',
    ganador: 'bg-blue-50 border-blue-200 text-blue-700',
    fallo: 'bg-red-50 border-red-200 text-red-700',
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    neutral: 'bg-gray-50 border-gray-200 text-gray-700'
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium border transition-all
        ${active 
          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm hover:bg-indigo-700' 
          : `${variantStyles[variant]} hover:bg-opacity-80 hover:border-opacity-80`
        }
        ${className}
      `}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className={`
          text-xs px-1.5 rounded-full
          ${active ? 'bg-white/20 text-white' : 'bg-gray-200/50 text-gray-500'}
        `}>
          {count}
        </span>
      )}
    </button>
  );
};

export default PronosticosUsuarioPage;