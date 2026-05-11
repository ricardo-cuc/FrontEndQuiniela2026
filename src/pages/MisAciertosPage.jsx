// src/pages/MisAciertosPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, Trophy, ArrowLeft, Star, TrendingUp, Award } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MisAciertosPage = () => {
  const [quinielas, setQuinielas] = useState([]);
  const [quinielaSeleccionada, setQuinielaSeleccionada] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoPartidos, setCargandoPartidos] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [estadisticas, setEstadisticas] = useState({
    totalAciertos: 0,
    puntosTotales: 0,
    aciertosExactos: 0,
    aciertosResultado: 0
  });

  useEffect(() => {
    cargarMisQuinielas();
  }, []);

  const cargarMisQuinielas = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/quinielas/mis-quinielas');
      
      const data = response.data.data;
      let quinielasArray = [];
      
      if (Array.isArray(data)) {
        quinielasArray = data;
      } else if (data && data.quinielas && Array.isArray(data.quinielas)) {
        quinielasArray = data.quinielas;
        setUserInfo({
          nombre: data.NOMBRE_COMPLETO,
          codigo: data.U_CODIGO
        });
      }
      
      setQuinielas(quinielasArray);
      
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
      
      let partidosData = [];
      if (response.data?.data) {
        if (response.data.data.partidos) {
          partidosData = response.data.data.partidos;
        } else if (Array.isArray(response.data.data)) {
          partidosData = response.data.data;
        }
      }
      
      setPartidos(partidosData);
      
      // Calcular estadísticas de aciertos
      const aciertos = partidosData.filter(p => p.YA_PREDICHO === 1 && p.PUNTOS_OBTENIDOS > 0);
      const aciertosExactos = partidosData.filter(p => p.PUNTOS_OBTENIDOS === 5);
      const aciertosResultado = partidosData.filter(p => p.PUNTOS_OBTENIDOS === 3);
      
      setEstadisticas({
        totalAciertos: aciertos.length,
        puntosTotales: partidosData.reduce((sum, p) => sum + (p.PUNTOS_OBTENIDOS || 0), 0),
        aciertosExactos: aciertosExactos.length,
        aciertosResultado: aciertosResultado.length
      });
      
    } catch (error) {
      console.error('❌ Error cargando partidos:', error);
      toast.error('Error al cargar los aciertos');
    } finally {
      setCargandoPartidos(false);
    }
  };

  // Obtener solo los partidos donde hubo acierto (puntos > 0)
  const aciertos = partidos.filter(p => p.YA_PREDICHO === 1 && p.PUNTOS_OBTENIDOS > 0);

  // Ordenar aciertos: primero los más recientes o por puntos
  const aciertosOrdenados = [...aciertos].sort((a, b) => {
    // Primero los partidos finalizados
    if (a.GOLES_REALES_LOCAL !== null && b.GOLES_REALES_LOCAL === null) return -1;
    if (a.GOLES_REALES_LOCAL === null && b.GOLES_REALES_LOCAL !== null) return 1;
    // Luego por puntos (mayor primero)
    return (b.PUNTOS_OBTENIDOS || 0) - (a.PUNTOS_OBTENIDOS || 0);
  });

  const getPuntosBadge = (puntos) => {
    if (puntos === 5) {
      return (
        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
          <Star className="h-3 w-3" />
          ¡Acierto exacto! +{puntos} pts
        </span>
      );
    }
    if (puntos === 3) {
      return (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
          <CheckCircle className="h-3 w-3" />
          Acierto resultado +{puntos} pts
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando aciertos...</div>
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

      <h1 className="text-2xl font-bold mb-2">🏆 Mis Aciertos</h1>
      {userInfo.nombre && (
        <p className="text-gray-500 mb-6">¡Felicidades, {userInfo.nombre}! Sigue así.</p>
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
          </div>
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      {aciertos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Award className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{estadisticas.totalAciertos}</p>
            <p className="text-sm text-gray-500">Total Aciertos</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Trophy className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-indigo-600">{estadisticas.puntosTotales}</p>
            <p className="text-sm text-gray-500">Puntos Totales</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{estadisticas.aciertosExactos}</p>
            <p className="text-sm text-gray-500">Aciertos Exactos (5 pts)</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{estadisticas.aciertosResultado}</p>
            <p className="text-sm text-gray-500">Aciertos Resultado (3 pts)</p>
          </div>
        </div>
      )}

      {cargandoPartidos ? (
        <div className="text-center py-8">
          <div className="text-gray-500">Cargando tus aciertos...</div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">⭐ Partidos que acertaste</h2>
          
          {aciertos.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Aún no tienes aciertos</h3>
              <p className="text-gray-500 mb-4">
                Sigue participando y haciendo tus predicciones. ¡Tus aciertos aparecerán aquí!
              </p>
              {/* <Link 
                to={`/quinielas/${quinielaSeleccionada?.ID_QUINIELA}/pronosticos`}
                className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
              >
                Hacer predicciones ahora
              </Link> */}
            </div>
          )}

          {aciertosOrdenados.map((partido) => (
            <div key={partido.NRO_PARTIDO} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {partido.EQUIPO_1_NOMBRE} vs {partido.EQUIPO_2_NOMBRE}
                    </h3>
                    {getPuntosBadge(partido.PUNTOS_OBTENIDOS)}
                  </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="text-center bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Resultado real</p>
                  <p className="text-3xl font-bold text-green-600">
                    {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
                  </p>
                </div>
                <div className="text-center bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Tu predicción</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                  </p>
                </div>
              </div>

              <div className="text-center mt-2">
                <span className="inline-flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  ¡Acertaste! Obtuviste {partido.PUNTOS_OBTENIDOS} puntos
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisAciertosPage;