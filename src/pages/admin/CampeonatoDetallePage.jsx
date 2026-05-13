import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, Grid, PlusCircle, CheckCircle, Save, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CampeonatoDetallePage = () => {
  const { c_campeonato } = useParams();
  const navigate = useNavigate();
  const [campeonato, setCampeonato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quinielas');
  const [quinielas, setQuinielas] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [enviando, setEnviando] = useState({});
  const [resultadosPendientes, setResultadosPendientes] = useState({});

  useEffect(() => {
    cargarCampeonato();
    cargarQuinielas();
    cargarPartidos();
  }, [c_campeonato]);

  const cargarCampeonato = async () => {
    try {
      const response = await api.get('/api/admin/campeonatos');
      const encontrado = response.data.data?.find(c => c.C_CAMPEONATO === c_campeonato);
      setCampeonato(encontrado);
    } catch (error) {
      toast.error('Error al cargar campeonato');
    }
  };

  const cargarQuinielas = async () => {
    try {
      const response = await api.get(`/api/admin/campeonatos/${c_campeonato}/quinielas`);
      setQuinielas(response.data.data || []);
    } catch (error) {
      //console.error('Error al cargar quinielas', error);
    }
  };

  const cargarPartidos = async () => {
    try {
      const response = await api.get(`/api/partidos/campeonato/${c_campeonato}`);
      setPartidos(response.data.data || []);
    } catch (error) {
      //console.error('Error al cargar partidos', error);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en los inputs de resultados
  const handleResultadoChange = (partidoId, campo, valor) => {
    setResultadosPendientes(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [campo]: parseInt(valor) || 0,
        nro_partido: partidoId
      }
    }));
  };

  // Enviar resultado del partido
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

      // Limpiar el estado de este partido
      setResultadosPendientes(prev => {
        const newState = { ...prev };
        delete newState[partido.NRO_PARTIDO];
        return newState;
      });

      // Recargar partidos
      await cargarPartidos();
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al registrar resultado');
    } finally {
      setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: false }));
    }
  };

  const tabs = [
    { id: 'quinielas', name: 'Quinielas', icon: <Trophy className="h-4 w-4" /> },
    { id: 'partidos', name: 'Partidos', icon: <Calendar className="h-4 w-4" /> },
    { id: 'resultados', name: 'Resultados', icon: <CheckCircle className="h-4 w-4" /> }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div>
      {/* <Link to="/admin/campeonatos" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Campeonatoss
      </Link> */}

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{campeonato?.N_CAMPEONATO || c_campeonato}</h1>
            <p className="mt-2 text-indigo-100">Código: {c_campeonato}</p>
          </div>
          <Trophy className="h-16 w-16 opacity-30" />
        </div>
      </div>

      {/* Pestañas de navegación */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido - Quinielas (CLICKEABLES) */}
      {activeTab === 'quinielas' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Quinielas del Campeonato</h2>
            <Link
              to="/admin/crear-quiniela"
              className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Nueva Quiniela
            </Link>
          </div>
          {quinielas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay quinielas creadas para este campeonato</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quinielas.map((quiniela) => (
                <div
                  key={quiniela.ID_QUINIELA}
                  onClick={() => navigate(`/admin/quinielas/${quiniela.ID_QUINIELA}`)}
                  className="border rounded-lg p-4 hover:bg-indigo-50 hover:border-indigo-300 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-indigo-700">{quiniela.NOMBRE}</h3>
                      <p className="text-sm text-gray-500 mt-1">{quiniela.DESCRIPCION || 'Sin descripción'}</p>
                      <div className="text-xs text-gray-400 mt-2">
                        Inicio: {new Date(quiniela.FECHA_INICIO).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                      quiniela.ESTADO === 'ACTIVA' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {quiniela.ESTADO}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t flex justify-end">
                    <span className="text-xs text-indigo-600 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Ver detalles
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido - Partidos */}
      {activeTab === 'partidos' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Partidos del Campeonato</h2>
            <Link
              to="/admin/crear-partido"
              className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Nuevo Partido
            </Link>
          </div>
          {partidos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay partidos registrados para este campeonato</div>
          ) : (
            <div className="space-y-3">
              {partidos.map((partido) => (
                <div key={partido.NRO_PARTIDO} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-mono text-xs text-gray-500">#{partido.NRO_PARTIDO}</span>
                      <div className="font-semibold mt-1">
                        {partido.EQUIPO_1_NOMBRE} vs {partido.EQUIPO_2_NOMBRE}
                      </div>
                      {partido.FECHA && (
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(partido.FECHA).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {partido.Q_GOLES_E1 !== null ? (
                        <div className="text-lg font-bold text-green-600">
                          {partido.Q_GOLES_E1} - {partido.Q_GOLES_E2}
                        </div>
                      ) : (
                        <span className="text-sm text-yellow-600">Pendiente</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido - Resultados */}
      {activeTab === 'resultados' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Registrar Resultados</h2>
          {partidos.filter(p => p.Q_GOLES_E1 === null).length === 0 ? (
            <div className="text-center py-8 text-green-600">
              <CheckCircle className="h-12 w-12 mx-auto mb-2" />
              <p>¡Todos los partidos tienen resultado registrado!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {partidos.filter(p => p.Q_GOLES_E1 === null).map((partido) => (
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
      )}
    </div>
  );
};

export default CampeonatoDetallePage;