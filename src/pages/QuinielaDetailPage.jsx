import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Users, Calendar, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const QuinielaDetailPage = () => {
  const { id } = useParams();
  const [quiniela, setQuiniela] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDetalle();
  }, [id]);

  const cargarDetalle = async () => {
    try {
      // Como no hay endpoint específico, usamos el listado
      const response = await api.get('/api/quinielas');
      const encontrada = response.data.data?.find(q => q.ID_QUINIELA === parseInt(id));
      setQuiniela(encontrada);
    } catch (error) {
      toast.error('Error al cargar detalles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!quiniela) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Quiniela no encontrada</p>
        <Link to="/quinielas" className="text-indigo-600 hover:underline mt-4 inline-block">
          Volver a quinielas
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/quinielas" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver
      </Link>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">{quiniela.NOMBRE}</h1>
        <p className="text-gray-600 mb-6">{quiniela.DESCRIPCION || 'Sin descripción'}</p>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-gray-700">
            <Trophy className="h-5 w-5 mr-3 text-indigo-600" />
            <span><strong>Campeonato:</strong> {quiniela.C_CAMPEONATO}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Calendar className="h-5 w-5 mr-3 text-indigo-600" />
            <span><strong>Período:</strong> {new Date(quiniela.FECHA_INICIO).toLocaleDateString()} - {new Date(quiniela.FECHA_FIN).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Users className="h-5 w-5 mr-3 text-indigo-600" />
            <span><strong>Estado:</strong> {quiniela.ESTADO}</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Link
            to={`/ranking/${id}`}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition"
          >
            Ver Ranking
          </Link>
          <Link
            to="/mis-predicciones"
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition"
          >
            Mis Predicciones
          </Link>
        </div>
      </div>
    </div>
  );
};

export default QuinielaDetailPage;