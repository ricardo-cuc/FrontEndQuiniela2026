// src/pages/HomePage.jsx (versión actualizada con datos reales)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Users, Calendar, Award } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    quinielasActivas: 0,
    partidos: 0,
    participantes: 0,
    miPuntuacion: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      // 1. Obtener quinielas activas
      const quinielasRes = await api.get('/api/quinielas');
      const quinielas = quinielasRes.data.data || [];
      const activas = quinielas.filter(q => q.ESTADO === 'ACTIVA').length;

      // 2. Obtener partidos
      const partidosRes = await api.get('/api/partidos');
      const partidos = partidosRes.data.data || [];

      // 3. Obtener participantes (de la primera quiniela activa)
      let participantes = 0;
      if (activas > 0) {
        const primeraQuiniela = quinielas.find(q => q.ESTADO === 'ACTIVA');
        if (primeraQuiniela) {
          const participantesRes = await api.get(`/api/quinielas/${primeraQuiniela.ID_QUINIELA}/participantes/count`);
          participantes = participantesRes.data.data?.total_participantes || 0;
        }
      }

      // 4. Obtener puntuación del usuario
      let miPuntuacion = 0;
      try {
        const puntuacionRes = await api.get('/api/usuarios/mi-puntuacion');
        miPuntuacion = puntuacionRes.data.data?.puntos_totales || 0;
      } catch (e) {
        console.log('No se pudo obtener puntuación');
      }

      setStats({
        quinielasActivas: activas,
        partidos: partidos.length,
        participantes: participantes,
        miPuntuacion: miPuntuacion
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
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
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-4">
          ¡Bienvenido, {user?.U_NOMBRE}! 👋
        </h1>
        <p className="text-lg">
          Participa en nuestras quinielas, predice los resultados y gana puntos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <Trophy className="h-8 w-8 text-indigo-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-700">Quinielas Activas</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.quinielasActivas}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <Calendar className="h-8 w-8 text-indigo-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-700">Partidos</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.partidos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <Users className="h-8 w-8 text-indigo-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-700">Participantes</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.participantes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <Award className="h-8 w-8 text-indigo-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-700">Mi Puntuación</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.miPuntuacion} pts</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;