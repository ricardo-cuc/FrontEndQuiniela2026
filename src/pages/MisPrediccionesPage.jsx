import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, ArrowLeft, Trophy, Clock } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MisPrediccionesPage = () => {
  const [quinielas, setQuinielas] = useState([]);
  const [quinielaSeleccionada, setQuinielaSeleccionada] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoPartidos, setCargandoPartidos] = useState(false);

  useEffect(() => {
    cargarMisQuinielas();
  }, []);

  const cargarMisQuinielas = async () => {
    try {
      setLoading(true);
      // 🔥 Usar endpoint protegido para obtener quinielas del usuario
      const response = await api.post('/api/quinielas/mis-quinielas');
      const quinielasData = response.data.data || [];
      setQuinielas(quinielasData);
      
      // Si hay quinielas, seleccionar la primera automáticamente
      if (quinielasData.length > 0) {
        await seleccionarQuiniela(quinielasData[0].ID_QUINIELA);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar tus quinielas');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarQuiniela = async (idQuiniela) => {
    try {
      setCargandoPartidos(true);
      const quiniela = quinielas.find(q => q.ID_QUINIELA === idQuiniela);
      setQuinielaSeleccionada(quiniela);
      
      // 🔥 Usar endpoint protegido para obtener partidos con predicciones
      const response = await api.post(`/api/quinielas/${idQuiniela}/partidos-con-predicciones`);
      const partidosData = response.data.data || [];
      setPartidos(partidosData);
      
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar las predicciones');
    } finally {
      setCargandoPartidos(false);
    }
  };

  const getEstadoBadge = (partido) => {
    if (partido.GOLES_REALES_LOCAL !== null && partido.GOLES_REALES_VISITANTE !== null) {
      return (
        <span className="flex items-center text-green-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4 mr-1" />
          Finalizado
        </span>
      );
    }
    if (partido.YA_PREDICHO) {
      return (
        <span className="flex items-center text-blue-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4 mr-1" />
          Predicción enviada
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
        <div className="text-gray-500">Cargando tus quinielas...</div>
      </div>
    );
  }

  if (quinielas.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg shadow p-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No tienes quinielas activas</h2>
          <p className="text-gray-500 mb-4">Aún no estás inscrito en ninguna quiniela</p>
        </div>
      </div>
    );
  }

  return (
    <div>


      {/* Selector de quiniela */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Quiniela
        </label>
        <select
          value={quinielaSeleccionada?.ID_QUINIELA || ''}
          onChange={(e) => seleccionarQuiniela(Number(e.target.value))}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {quinielas.map((q) => (
            <option key={q.ID_QUINIELA} value={q.ID_QUINIELA}>
              {q.NOMBRE}
            </option>
          ))}
        </select>
      </div>

      {quinielaSeleccionada && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
          <h1 className="text-2xl font-bold">{quinielaSeleccionada.NOMBRE}</h1>
          <p className="mt-2">{quinielaSeleccionada.DESCRIPCION || 'Sin descripción'}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span>🏆 {quinielaSeleccionada.C_CAMPEONATO}</span>
            <span>📅 {new Date(quinielaSeleccionada.FECHA_INICIO).toLocaleDateString()} - {new Date(quinielaSeleccionada.FECHA_FIN).toLocaleDateString()}</span>
            <span>⭐ Tus puntos: {quinielaSeleccionada.PUNTOS_TOTALES || 0}</span>
          </div>
        </div>
      )}

      {cargandoPartidos ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Cargando tus predicciones...</div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">📋 Mis Predicciones</h2>
          
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
  ) : partido.YA_PREDICHO ? (
    // Partido pendiente con predicción
    <div className="text-center py-4 bg-blue-50 rounded-lg">
      <p className="text-gray-600">Tu predicción</p>
      <p className="text-2xl font-bold text-blue-600">
        {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
      </p>
      <p className="text-sm text-gray-500 mt-1">Esperando resultado del partido</p>
    </div>
  ) : null}
</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisPrediccionesPage;