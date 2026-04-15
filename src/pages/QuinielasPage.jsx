import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const QuinielasPage = () => {
  const [quinielas, setQuinielas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarQuinielas();
  }, []);

  const cargarQuinielas = async () => {
    try {
      const response = await api.get('/api/quinielas');
      setQuinielas(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar quinielas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quinielas Disponibles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quinielas.map((quiniela) => (
          <div key={quiniela.ID_QUINIELA} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">{quiniela.NOMBRE}</h2>
            <p className="text-gray-600 mb-4">{quiniela.DESCRIPCION || 'Sin descripción'}</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Trophy className="h-4 w-4 mr-2" />
                <span>Campeonato: {quiniela.C_CAMPEONATO}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Del {new Date(quiniela.FECHA_INICIO).toLocaleDateString()} al {new Date(quiniela.FECHA_FIN).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="h-4 w-4 mr-2" />
                <span>Estado: {quiniela.ESTADO}</span>
              </div>
            </div>
            <Link
              to={`/quinielas/${quiniela.ID_QUINIELA}`}
              className="block text-center bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition"
            >
              Ver Detalles
            </Link>
          </div>
        ))}
      </div>
      {quinielas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No hay quinielas disponibles
        </div>
      )}
    </div>
  );
};

export default QuinielasPage;