import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Calendar, Trophy, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ResultadosPage = () => {
  const { id } = useParams();
  const [quiniela, setQuiniela] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState({});

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    try {
      // Cargar datos de la quiniela
      const quinielasRes = await api.post('/api/quinielas/mis-quinielas');
      const quinielaEncontrada = quinielasRes.data.data?.find(q => q.ID_QUINIELA === parseInt(id));
      setQuiniela(quinielaEncontrada);

      // Cargar partidos pendientes
      const partidosRes = await api.get(`/api/partidos/quiniela/${id}`);
      setPartidos(partidosRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar los datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGolesChange = (partidoId, campo, valor) => {
    setPartidos(prev => prev.map(p => 
      p.NRO_PARTIDO === partidoId ? { ...p, [campo]: parseInt(valor) || 0 } : p
    ));
  };

  const enviarResultado = async (partido) => {
    if (partido.GOLES_LOCAL === undefined || partido.GOLES_VISITANTE === undefined) {
      toast.error('Ingresa los goles para ambos equipos');
      return;
    }

    setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: true }));

    try {
      await api.put(`/api/partidos/${partido.NRO_PARTIDO}/resultado`, {
        q_goles_e1: partido.GOLES_LOCAL,
        q_goles_e2: partido.GOLES_VISITANTE
      });

      toast.success(`✅ Resultado registrado: ${partido.EQUIPO_1_NOMBRE} ${partido.GOLES_LOCAL} - ${partido.GOLES_VISITANTE} ${partido.EQUIPO_2_NOMBRE}`);
      
      // Recargar la lista
      await cargarDatos();
    } catch (error) {
      const mensaje = error.response?.data?.mensaje || 'Error al registrar resultado';
      toast.error(mensaje);
    } finally {
      setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando partidos pendientes...</div>
      </div>
    );
  }

  if (!quiniela) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Quiniela no encontrada</p>
        <Link to="/admin/resultados" className="text-indigo-600 hover:underline mt-4 inline-block">
          Volver a seleccionar quiniela
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin/resultados" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a Quinielas
      </Link>

      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Registrar Resultados</h1>
            <p className="mt-2">{quiniela.NOMBRE}</p>
          </div>
          <Trophy className="h-12 w-12 opacity-50" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📋 Partidos Pendientes</h2>
          <span className="text-sm text-gray-500">{partidos.length} partidos sin resultado</span>
        </div>

        {partidos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">¡No hay partidos pendientes!</p>
            <p className="text-gray-400">Todos los partidos ya tienen resultado registrado.</p>
          </div>
        )}

        {partidos.map((partido) => (
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
                <p className="text-xs text-gray-400 mt-1">
                  {partido.GRUPO_NOMBRE && `Grupo ${partido.GRUPO_NOMBRE}`}
                  {partido.FASE_NOMBRE && ` - ${partido.FASE_NOMBRE}`}
                </p>
              </div>
              <span className="flex items-center text-yellow-600 text-sm bg-yellow-50 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4 mr-1" />
                Pendiente
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-6">
              <div className="text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {partido.EQUIPO_1_NOMBRE}
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={partido.GOLES_LOCAL ?? ''}
                  onChange={(e) => handleGolesChange(partido.NRO_PARTIDO, 'GOLES_LOCAL', e.target.value)}
                  className="w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                  value={partido.GOLES_VISITANTE ?? ''}
                  onChange={(e) => handleGolesChange(partido.NRO_PARTIDO, 'GOLES_VISITANTE', e.target.value)}
                  className="w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="?"
                />
              </div>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => enviarResultado(partido)}
                disabled={enviando[partido.NRO_PARTIDO]}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                {enviando[partido.NRO_PARTIDO] ? 'Registrando y calculando puntos...' : 'Registrar Resultado'}
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Al registrar el resultado, se calcularán automáticamente los puntos de todos los usuarios
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultadosPage;