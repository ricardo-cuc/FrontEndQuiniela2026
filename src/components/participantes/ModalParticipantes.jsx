// components/participantes/ModalParticipantes.jsx
import React, { useState, useEffect } from 'react';
import { X, Users, Smile, Send } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const emojisDisponibles = [
  { id: '👍', emoji: '👍', nombre: 'Like' },
  { id: '❤️', emoji: '❤️', nombre: 'Corazón' },
  { id: '😂', emoji: '😂', nombre: 'Risa' },
  { id: '🎉', emoji: '🎉', nombre: 'Fiesta' },
  { id: '⚽', emoji: '⚽', nombre: 'Gol' },
  { id: '🏆', emoji: '🏆', nombre: 'Trofeo' },
  { id: '🤝', emoji: '🤝', nombre: 'Saludo' },
  { id: '💪', emoji: '💪', nombre: 'Fuerza' },
];

export const ModalParticipantes = ({ isOpen, onClose, quinielaId, quinielaNombre }) => {
  const [participantes, setParticipantes] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [showEmojis, setShowEmojis] = useState(null);

  // Cargar datos al abrir el modal
  useEffect(() => {
    if (isOpen && quinielaId) {
      cargarDatos();
    }
  }, [isOpen, quinielaId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar participantes
      const participantesRes = await api.get(`/api/quinielas/${quinielaId}/participantes`);
      setParticipantes(participantesRes.data.data || []);
      
      // Cargar mensajes
      const mensajesRes = await api.get(`/api/quinielas/${quinielaId}/mensajes`);
      setMensajes(mensajesRes.data.data || []);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;
    
    setEnviando(true);
    try {
      const response = await api.post(`/api/quinielas/${quinielaId}/mensajes`, {
        mensaje: nuevoMensaje,
        tipo: 'texto'
      });
      
      // Agregar mensaje a la lista
      setMensajes(prev => [response.data.data, ...prev]);
      setNuevoMensaje('');
      toast.success('Mensaje enviado');
      
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast.error(error.response?.data?.message || 'Error al enviar mensaje');
    } finally {
      setEnviando(false);
    }
  };

  const enviarReaccion = async (receptorId, emoji) => {
    try {
      await api.post(`/api/quinielas/${quinielaId}/reacciones`, {
        usuario_id: receptorId,
        emoji: emoji.emoji
      });
      
      toast.success(`Reacción ${emoji.emoji} enviada`);
      setShowEmojis(null);
      
    } catch (error) {
      console.error('Error enviando reacción:', error);
      toast.error(error.response?.data?.message || 'Error al enviar reacción');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div>
            <h2 className="text-xl font-bold">Participantes</h2>
            <p className="text-sm text-indigo-200">{quinielaNombre}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex flex-1 overflow-hidden">
          {/* Lista de participantes */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700">
                Participantes ({participantes.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : participantes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay participantes</div>
              ) : (
                participantes.map((p) => (
                  <div key={p.U_CODIGO} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {p.U_NOMBRE?.charAt(0)}{p.U_APELLIDO?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {p.U_NOMBRE} {p.U_APELLIDO}
                          </p>
                          <p className="text-xs text-gray-400">{p.U_CORREO}</p>
                          {p.puntuacion_total > 0 && (
                            <p className="text-xs text-yellow-600">⭐ {p.puntuacion_total} pts</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Botón de emojis */}
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojis(showEmojis === p.U_CODIGO ? null : p.U_CODIGO)}
                          className="p-2 rounded-full hover:bg-gray-100 transition"
                        >
                          <Smile className="h-5 w-5 text-gray-400 hover:text-yellow-500" />
                        </button>
                        
                        {showEmojis === p.U_CODIGO && (
                          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-10 w-64">
                            <div className="grid grid-cols-4 gap-1">
                              {emojisDisponibles.map((emoji) => (
                                <button
                                  key={emoji.id}
                                  onClick={() => enviarReaccion(p.U_CODIGO, emoji)}
                                  className="p-2 rounded-lg text-2xl hover:bg-gray-100 transition hover:scale-110"
                                  title={emoji.nombre}
                                >
                                  {emoji.emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700">💬 Chat en vivo</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
              {mensajes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No hay mensajes aún. ¡Sé el primero en saludar!
                </div>
              ) : (
                mensajes.map((msg) => (
                  <div key={msg.ID_MENSAJE} className="bg-gray-100 rounded-xl px-4 py-2">
                    <p className="text-xs font-semibold text-indigo-600">
                      {msg.U_NOMBRE} {msg.U_APELLIDO}
                    </p>
                    <p className="text-sm text-gray-700">{msg.MENSAJE}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.FECHA_CREACION).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Input de mensaje */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={enviarMensaje}
                  disabled={!nuevoMensaje.trim() || enviando}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                💡 Sé respetuoso. Los mensajes son visibles para todos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};