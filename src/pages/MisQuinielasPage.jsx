// src/pages/MisQuinielasPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, ChevronRight, Award, TrendingUp, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MisQuinielasPage = () => {
  const [quinielas, setQuinielas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarMisQuinielas();
  }, []);

  const cargarMisQuinielas = async () => {
    try {
      const response = await api.post('/api/quinielas/mis-quinielas');
      setQuinielas(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar tus quinielas');
      console.error(error);
    } finally {
      setLoading(false);
    }
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
        <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No estás inscrito en ninguna quiniela</h2>
        <p className="text-gray-500">Contacta al administrador para que te inscriba en una quiniela activa.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mis Quinielas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quinielas.map((quiniela) => (
          <div key={quiniela.ID_QUINIELA} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">{quiniela.NOMBRE}</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4 line-clamp-2">
                {quiniela.DESCRIPCION || 'Sin descripción'}
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-500">
                  <Trophy className="h-4 w-4 mr-2 text-indigo-600" />
                  <span>Campeonato: {quiniela.C_CAMPEONATO}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                  <span>
                    Del {new Date(quiniela.FECHA_INICIO).toLocaleDateString()} 
                    al {new Date(quiniela.FECHA_FIN).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Award className="h-4 w-4 mr-2 text-yellow-500" />
                  <span className="font-semibold text-indigo-600">
                    Tus puntos: {quiniela.PUNTOS_TOTALES || 0}
                  </span>
                </div>
                {/* ✅ NUEVO: Mostrar aciertos */}
                <div className="flex items-center text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span className="font-semibold text-green-600">
                    Tus aciertos: {quiniela.TOTAL_ACIERTOS || 0}
                  </span>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-3">
                <Link
                  to={`/quinielas/${quiniela.ID_QUINIELA}/pronosticos`}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center justify-between"
                >
                  <span>Hacer Pronósticos</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
                
                <Link
                  to={`/ranking/${quiniela.ID_QUINIELA}`}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Ranking</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MisQuinielasPage;