// src/pages/PronosticosUsuarioPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, CheckCircle, Clock, ArrowLeft, Trophy, User, Award, Target, AlertCircle, Lock, EyeOff } from 'lucide-react';
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
    // Verificar si el partido está finalizado
    const isFinalizado = partido.ESTADO_PARTIDO === 'FINALIZADO' || 
                         (partido.GOLES_REALES_LOCAL !== null && partido.GOLES_REALES_LOCAL !== undefined);
    
    if (isFinalizado) {
      return (
        <span className="flex items-center text-green-600 text-sm font-medium">
          <CheckCircle className="h-4 w-4 mr-1" />
          Finalizado
        </span>
      );
    }
    if (partido.YA_PREDICHO === 1) {
      return (
        <span className="flex items-center text-blue-600 text-sm font-medium">
          <Clock className="h-4 w-4 mr-1" />
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

  const getResultadoDisplay = (partido) => {
    const isFinalizado = partido.ESTADO_PARTIDO === 'FINALIZADO' || 
                         (partido.GOLES_REALES_LOCAL !== null && partido.GOLES_REALES_LOCAL !== undefined);
    
    if (!isFinalizado) {
      return {
        show: false,
        message: '🔒 Resultado oculto hasta que finalice el partido',
        icon: <Lock className="h-5 w-5 text-gray-400" />
      };
    }
    
    return {
      show: true,
      local: partido.GOLES_REALES_LOCAL,
      visitante: partido.GOLES_REALES_VISITANTE
    };
  };

  const getResultadoText = (partido) => {
    const resultado = getResultadoDisplay(partido);
    
    if (!resultado.show) {
      return (
        <div className="text-center py-2">
          <span className="flex items-center justify-center gap-2 text-gray-500">
            {resultado.icon}
            {resultado.message}
          </span>
        </div>
      );
    }
    
    if (resultado.local === partido.GOLES_LOCAL_PRED && 
        resultado.visitante === partido.GOLES_VISITANTE_PRED) {
      return <span className="text-green-600 font-medium">✅ Resultado exacto!</span>;
    }
    
    const difLocal = Math.abs(resultado.local - partido.GOLES_LOCAL_PRED);
    const difVisit = Math.abs(resultado.visitante - partido.GOLES_VISITANTE_PRED);
    
    if (difLocal === difVisit && difLocal === 0) {
      return <span className="text-yellow-600 font-medium">🎯 Diferencia de goles acertada</span>;
    }
    
    return <span className="text-red-500 font-medium">❌ No acertó</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const pronosticosRealizados = partidos.filter(p => p.YA_PREDICHO === 1).length;
  const totalPartidos = partidos.length;

  return (
    <div>
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
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {usuarioInfo.U_NOMBRE} {usuarioInfo.U_APELLIDO}
              </h1>
              <p className="text-indigo-100">Código: {usuarioInfo.U_CODIGO}</p>
              {quinielaInfo && (
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <Trophy className="h-4 w-4" />
                    Puntos: {usuarioInfo.PUNTOS_TOTALES || 0}
                  </span>
                  <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <Award className="h-4 w-4" />
                    Aciertos: {usuarioInfo.TOTAL_ACIERTOS || 0}
                  </span>
                  <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                    <Target className="h-4 w-4" />
                    Pronósticos: {pronosticosRealizados}/{totalPartidos}
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            📋 Pronósticos realizados
          </h3>
          <span className="text-sm text-gray-500">
            {pronosticosRealizados} de {totalPartidos} partidos
          </span>
        </div>

        {pronosticosRealizados === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Este usuario no ha realizado pronósticos en esta quiniela</p>
          </div>
        )}

        {partidos
          .filter(partido => partido.YA_PREDICHO === 1)
          .map((partido) => {
            const resultado = getResultadoDisplay(partido);
            const isFinalizado = resultado.show;
            
            return (
              <div key={partido.NRO_PARTIDO} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
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

                {isFinalizado ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Resultado final</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          {resultado.local} - {resultado.visitante}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Pronóstico</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Resultado</p>
                        {getResultadoText(partido)}
                        {partido.PUNTOS_OBTENIDOS > 0 && (
                          <p className="text-sm text-green-600 mt-1">
                            +{partido.PUNTOS_OBTENIDOS} puntos
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-600">Pronóstico realizado</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {partido.GOLES_LOCAL_PRED} - {partido.GOLES_VISITANTE_PRED}
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-amber-600 bg-amber-50 py-2 px-4 rounded-lg inline-flex mx-auto">
                      <Lock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Resultado oculto hasta que finalice el partido
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default PronosticosUsuarioPage;