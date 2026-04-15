// src/pages/PronosticosQuinielaPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Trophy, CheckCircle, XCircle, Clock, Save } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PronosticosQuinielaPage = () => {
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
      // Cargar las quinielas del usuario para obtener los datos de la actual
      const quinielasRes = await api.post('/api/quinielas/mis-quinielas');
      const quinielaEncontrada = quinielasRes.data.data?.find(q => q.ID_QUINIELA === parseInt(id));
      setQuiniela(quinielaEncontrada);

      // Cargar partidos con predicciones
      const partidosRes = await api.post(`/api/quinielas/${id}/partidos-con-predicciones`);
      setPartidos(partidosRes.data.data || []);
    } catch (error) {
      toast.error('Error al cargar los datos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrediccionChange = (partidoId, campo, valor) => {
    setPartidos(prev => prev.map(p => 
      p.NRO_PARTIDO === partidoId ? { ...p, [campo]: parseInt(valor) || 0 } : p
    ));
  };

  const enviarPrediccion = async (partido) => {
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
      
      // Recargar datos para actualizar el estado
      await cargarDatos();
    } catch (error) {
      const mensaje = error.response?.data?.message || error.response?.data?.mensaje || 'Error al guardar predicción';
      toast.error(mensaje);
    } finally {
      setEnviando(prev => ({ ...prev, [partido.NRO_PARTIDO]: false }));
    }
  };

  const getEstadoBadge = (partido) => {
    if (partido.GOLES_REALES_LOCAL !== null && partido.GOLES_REALES_VISITANTE !== null) {
      return (
        <span className="flex items-center text-green-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4 mr-1" />
          Finalizado {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
        </span>
      );
    }
    if (partido.YA_PREDICHO) {
      return (
        <span className="flex items-center text-blue-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4 mr-1" />
          Predicción enviada: {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
        </span>
      );
    }
    if (partido.PUEDE_PREDECIR === 0) {
      return (
        <span className="flex items-center text-red-600 text-sm font-medium">
          <XCircle className="h-4 w-4 mr-1" />
          No disponible
        </span>
      );
    }
    return (
      <span className="flex items-center text-yellow-600 text-sm font-medium">
        <Clock className="h-4 w-4 mr-1" />
        Pendiente
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
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold mb-4">📋 Partidos - Realiza tus pronósticos</h2>
        
        {partidos.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No hay partidos disponibles para esta quiniela</p>
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
              // Partido finalizado - mostrar resultado
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
              // Partido pendiente - mostrar formulario de predicción
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
                      disabled={partido.YA_PREDICHO || partido.PUEDE_PREDECIR === 0}
                      className="w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
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
                      disabled={partido.YA_PREDICHO || partido.PUEDE_PREDECIR === 0}
                      className="w-24 text-center text-2xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                      placeholder="?"
                    />
                  </div>
                </div>

                <div className="mt-4 text-center">
                  {partido.PUEDE_PREDECIR === 0 && !partido.YA_PREDICHO && (
                    <p className="text-red-500 text-sm mb-2">
                      ⚠️ No puedes predecir este partido (la fecha ya pasó o el partido está en curso)
                    </p>
                  )}
                  <button
                    onClick={() => enviarPrediccion(partido)}
                    disabled={partido.YA_PREDICHO || partido.PUEDE_PREDECIR === 0 || enviando[partido.NRO_PARTIDO]}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4" />
                    {enviando[partido.NRO_PARTIDO] ? 'Guardando...' : (partido.YA_PREDICHO ? 'Predicción Guardada' : 'Guardar Predicción')}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PronosticosQuinielaPage;