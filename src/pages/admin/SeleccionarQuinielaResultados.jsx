import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ArrowRight, Calendar, CheckCircle, ArrowLeft } from 'lucide-react';  // ← Agregar ArrowLeft
import api from '../../services/api';
import toast from 'react-hot-toast';

const SeleccionarQuinielaResultados = () => {
  const [quinielas, setQuinielas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarQuinielas();
  }, []);

  const cargarQuinielas = async () => {
    try {
      const response = await api.post('/api/quinielas/mis-quinielas');
      setQuinielas(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar quinielas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando quinielas...</div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver al Panel
      </Link>

      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 text-white mb-8">
        <div className="flex items-center">
          <CheckCircle className="h-12 w-12 mr-4" />
          <div>
            <h1 className="text-2xl font-bold">Registrar Resultados</h1>
            <p className="mt-2">Selecciona una quiniela para ingresar los resultados de los partidos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quinielas.map((quiniela) => (
          <Link
            key={quiniela.ID_QUINIELA}
            to={`/admin/quinielas/${quiniela.ID_QUINIELA}/resultados`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition group"
          >
            <div className="flex items-center justify-between mb-4">
              <Trophy className="h-8 w-8 text-green-600" />
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{quiniela.NOMBRE}</h3>
            <p className="text-gray-500 text-sm mb-2 line-clamp-2">
              {quiniela.DESCRIPCION || 'Sin descripción'}
            </p>
            <div className="flex items-center text-xs text-gray-400 mt-2">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                {new Date(quiniela.FECHA_INICIO).toLocaleDateString()} - {new Date(quiniela.FECHA_FIN).toLocaleDateString()}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {quinielas.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No hay quinielas disponibles</p>
          <Link to="/admin" className="text-indigo-600 hover:underline mt-4 inline-block">
            Volver al Panel
          </Link>
        </div>
      )}
    </div>
  );
};

export default SeleccionarQuinielaResultados;