import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, PlusCircle, CheckCircle, Save, Clock, Users, X, Plus, Lock, Unlock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QuinielaDetallePage = () => {
  const { id } = useParams();
  const [quiniela, setQuiniela] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGrupoModal, setShowGrupoModal] = useState(false);
  const [enviando, setEnviando] = useState({});
  const [resultadosPendientes, setResultadosPendientes] = useState({});
  const [prediccionesBloqueadas, setPrediccionesBloqueadas] = useState(false);
  
  // Estados para controlar envíos múltiples
  const [isSubmittingPartido, setIsSubmittingPartido] = useState(false);
  const [isSubmittingGrupo, setIsSubmittingGrupo] = useState(false);
  
  const [nuevoPartido, setNuevoPartido] = useState({
    c_equipo_1: '',
    c_equipo_2: '',
    fecha: '',
    id_grupo: ''
  });
  const [nuevoGrupo, setNuevoGrupo] = useState({
    nombre: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      // 🔥 USAR ENDPOINT PÚBLICO (no requiere inscripción)
      const quinielasRes = await api.get('/api/quinielas');
      const quinielaEncontrada = quinielasRes.data.data?.find(q => q.ID_QUINIELA === parseInt(id));
      console.log('📋 Quiniela encontrada:', quinielaEncontrada);
      setQuiniela(quinielaEncontrada);
      
      if (quinielaEncontrada) {
        // Usar PREDICCIONES_BLOQUEADAS (puede ser 1/0 o true/false)
        setPrediccionesBloqueadas(quinielaEncontrada.PREDICCIONES_BLOQUEADAS === 1 || quinielaEncontrada.PREDICCIONES_BLOQUEADAS === true);
      }

      // Cargar partidos
      const partidosRes = await api.get(`/api/partidos/quiniela/${id}`);
      console.log('📊 Partidos cargados:', partidosRes.data.data);
      setPartidos(partidosRes.data.data || []);

      // 🔥 CARGAR EQUIPOS USANDO EL CAMPEONATO DE LA QUINIELA
      if (quinielaEncontrada && quinielaEncontrada.C_CAMPEONATO) {
        const campeonato = quinielaEncontrada.C_CAMPEONATO;
        console.log('📡 Cargando equipos para campeonato (desde quiniela):', campeonato);
        try {
          const equiposRes = await api.get(`/api/equipos/campeonato/${campeonato}`);
          console.log('✅ Equipos cargados:', equiposRes.data.data);
          setEquipos(equiposRes.data.data || []);
        } catch (error) {
          console.error('Error cargando equipos:', error);
          setEquipos([]);
        }
      } else {
        console.warn('⚠️ No se pudo obtener el campeonato de la quiniela');
      }

      // Cargar grupos
      try {
        console.log('📡 Cargando grupos para quiniela:', id);
        const gruposRes = await api.get(`/api/grupos/quiniela/${id}`);
        console.log('✅ Grupos cargados:', gruposRes.data.data);
        setGrupos(gruposRes.data.data || []);
      } catch (error) {
        console.log('❌ No se pudieron cargar los grupos:', error);
        setGrupos([]);
      }

    } catch (error) {
      toast.error('Error al cargar datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBloqueoPredicciones = async () => {
    const nuevoEstado = !prediccionesBloqueadas;
    try {
      await api.put(`/api/admin/quinielas/${id}/bloquear-predicciones`, {
        bloquear: nuevoEstado
      });
      setPrediccionesBloqueadas(nuevoEstado);
      toast.success(nuevoEstado ? '🔒 Predicciones bloqueadas' : '🔓 Predicciones desbloqueadas');
      await cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al cambiar estado');
    }
  };

  const handleResultadoChange = (partidoId, campo, valor) => {
    setResultadosPendientes(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [campo]: parseInt(valor) || 0
      }
    }));
  };

  const enviarResultado = async (partido) => {
    const resultado = resultadosPendientes[partido.NRO_PARTIDO];
    
    if (!resultado || resultado.GOLES_LOCAL === undefined || resultado.GOLES_VISITANTE === undefined) {
      toast.error('Ingresa los goles para ambos equipos');
      return;
    }

    setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: true }));

    try {
      await api.put(`/api/partidos/${partido.NRO_PARTIDO}/resultado`, {
        q_goles_e1: resultado.GOLES_LOCAL,
        q_goles_e2: resultado.GOLES_VISITANTE
      });
      toast.success(`Resultado registrado: ${partido.EQUIPO_1_NOMBRE} ${resultado.GOLES_LOCAL} - ${resultado.GOLES_VISITANTE} ${partido.EQUIPO_2_NOMBRE}`);
      
      setResultadosPendientes(prev => {
        const newState = { ...prev };
        delete newState[partido.NRO_PARTIDO];
        return newState;
      });
      
      await cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al registrar resultado');
    } finally {
      setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: false }));
    }
  };

  const handleNuevoPartidoChange = (e) => {
    setNuevoPartido({
      ...nuevoPartido,
      [e.target.name]: e.target.value
    });
  };

  const handleNuevoGrupoChange = (e) => {
    setNuevoGrupo({
      nombre: e.target.value
    });
  };

  // Función para cerrar modal de partido
  const cerrarModalPartido = () => {
    if (!isSubmittingPartido) {
      setShowModal(false);
      setNuevoPartido({ c_equipo_1: '', c_equipo_2: '', fecha: '', id_grupo: '' });
    }
  };

  // Función para cerrar modal de grupo
  const cerrarModalGrupo = () => {
    if (!isSubmittingGrupo) {
      setShowGrupoModal(false);
      setNuevoGrupo({ nombre: '' });
    }
  };

  const crearGrupo = async (e) => {
    e.preventDefault();
    
    if (isSubmittingGrupo) return;
    
    if (!nuevoGrupo.nombre) {
      toast.error('El nombre del grupo es requerido');
      return;
    }

    if (!quiniela) {
      toast.error('No se pudo identificar la quiniela');
      return;
    }

    setIsSubmittingGrupo(true);

    try {
      await api.post('/api/grupos', {
        nombre: nuevoGrupo.nombre,
        c_campeonato: quiniela.C_CAMPEONATO,
        id_quiniela: parseInt(id)
      });
      toast.success(`Grupo "${nuevoGrupo.nombre}" creado exitosamente`);
      setShowGrupoModal(false);
      setNuevoGrupo({ nombre: '' });
      await cargarDatos();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al crear grupo');
    } finally {
      setIsSubmittingGrupo(false);
    }
  };

  const crearPartido = async (e) => {
    e.preventDefault();
    
    if (isSubmittingPartido) return;
    
    if (!nuevoPartido.c_equipo_1 || !nuevoPartido.c_equipo_2) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    if (nuevoPartido.c_equipo_1 === nuevoPartido.c_equipo_2) {
      toast.error('Los equipos deben ser diferentes');
      return;
    }

    if (!nuevoPartido.id_grupo) {
      toast.error('El grupo es requerido');
      return;
    }

    if (!quiniela) {
      toast.error('No se pudo identificar la quiniela');
      return;
    }

    setIsSubmittingPartido(true);

    try {
      await api.post('/api/partidos', {
        c_campeonato: quiniela.C_CAMPEONATO,
        c_equipo_1: nuevoPartido.c_equipo_1,
        c_equipo_2: nuevoPartido.c_equipo_2,
        fecha: nuevoPartido.fecha || null,
        id_grupo: parseInt(nuevoPartido.id_grupo),
        id_fase: null,
        actualizado_por: '00656'
      });
      toast.success('Partido creado exitosamente');
      setShowModal(false);
      setNuevoPartido({ c_equipo_1: '', c_equipo_2: '', fecha: '', id_grupo: '' });
      await cargarDatos();
    } catch (error) {
      const mensaje = error.response?.data?.message || error.response?.data?.mensaje || 'Error al crear partido';
      toast.error(mensaje);
    } finally {
      setIsSubmittingPartido(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  const quinielaNombre = quiniela?.NOMBRE || `Quiniela #${id}`;
  const quinielaCampeonato = quiniela?.C_CAMPEONATO || 'LGN';
  const quinielaEstado = quiniela?.ESTADO || 'ACTIVA';
  const fechaInicio = quiniela?.FECHA_INICIO ? new Date(quiniela.FECHA_INICIO) : new Date();
  const fechaFin = quiniela?.FECHA_FIN ? new Date(quiniela.FECHA_FIN) : new Date();

  const partidosPendientes = partidos.filter(p => p.Q_GOLES_E1 === null);
  const partidosFinalizados = partidos.filter(p => p.Q_GOLES_E1 !== null);

  console.log('🎯 Estado final - equipos:', equipos.length);
  console.log('🎯 Estado final - grupos:', grupos.length);

  return (
    <div>
      <Link to="/admin/campeonatos" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Campeonatos
      </Link>

      {/* HEADER ACTUALIZADO CON ESTADO DE BLOQUEO */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{quinielaNombre}</h1>
            <p className="mt-2 text-indigo-100">ID: {id} | Campeonato: {quinielaCampeonato}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span>📅 {fechaInicio.toLocaleDateString()} - {fechaFin.toLocaleDateString()}</span>
              <span>🏆 {quinielaCampeonato}</span>
              <span>⭐ Estado quiniela: {quinielaEstado}</span>
              {/* 🔥 ESTADO DE BLOQUEO DE PREDICCIONES */}
              <span className={`${prediccionesBloqueadas ? 'bg-red-500' : 'bg-green-500'} px-2 py-0.5 rounded-full text-xs font-semibold`}>
                {prediccionesBloqueadas ? '🔒 PREDICCIONES BLOQUEADAS' : '🔓 PREDICCIONES ABIERTAS'}
              </span>
              <span>⚽ {partidos.length} partidos totales</span>
              <span>📋 {grupos.length} grupos</span>
              <span>⚡ {equipos.length} equipos</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={toggleBloqueoPredicciones}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition font-semibold ${
                prediccionesBloqueadas 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              } text-white`}
            >
              {prediccionesBloqueadas ? (
                <><Lock className="h-4 w-4" /> DESBLOQUEAR</>
              ) : (
                <><Unlock className="h-4 w-4" /> BLOQUEAR</>
              )}
            </button>
            <Trophy className="h-16 w-16 opacity-30" />
          </div>
        </div>
      </div>

      {/* BANNER DE PREDICCIONES BLOQUEADAS */}
      {prediccionesBloqueadas && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <Lock className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <p className="text-red-700 font-semibold">Predicciones Bloqueadas</p>
              <p className="text-red-600 text-sm">
                Esta quiniela tiene las predicciones bloqueadas. Los usuarios no pueden hacer nuevas predicciones.
                {quiniela?.FECHA_LIMITE_PREDICCIONES && (
                  <> Fecha límite establecida: {new Date(quiniela.FECHA_LIMITE_PREDICCIONES).toLocaleString()}</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Nuevo Partido
        </button>
      </div>

      {/* Partidos Pendientes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-yellow-500" />
          Partidos Pendientes ({partidosPendientes.length})
        </h2>
        {partidosPendientes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No hay partidos pendientes</div>
        ) : (
          <div className="space-y-4">
            {partidosPendientes.map((partido) => (
              <div key={partido.NRO_PARTIDO} className="border rounded-lg p-4">
                <div className="font-semibold mb-3 text-center">
                  {partido.EQUIPO_1_NOMBRE} vs {partido.EQUIPO_2_NOMBRE}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="text-center">
                    <label className="block text-xs text-gray-500 mb-1">Local</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={resultadosPendientes[partido.NRO_PARTIDO]?.GOLES_LOCAL ?? ''}
                      onChange={(e) => handleResultadoChange(partido.NRO_PARTIDO, 'GOLES_LOCAL', e.target.value)}
                      className="w-24 text-center text-2xl px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="?"
                    />
                  </div>
                  <span className="text-2xl font-bold text-gray-400">VS</span>
                  <div className="text-center">
                    <label className="block text-xs text-gray-500 mb-1">Visitante</label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={resultadosPendientes[partido.NRO_PARTIDO]?.GOLES_VISITANTE ?? ''}
                      onChange={(e) => handleResultadoChange(partido.NRO_PARTIDO, 'GOLES_VISITANTE', e.target.value)}
                      className="w-24 text-center text-2xl px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="?"
                    />
                  </div>
                  <button
                    onClick={() => enviarResultado(partido)}
                    disabled={enviando[partido.NRO_PARTIDO]}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {enviando[partido.NRO_PARTIDO] ? 'Guardando...' : 'Registrar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Partidos Finalizados */}
      {partidosFinalizados.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Partidos Finalizados ({partidosFinalizados.length})
          </h2>
          <div className="space-y-3">
            {partidosFinalizados.map((partido) => (
              <div key={partido.NRO_PARTIDO} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{partido.EQUIPO_1_NOMBRE} vs {partido.EQUIPO_2_NOMBRE}</div>
                    {partido.FECHA && <div className="text-sm text-gray-500 mt-1">{new Date(partido.FECHA).toLocaleString()}</div>}
                  </div>
                  <div className="text-2xl font-bold text-green-600">{partido.Q_GOLES_E1} - {partido.Q_GOLES_E2}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR PARTIDO - ACTUALIZADO */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nuevo Partido</h2>
              <button 
                onClick={cerrarModalPartido} 
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmittingPartido}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={crearPartido}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Partido (auto-generado)
                </label>
                <input
                  type="text"
                  readOnly
                  value="Automático"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                />
                <p className="text-xs text-gray-400 mt-1">Se asignará automáticamente</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipo Local *
                </label>
                <select
                  name="c_equipo_1"
                  required
                  value={nuevoPartido.c_equipo_1}
                  onChange={handleNuevoPartidoChange}
                  disabled={isSubmittingPartido}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Selecciona un equipo</option>
                  {equipos.map((equipo) => (
                    <option key={equipo.C_EQUIPO} value={equipo.C_EQUIPO}>
                      {equipo.N_EQUIPO} ({equipo.C_EQUIPO})
                    </option>
                  ))}
                </select>
                {equipos.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No hay equipos disponibles</p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipo Visitante *
                </label>
                <select
                  name="c_equipo_2"
                  required
                  value={nuevoPartido.c_equipo_2}
                  onChange={handleNuevoPartidoChange}
                  disabled={isSubmittingPartido}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Selecciona un equipo</option>
                  {equipos.map((equipo) => (
                    <option key={equipo.C_EQUIPO} value={equipo.C_EQUIPO}>
                      {equipo.N_EQUIPO} ({equipo.C_EQUIPO})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grupo *
                </label>
                <div className="flex gap-2">
                  <select
                    name="id_grupo"
                    required
                    value={nuevoPartido.id_grupo}
                    onChange={handleNuevoPartidoChange}
                    disabled={isSubmittingPartido}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">Selecciona un grupo</option>
                    {grupos.map((grupo) => (
                      <option key={grupo.ID_GRUPO} value={grupo.ID_GRUPO}>
                        Grupo {grupo.NOMBRE}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowGrupoModal(true)}
                    disabled={isSubmittingPartido}
                    className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 flex items-center gap-1 disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" /> Nuevo
                  </button>
                </div>
                {grupos.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    No hay grupos. Haz clic en "Nuevo" para crear uno.
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  name="fecha"
                  value={nuevoPartido.fecha}
                  onChange={handleNuevoPartidoChange}
                  disabled={isSubmittingPartido}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarModalPartido}
                  disabled={isSubmittingPartido}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPartido}
                  className={`px-4 py-2 rounded-md text-white ${
                    isSubmittingPartido 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmittingPartido ? 'Creando...' : 'Crear Partido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR GRUPO - ACTUALIZADO */}
      {showGrupoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Nuevo Grupo</h2>
              <button 
                onClick={cerrarModalGrupo} 
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmittingGrupo}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={crearGrupo}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Grupo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={nuevoGrupo.nombre}
                  onChange={handleNuevoGrupoChange}
                  disabled={isSubmittingGrupo}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  placeholder="Ej: A, B, C, D"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  Se creará en la quiniela: <strong>{quinielaNombre}</strong>
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cerrarModalGrupo}
                  disabled={isSubmittingGrupo}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGrupo}
                  className={`px-4 py-2 rounded-md text-white ${
                    isSubmittingGrupo 
                      ? 'bg-indigo-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isSubmittingGrupo ? 'Creando...' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuinielaDetallePage;