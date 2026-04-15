import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Medal, ArrowLeft, TrendingUp } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const RankingPage = () => {
  const { id } = useParams();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quinielaNombre, setQuinielaNombre] = useState('');

  useEffect(() => {
    cargarRanking();
  }, [id]);

  const cargarRanking = async () => {
    try {
      const response = await api.get(`/api/quinielas/${id}/ranking`);
      console.log('Ranking recibido:', response.data.data);
      setRanking(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setQuinielaNombre(response.data.data[0].NOMBRE_QUINIELA);
      }
    } catch (error) {
      toast.error('Error al cargar ranking');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (posicion) => {
    if (posicion === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (posicion === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (posicion === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando ranking...</div>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ranking</h1>
            <p className="mt-2 text-indigo-100">{quinielaNombre || `Quiniela #${id}`}</p>
          </div>
          <TrendingUp className="h-12 w-12 opacity-30" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posición</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puntos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aciertos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Predicciones</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exactos</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ranking.map((item, index) => (
                <tr key={index} className={index < 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getMedalIcon(index + 1)}
                      <span className="ml-2 font-medium">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.U_NOMBRE} {item.U_APELLIDO}
                    </div>
                    <div className="text-xs text-gray-500">{item.U_CODIGO}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-indigo-600">
                      {item.PUNTOS_TOTALES || 0} pts
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600 font-semibold">
                      {item.TOTAL_ACIERTOS || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {item.TOTAL_PREDICCIONES || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-blue-600">
                      {item.ACIERTOS_EXACTOS || 0}
                    </div>
                   </td>
                </tr>
              ))}
            </tbody>
           </table>
        </div>

        {ranking.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay datos de ranking disponibles
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingPage;