// components/participantes/ModalParticipantes.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Smile, Send, Wifi, WifiOff } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API;

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
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null); // ✅ Para hacer scroll al final
  const messagesContainerRef = useRef(null);

  // Conectar al socket cuando se abre el modal
  useEffect(() => {
    if (isOpen && quinielaId) {
      if (!socketRef.current) {
        socketRef.current = io(API_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true
        });

        socketRef.current.on('connect', () => {
          console.log('🔌 Conectado al servidor de chat');
          setIsConnected(true);
          socketRef.current.emit('join-quiniela', quinielaId);
        });

        socketRef.current.on('disconnect', () => {
          console.log('🔌 Desconectado del chat');
          setIsConnected(false);
        });

        // Escuchar nuevos mensajes
        socketRef.current.on('nuevo-mensaje-chat', (nuevoMensaje) => {
          console.log('📢 Nuevo mensaje recibido:', nuevoMensaje);
          // ✅ Agregar al FINAL del array (para orden ascendente)
          setMensajes(prev => [...prev, nuevoMensaje]);
          // ✅ Hacer scroll al final después de agregar el mensaje
          setTimeout(scrollToBottom, 100);
        });

        // Escuchar nuevas reacciones
        socketRef.current.on('nueva-reaccion', (reaccion) => {
          console.log('😊 Nueva reacción recibida:', reaccion);
          setParticipantes(prev => prev.map(p => 
            p.U_CODIGO === reaccion.receptorId
              ? { ...p, reacciones: [...(p.reacciones || []), { emoji: reaccion.emoji, de: reaccion.emisorId }] }
              : p
          ));
        });
      } else {
        socketRef.current.emit('join-quiniela', quinielaId);
      }

      cargarDatos();

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave-quiniela', quinielaId);
        }
      };
    }
  }, [isOpen, quinielaId]);

  // ✅ Función para hacer scroll al final del chat
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  // ✅ Hacer scroll al final cuando se cargan los mensajes iniciales
  useEffect(() => {
    if (!loading && mensajes.length > 0) {
      scrollToBottom();
    }
  }, [loading, mensajes.length]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [participantesRes, mensajesRes] = await Promise.all([
        api.get(`/api/quinielas/${quinielaId}/participantes`),
        api.get(`/api/quinielas/${quinielaId}/mensajes`)
      ]);
      
      setParticipantes(participantesRes.data.data || []);
      // ✅ Los mensajes vienen ordenados DESC por fecha (más nuevo primero)
      // Los invertimos para mostrar el más antiguo arriba y el más nuevo abajo
      const mensajesOrdenados = (mensajesRes.data.data || []).reverse();
      setMensajes(mensajesOrdenados);
      
      // ✅ Scroll al final después de cargar
      setTimeout(scrollToBottom, 200);
      
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
      
      // ✅ Agregar mensaje al final (ya se recibirá por socket, pero lo agregamos localmente para inmediatez)
      const msg = response.data.data;
      setMensajes(prev => [...prev, msg]);
      setNuevoMensaje('');
      scrollToBottom();
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
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
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
                    {p.reacciones?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.reacciones.map((r, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 rounded-full px-2 py-0.5">
                            {r.emoji}
                          </span>
                        ))}
                      </div>
                    )}
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
            
            {/* ✅ Contenedor de mensajes con scroll normal (orden ascendente) */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {loading ? (
                <div className="text-center py-8 text-gray-500">Cargando mensajes...</div>
              ) : mensajes.length === 0 ? (
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
              {/* ✅ Elemento fantasma para hacer scroll al final */}
              <div ref={messagesEndRef} />
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