import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MisPrediccionesPage = () => {
  const [predicciones, setPredicciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPredicciones();
  }, []);

  const cargarPredicciones = async () => {
    try {
      const response = await api.get('/api/predicciones/mias');
      setPredicciones(response.data.data || []);
    } catch (error) {
      toast.error('Error al cargar tus predicciones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando tus predicciones...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mis Predicciones</h1>
      
      <div className="space-y-4">
        {predicciones.map((pred, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Partido #{pred.NRO_PARTIDO}
                </h3>
                <p className="text-gray-600 mb-2">
                  {pred.EQUIPO_LOCAL} vs {pred.EQUIPO_VISITANTE}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{pred.FECHA_PARTIDO ? new Date(pred.FECHA_PARTIDO).toLocaleString() : 'Fecha por definir'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-indigo-100 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Tu predicción</p>
                  <p className="text-xl font-bold text-indigo-600">
                    {pred.GOLES_LOCAL_PRED} - {pred.GOLES_VISITANTE_PRED}
                  </p>
                </div>
              </div>
            </div>
            
            {pred.Q_GOLES_E1 !== null && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resultado real</p>
                    <p className="text-lg font-semibold">
                      {pred.Q_GOLES_E1} - {pred.Q_GOLES_E2}
                    </p>
                  </div>
                  <div className="flex items-center">
                    {pred.PUNTOS_OBTENIDOS > 0 ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-5 w-5 mr-1" />
                        <span className="font-bold">{pred.PUNTOS_OBTENIDOS} puntos</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <XCircle className="h-5 w-5 mr-1" />
                        <span>0 puntos</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {predicciones.length === 0 && (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No has realizado ninguna predicción aún</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisPrediccionesPage;