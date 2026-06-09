// src/pages/PronosticosUsuarioPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, ArrowLeft, Trophy, User, Award } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PronosticosUsuarioPage = () => {
  const { quinielaId, usuarioCodigo } = useParams();
  const [loading, setLoading] = useState(true);
  const [partidos, setPartidos] = useState([]);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [quinielaInfo, setQuinielaInfo] = useState(null);

  useEffect(() => {
    cargarPronosticosUsuario();
  }, [quinielaId, usuarioCodigo]);

  const cargarPronosticosUsuario = async () => {
    try {
      setLoading(true);
      
      // Cargar los pronósticos del usuario en esta quiniela
      const response = await api.post(`/api/quinielas/${quinielaId}/pronosticos-usuario`, {
        usuario_codigo: usuarioCodigo
      });
      
      const data = response.data.data;
      
      if (data.partidos) {
        setPartidos(data.partidos);
      }
      
      if (data.usuario) {
        setUsuarioInfo(data.usuario);
      }
      
      if (data.quiniela) {
        setQuinielaInfo(data.quiniela);
      }
      
    } catch (error) {
      console.error('Error cargando pronósticos:', error);
      toast.error('Error al cargar los pronósticos del usuario');
    } finally {
      setLoading(false);
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
          Pronóstico realizado
        </span>
      );
    }
    return (
      <span className="flex items-center text-yellow-600 text-sm font-medium">
        <Clock className="h-4 w-4 mr-1" />
          Sin pronóstico
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Botón volver al ranking */}
      <Link 
        to={`/quinielas/${quinielaId}/ranking`} 
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver al Ranking
      </Link>

      {/* Header del usuario */}
      {usuarioInfo && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-full p-4">
              <User className="h-12 w-12" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {usuarioInfo.U_NOMBRE} {usuarioInfo.U_APELLIDO}
              </h1>
              <p className="text-indigo-100">Código: {usuarioInfo.U_CODIGO}</p>
              {quinielaInfo && (
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-4 w-4" />
                    Puntos totales: {usuarioInfo.PUNTOS_TOTALES || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    Aciertos: {usuarioInfo.TOTAL_ACIERTOS || 0}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Título de la quiniela */}
      {quinielaInfo && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Quiniela: {quinielaInfo.NOMBRE}
          </h2>
          <p className="text-gray-500 text-sm">
            {new Date(quinielaInfo.FECHA_INICIO).toLocaleDateString()} - {new Date(quinielaInfo.FECHA_FIN).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Lista de pronósticos */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          📋 Pronósticos realizados
        </h3>

        {partidos.filter(p => p.YA_PREDICHO === 1).length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Este usuario no ha realizado pronósticos en esta quiniela</p>
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
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Resultado final</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {partido.GOLES_REALES_LOCAL} - {partido.GOLES_REALES_VISITANTE}
                  </p>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Pronóstico: {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                    </p>
                    {partido.PUNTOS_OBTENIDOS > 0 ? (
                      <p className="text-green-600 font-medium">
                        ✅ Obtuvo {partido.PUNTOS_OBTENIDOS} puntos
                      </p>
                    ) : (
                      <p className="text-red-500 font-medium">❌ No obtuvo puntos</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-600">Pronóstico realizado</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Esperando resultado del partido</p>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default PronosticosUsuarioPage;