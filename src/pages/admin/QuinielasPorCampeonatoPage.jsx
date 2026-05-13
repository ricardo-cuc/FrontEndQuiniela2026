import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, Plus, Users, TrendingUp, Lock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const QuinielasPorCampeonatoPage = () => {
  const { c_campeonato } = useParams();
  const [campeonato, setCampeonato] = useState(null);
  const [quinielas, setQuinielas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [c_campeonato]);

  const cargarDatos = async () => {
    try {
      const campeonatosRes = await api.get('/api/admin/campeonatos');
      const campeonatoEncontrado = campeonatosRes.data.data?.find(c => c.C_CAMPEONATO === c_campeonato);
      setCampeonato(campeonatoEncontrado);

      const quinielasRes = await api.get(`/api/admin/campeonatos/${c_campeonato}/quinielas`);
      setQuinielas(quinielasRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar datos');
      //console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (quiniela) => {
    // Usar PREDICCIONES_BLOQUEADAS en lugar de BLOQUEADA
    if (quiniela.PREDICCIONES_BLOQUEADAS === 1 || quiniela.PREDICCIONES_BLOQUEADAS === true) {
      return 'bg-red-100 text-red-700';
    }
    const colors = {
      'ACTIVA': 'bg-green-100 text-green-700',
      'INACTIVA': 'bg-gray-100 text-gray-700',
      'FINALIZADA': 'bg-blue-100 text-blue-700'
    };
    return colors[quiniela.ESTADO] || 'bg-gray-100 text-gray-700';
  };

  const getEstadoTexto = (quiniela) => {
    if (quiniela.PREDICCIONES_BLOQUEADAS === 1 || quiniela.PREDICCIONES_BLOQUEADAS === true) {
      return 'PREDICCIONES BLOQUEADAS';
    }
    return quiniela.ESTADO;
  };

  const estaBloqueada = (quiniela) => {
    return quiniela.PREDICCIONES_BLOQUEADAS === 1 || quiniela.PREDICCIONES_BLOQUEADAS === true;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando quinielas...</div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/campeonatos" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Campeona
      </Link>

      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{campeonato?.N_CAMPEONATO || c_campeonato}</h1>
            <p className="mt-2">Código: {c_campeonato}</p>
          </div>
          <Trophy className="h-12 w-12 opacity-50" />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Quinielas de este Campeonato</h2>
        <Link
          to="/admin/crear-quiniela"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Quiniela
        </Link>
      </div>

      {quinielas.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No hay quinielas creadas para este campeonato</p>
          <Link to="/admin/crear-quiniela" className="text-indigo-600 hover:underline mt-4 inline-block">
            Crear primera quiniela
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quinielas.map((quiniela) => {
          const bloqueada = estaBloqueada(quiniela);
          return (
            <div key={quiniela.ID_QUINIELA} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  {bloqueada ? (
                    <Lock className="h-8 w-8 text-red-600" />
                  ) : (
                    <Trophy className="h-8 w-8 text-indigo-600" />
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${getEstadoBadge(quiniela)}`}>
                    {getEstadoTexto(quiniela)}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 line-clamp-1">{quiniela.NOMBRE}</h3>
                
                {bloqueada && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-xs font-semibold flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Predicciones Bloqueadas - No se permiten nuevas predicciones
                    </p>
                  </div>
                )}
                
                <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                  {quiniela.DESCRIPCION || 'Sin descripción'}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-xs text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      Inicio: {new Date(quiniela.FECHA_INICIO).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      Fin: {new Date(quiniela.FECHA_FIN).toLocaleDateString()}
                    </span>
                  </div>
                  {quiniela.FECHA_LIMITE_PREDICCIONES && (
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        Límite: {new Date(quiniela.FECHA_LIMITE_PREDICCIONES).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {quiniela.CREADA_POR && (
                    <div className="flex items-center text-xs text-gray-400">
                      <Users className="h-3 w-3 mr-1" />
                      <span>Creada por: {quiniela.CREADA_POR}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-3 border-t">
                  {!bloqueada ? (
                    <Link
                      to={`/quinielas/${quiniela.ID_QUINIELA}/predicciones`}
                      className="flex-1 text-center text-sm bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
                    >
                      Hacer Predicciones
                    </Link>
                  ) : (
                    <div className="flex-1 text-center text-sm bg-gray-100 text-gray-500 py-2 rounded-md cursor-not-allowed">
                      Predicciones Bloqueadas
                    </div>
                  )}
                  
                  <Link
                    to={`/admin/quinielas/${quiniela.ID_QUINIELA}/estadisticas`}
                    className="flex-1 text-center text-sm text-indigo-600 hover:text-indigo-800 py-2"
                  >
                    Estadísticas
                  </Link>
                  
                  <Link
                    to={`/admin/quinielas/${quiniela.ID_QUINIELA}/ranking`}
                    className="flex-1 text-center text-sm text-green-600 hover:text-green-800 py-2"
                  >
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    Ranking
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuinielasPorCampeonatoPage;