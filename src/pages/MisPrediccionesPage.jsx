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
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    cargarMisQuinielas();
  }, []);

  const cargarMisQuinielas = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/quinielas/mis-quinielas');
      
      console.log('📦 Respuesta completa:', response.data);
      
      const data = response.data.data;
      
      // 🔥 CORREGIDO: Extraer correctamente las quinielas
      let quinielasArray = [];
      
      if (Array.isArray(data)) {
        // Estructura antigua: array directo
        quinielasArray = data;
      } else if (data && data.quinielas && Array.isArray(data.quinielas)) {
        // Estructura nueva: objeto con quinielas
        quinielasArray = data.quinielas;
        setUserInfo({
          nombre: data.NOMBRE_COMPLETO,
          codigo: data.U_CODIGO
        });
      } else if (data && Array.isArray(data.data)) {
        quinielasArray = data.data;
      } else {
        quinielasArray = [];
      }
      
      setQuinielas(quinielasArray);
      
      // Si hay quinielas, seleccionar la primera automáticamente
      if (quinielasArray.length > 0) {
        await seleccionarQuiniela(quinielasArray[0].ID_QUINIELA);
      }
    } catch (error) {
      console.error('❌ Error:', error);
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
      
      const response = await api.post(`/api/quinielas/${idQuiniela}/partidos-con-predicciones`);
      
      console.log('📦 Partidos respuesta:', response.data);
      
      // 🔥 CORREGIDO: Extraer partidos de la respuesta
      let partidosData = [];
      if (response.data?.data) {
        if (response.data.data.partidos) {
          partidosData = response.data.data.partidos;
        } else if (Array.isArray(response.data.data)) {
          partidosData = response.data.data;
        } else {
          partidosData = [];
        }
      }
      
      setPartidos(partidosData);
      
    } catch (error) {
      console.error('❌ Error cargando partidos:', error);
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

      <h1 className="text-2xl font-bold mb-2">Mis Predicciones</h1>
      {userInfo.nombre && (
        <p className="text-gray-500 mb-6">Bienvenido, {userInfo.nombre}</p>
      )}

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

          {/* 🔥 MOSTRAR SOLO PARTIDOS DONDE YA_PREDICHO === 1 */}
          {partidos.filter(p => p.YA_PREDICHO === 1).length === 0 && (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-gray-500">No has realizado predicciones en esta quiniela</p>
              <Link 
                to={`/quinielas/${quinielaSeleccionada?.ID_QUINIELA}/pronosticos`}
                className="inline-block mt-4 bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
              >
                Hacer predicciones ahora
              </Link>
            </div>
          )}

          {partidos
            .filter(partido => partido.YA_PREDICHO === 1)
            .map((partido) => (
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
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">Tu predicción: {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}</p>
                      {partido.PUNTOS_OBTENIDOS > 0 ? (
                        <p className="text-green-600 font-medium">✅ Obtuviste {partido.PUNTOS_OBTENIDOS} puntos</p>
                      ) : (
                        <p className="text-red-500 font-medium">❌ No obtuviste puntos</p>
                      )}
                    </div>
                  </div>
                ) : (
                  // Partido pendiente con predicción
                  <div className="text-center py-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-600">Tu predicción</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Esperando resultado del partido</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default MisPrediccionesPage;