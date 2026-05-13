// components/participantes/ModalParticipantes.jsx
import React, { useState, useEffect } from 'react';
import { X, Users, ChevronLeft, ChevronRight, Trophy, Star, Smile, ThumbsUp, Heart, Laugh, PartyPopper } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Emojis disponibles para reaccionar
const emojisDisponibles = [
  { id: '👍', emoji: '👍', nombre: 'Like', color: 'hover:bg-blue-100' },
  { id: '❤️', emoji: '❤️', nombre: 'Corazón', color: 'hover:bg-red-100' },
  { id: '😂', emoji: '😂', nombre: 'Risa', color: 'hover:bg-yellow-100' },
  { id: '🎉', emoji: '🎉', nombre: 'Fiesta', color: 'hover:bg-purple-100' },
  { id: '⚽', emoji: '⚽', nombre: 'Gol', color: 'hover:bg-green-100' },
  { id: '🏆', emoji: '🏆', nombre: 'Trofeo', color: 'hover:bg-amber-100' },
  { id: '🤝', emoji: '🤝', nombre: 'Saludo', color: 'hover:bg-indigo-100' },
  { id: '💪', emoji: '💪', nombre: 'Fuerza', color: 'hover:bg-orange-100' },
];

export const ModalParticipantes = ({ isOpen, onClose, quinielaId, quinielaNombre }) => {
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emisor, setEmisor] = useState(null);
  const [enviando, setEnviando] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [showEmojis, setShowEmojis] = useState(null);

  // Cargar participantes
  useEffect(() => {
    if (isOpen && quinielaId) {
      cargarParticipantes();
      cargarMensajes();
      // Obtener información del usuario actual
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      setEmisor(userData);
    }
  }, [isOpen, quinielaId]);

  const cargarParticipantes = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/quinielas/${quinielaId}/participantes`);
      setParticipantes(response.data.data || []);
    } catch (error) {
      console.error('Error cargando participantes:', error);
      toast.error('Error al cargar participantes');
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async () => {
    try {
      const response = await api.get(`/api/quinielas/${quinielaId}/mensajes`);
      setMensajes(response.data.data || []);
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;

    try {
      const response = await api.post(`/api/quinielas/${quinielaId}/mensajes`, {
        mensaje: nuevoMensaje,
        tipo: 'texto'
      });
      
      setMensajes(prev => [response.data.data, ...prev]);
      setNuevoMensaje('');
      toast.success('💬 Mensaje enviado');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast.error('Error al enviar mensaje');
    }
  };

  const enviarReaccion = async (participanteId, emoji) => {
    try {
      setEnviando(participanteId);
      await api.post(`/api/quinielas/${quinielaId}/reacciones`, {
        usuario_id: participanteId,
        emoji: emoji.emoji
      });
      
      toast.success(`Le enviaste ${emoji.emoji} a ${participantes.find(p => p.U_CODIGO === participanteId)?.U_NOMBRE}`);
      
      // Actualizar contador localmente
      setParticipantes(prev => prev.map(p => 
        p.U_CODIGO === participanteId 
          ? { ...p, reacciones: [...(p.reacciones || []), { emoji: emoji.emoji, de: emisor?.U_CODIGO }] }
          : p
      ));
    } catch (error) {
      console.error('Error enviando reacción:', error);
      toast.error('Error al enviar reacción');
    } finally {
      setEnviando(null);
      setShowEmojis(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Participantes</h2>
              <p className="text-sm text-indigo-200">{quinielaNombre}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido principal - Dos columnas */}
        <div className="flex flex-1 overflow-hidden">
          {/* Columna izquierda - Lista de participantes */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participantes ({participantes.length})
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando participantes...</div>
              ) : participantes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hay participantes</div>
              ) : (
                participantes.map((participante) => (
                  <div key={participante.U_CODIGO} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md transition group relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {participante.U_NOMBRE?.charAt(0)}{participante.U_APELLIDO?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {participante.U_NOMBRE} {participante.U_APELLIDO}
                          </p>
                          <p className="text-xs text-gray-400">{participante.U_CORREO}</p>
                          {participante.puntuacion !== undefined && (
                            <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
                              <Star className="h-3 w-3" />
                              {participante.puntuacion} pts
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Botón de emojis */}
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojis(showEmojis === participante.U_CODIGO ? null : participante.U_CODIGO)}
                          className="p-2 rounded-full hover:bg-gray-100 transition"
                          disabled={enviando === participante.U_CODIGO}
                        >
                          <Smile className={`h-5 w-5 ${enviando === participante.U_CODIGO ? 'animate-pulse text-gray-400' : 'text-gray-400 hover:text-yellow-500'}`} />
                        </button>
                        
                        {/* Menú de emojis */}
                        {showEmojis === participante.U_CODIGO && (
                          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-10 w-64">
                            <div className="grid grid-cols-4 gap-1">
                              {emojisDisponibles.map((emoji) => (
                                <button
                                  key={emoji.id}
                                  onClick={() => enviarReaccion(participante.U_CODIGO, emoji)}
                                  className={`p-2 rounded-lg text-2xl transition hover:scale-110 ${emoji.color}`}
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
                    
                    {/* Reacciones recibidas */}
                    {participante.reacciones?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {participante.reacciones.map((reaccion, idx) => (
                          <span key={idx} className="text-sm bg-gray-100 rounded-full px-2 py-0.5">
                            {reaccion.emoji}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Columna derecha - Chat en vivo */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="text-lg">💬</span>
                Chat en vivo
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
              {mensajes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No hay mensajes aún. ¡Sé el primero en saludar!
                </div>
              ) : (
                mensajes.map((msg) => (
                  <div
                    key={msg.ID}
                    className={`flex ${msg.U_CODIGO === emisor?.U_CODIGO ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] ${msg.U_CODIGO === emisor?.U_CODIGO ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'} rounded-2xl px-4 py-2`}>
                      {msg.U_CODIGO !== emisor?.U_CODIGO && (
                        <p className="text-xs font-semibold mb-1 opacity-70">
                          {msg.U_NOMBRE} {msg.U_APELLIDO}
                        </p>
                      )}
                      <p className="text-sm">{msg.MENSAJE}</p>
                      <p className="text-xs mt-1 opacity-50">
                        {new Date(msg.FECHA).toLocaleTimeString()}
                      </p>
                    </div>
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
                  disabled={!nuevoMensaje.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                💡 ¡Sé respetuoso! Los mensajes son visibles para todos los participantes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};