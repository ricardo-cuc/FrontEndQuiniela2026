// src/pages/MisQuinielasPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Calendar, Users, ChevronRight, Award, TrendingUp, CheckCircle, Lock, Bell, Wifi, WifiOff, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';

const MisQuinielasPage = () => {
  const [quinielas, setQuinielas] = useState([]);
  const [userInfo, setUserInfo] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Socket.IO para tiempo real
  const { isConnected, lastMessage } = useSocket(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [puntosActualizados, setPuntosActualizados] = useState(false);

  // ✅ EFECTO PRINCIPAL: Cargar datos al montar el componente
  useEffect(() => {
    cargarMisQuinielas();
  }, []);

  // Efecto para escuchar mensajes en tiempo real
  useEffect(() => {
    if (lastMessage) {
      let message = '';
      switch (lastMessage.type) {
        case 'RESULTADO_ACTUALIZADO':
          message = `⚽ Resultado actualizado en ${lastMessage.partido?.EQUIPO_1_NOMBRE} vs ${lastMessage.partido?.EQUIPO_2_NOMBRE}`;
          cargarMisQuinielas();
          setPuntosActualizados(true);
          setTimeout(() => setPuntosActualizados(false), 3000);
          break;
        case 'RANKING_ACTUALIZADO':
          message = `🏆 Tus puntos pueden haber cambiado`;
          cargarMisQuinielas();
          setPuntosActualizados(true);
          setTimeout(() => setPuntosActualizados(false), 3000);
          break;
        case 'NUEVA_PREDICCION':
          message = `📝 Se realizó una nueva predicción en una de tus quinielas`;
          cargarMisQuinielas();
          break;
        default:
          message = 'Actualización en tus quinielas';
          cargarMisQuinielas();
      }
      
      setNotificationMessage(message);
      setShowNotification(true);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [lastMessage]);

  const cargarMisQuinielas = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/api/quinielas/mis-quinielas');
      
      console.log('📦 Respuesta:', response.data);
      
      const data = response.data.data;
      
      if (data) {
        setUserInfo({
          U_CODIGO: data.U_CODIGO,
          NOMBRE_COMPLETO: data.NOMBRE_COMPLETO
        });
        
        setQuinielas(data.quinielas || []);
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Error al cargar tus quinielas');
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
      {/* Notificación en tiempo real */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white rounded-lg shadow-lg p-4 max-w-md flex items-center gap-3 animate-slide-up">
          <Bell className="h-5 w-5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{notificationMessage}</p>
            <p className="text-xs opacity-75">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
          <button onClick={() => setShowNotification(false)} className="text-white hover:text-gray-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Indicador de puntos actualizados */}
      {puntosActualizados && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white rounded-lg shadow-lg p-3 animate-slide-down">
          <TrendingUp className="h-5 w-5 inline mr-2" />
          ¡Tus puntos se han actualizado!
        </div>
      )}

      {/* Indicador de conexión Socket.IO */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-white rounded-full px-3 py-1 shadow-md">
        {isConnected ? (
          <>
            <Wifi className="h-3 w-3 text-green-500" />
            <span className="text-xs text-gray-500">Tiempo real</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3 text-red-500" />
            <span className="text-xs text-gray-500">Sin conexión</span>
          </>
        )}
      </div>

      {/* Saludo personalizado */}
      {userInfo.NOMBRE_COMPLETO && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Mis Quinielas</h1>
          <p className="text-gray-500">
            Bienvenido, {userInfo.NOMBRE_COMPLETO}
            {isConnected && <span className="ml-2 text-xs text-green-500">● Tiempo real</span>}
          </p>
        </div>
      )}
      
      {!userInfo.NOMBRE_COMPLETO && (
        <h1 className="text-2xl font-bold mb-6">Mis Quinielas</h1>
      )}
      
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
                <div className="flex items-center text-sm text-gray-500">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  <span className="font-semibold text-green-600">
                    Tus aciertos: {quiniela.TOTAL_ACIERTOS || 0}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                  <span>
                    Predicciones: {quiniela.TOTAL_PREDICCIONES || 0}
                  </span>
                </div>
                {quiniela.PREDICCIONES_BLOQUEADAS && (
                  <div className="flex items-center text-sm text-red-500 mt-2">
                    <Lock className="h-4 w-4 mr-2" />
                    <span>Predicciones bloqueadas</span>
                  </div>
                )}
              </div>
              
              {/* Botones de acción */}
              <div className="flex gap-3">
                <Link
                  to={`/quinielas/${quiniela.ID_QUINIELA}/pronosticos`}
                  className={`flex-1 py-2 px-4 rounded-md transition flex items-center justify-between ${
                    quiniela.PREDICCIONES_BLOQUEADAS 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  onClick={(e) => {
                    if (quiniela.PREDICCIONES_BLOQUEADAS) {
                      e.preventDefault();
                      toast.error('Esta quiniela tiene las predicciones bloqueadas');
                    }
                  }}
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

      {/* Animaciones CSS */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        .animate-slide-down { animation: slideDown 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default MisQuinielasPage;