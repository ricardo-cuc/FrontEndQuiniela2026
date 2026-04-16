// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Users, Calendar, Award, TrendingUp, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    misQuinielas: 0,
    misPredicciones: 0,
    participantes: 0,
    miPuntuacion: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // Obtener las quinielas donde el usuario está inscrito
      const misQuinielasRes = await api.post('/api/quinielas/mis-quinielas');
      const misQuinielas = misQuinielasRes.data.data || [];
      const totalMisQuinielas = misQuinielas.length;

      // Obtener total de predicciones del usuario
      let totalPredicciones = 0;
      for (const quiniela of misQuinielas) {
        totalPredicciones += quiniela.TOTAL_PREDICCIONES || 0;
      }

      // Obtener participantes totales
      let totalParticipantes = 0;
      for (const quiniela of misQuinielas) {
        try {
          const participantesRes = await api.get(`/api/quinielas/${quiniela.ID_QUINIELA}/participantes/count`);
          totalParticipantes += participantesRes.data.data?.total_participantes || 0;
        } catch (e) {
          console.log(`Error cargando participantes de quiniela ${quiniela.ID_QUINIELA}`);
        }
      }

      // Obtener puntuación total del usuario
      let miPuntuacion = 0;
      for (const quiniela of misQuinielas) {
        miPuntuacion += quiniela.PUNTOS_TOTALES || 0;
      }

      setStats({
        misQuinielas: totalMisQuinielas,
        misPredicciones: totalPredicciones,
        participantes: totalParticipantes,
        miPuntuacion: miPuntuacion
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleMisQuinielasClick = () => {
    navigate('/mis-quinielas');
  };

  const handleMisPrediccionesClick = () => {
    navigate('/mis-predicciones');
  };

  const handleRankingClick = () => {
    navigate('/mis-quinielas');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banner de bienvenida */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">
          ¡Bienvenido, {user?.U_NOMBRE}! 👋
        </h1>
        <p className="text-lg">
          Participa en nuestras quinielas, predice los resultados y gana puntos.
        </p>
      </div>

      {/* Estadísticas con navegación */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Tarjeta de Mis Quinielas */}
        <div
          onClick={handleMisQuinielasClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-indigo-50 group"
        >
          <Trophy className="h-8 w-8 text-indigo-600 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mis Quinielas</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.misQuinielas}</p>
          <p className="text-sm text-gray-400 mt-2">Activas donde participas</p>
        </div>

        {/* Tarjeta de Mis Predicciones - CLICKEABLE */}
        <div
          onClick={handleMisPrediccionesClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-blue-50 group"
        >
          <CheckCircle className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mis Predicciones</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.misPredicciones}</p>
          <p className="text-sm text-gray-400 mt-2">Realizadas</p>
        </div>

        {/* Tarjeta de Participantes */}
        <div className="bg-white rounded-lg shadow p-6">
          <Users className="h-8 w-8 text-indigo-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-700">Participantes</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.participantes}</p>
          <p className="text-sm text-gray-400 mt-2">En todas las quinielas</p>
        </div>

        {/* Tarjeta de Mi Puntuación */}
        <div
          onClick={handleRankingClick}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer hover:bg-green-50 group"
        >
          <Award className="h-8 w-8 text-yellow-500 mb-2 group-hover:scale-110 transition" />
          <h3 className="text-lg font-semibold text-gray-700">Mi Puntuación</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.miPuntuacion} pts</p>
          <p className="text-sm text-gray-400 mt-2">Ver ranking</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;