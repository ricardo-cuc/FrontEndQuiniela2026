// components/participantes/ModalParticipantes.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Smile, Send, Wifi, WifiOff, Search, Loader2, ChevronDown, Eye, EyeOff, Menu, UserPlus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API;

const emojisDisponibles = [
  { id: '👍', emoji: '👍', nombre: 'Like', categoria: 'reacciones' },
  { id: '❤️', emoji: '❤️', nombre: 'Corazón', categoria: 'reacciones' },
  { id: '😂', emoji: '😂', nombre: 'Risa', categoria: 'reacciones' },
  { id: '🎉', emoji: '🎉', nombre: 'Fiesta', categoria: 'reacciones' },
  { id: '⚽', emoji: '⚽', nombre: 'Gol', categoria: 'deportes' },
  { id: '🏆', emoji: '🏆', nombre: 'Trofeo', categoria: 'deportes' },
  { id: '🤝', emoji: '🤝', nombre: 'Saludo', categoria: 'saludos' },
  { id: '💪', emoji: '💪', nombre: 'Fuerza', categoria: 'apoyo' },
  { id: '🔥', emoji: '🔥', nombre: 'Fuego', categoria: 'reacciones' },
  { id: '👏', emoji: '👏', nombre: 'Aplausos', categoria: 'reacciones' },
  { id: '💯', emoji: '💯', nombre: 'Perfecto', categoria: 'reacciones' },
  { id: '🤔', emoji: '🤔', nombre: 'Pensando', categoria: 'reacciones' },
  { id: '😢', emoji: '😢', nombre: 'Triste', categoria: 'reacciones' },
  { id: '🥅', emoji: '🥅', nombre: 'Arco', categoria: 'deportes' },
  { id: '🥇', emoji: '🥇', nombre: 'Oro', categoria: 'deportes' },
  { id: '⚡', emoji: '⚡', nombre: 'Rayo', categoria: 'energía' },
  { id: '🍺', emoji: '🍺', nombre: 'Cerveza', categoria: 'bebidas' },
  { id: '🍻', emoji: '🍻', nombre: 'Brindis', categoria: 'bebidas' },
  { id: '🥂', emoji: '🥂', nombre: 'Copas', categoria: 'bebidas' },
  { id: '🍷', emoji: '🍷', nombre: 'Vino', categoria: 'bebidas' },
  { id: '🥃', emoji: '🥃', nombre: 'Whisky', categoria: 'bebidas' },
  { id: '🍹', emoji: '🍹', nombre: 'Cóctel', categoria: 'bebidas' },
  { id: '🍾', emoji: '🍾', nombre: 'Champán', categoria: 'bebidas' },
  { id: '☕', emoji: '☕', nombre: 'Café', categoria: 'bebidas' }
];

const getRecentEmojis = () => {
  const saved = localStorage.getItem('recent_emojis');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

const saveRecentEmoji = (emoji) => {
  const recent = getRecentEmojis();
  const filtered = recent.filter(e => e.id !== emoji.id);
  const newRecent = [emoji, ...filtered].slice(0, 8);
  localStorage.setItem('recent_emojis', JSON.stringify(newRecent));
};

export const ModalParticipantes = ({ isOpen, onClose, quinielaId, quinielaNombre }) => {
  const [participantes, setParticipantes] = useState([]);
  const [participantesFiltrados, setParticipantesFiltrados] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [showEmojis, setShowEmojis] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [showRecentEmojis, setShowRecentEmojis] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isChatFocused, setIsChatFocused] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [showParticipantesDrawer, setShowParticipantesDrawer] = useState(false);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recentEmojis = getRecentEmojis();

  const isMobile = () => window.innerWidth < 768;
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUsuarioActual(parsed.U_CODIGO);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setParticipantesFiltrados(participantes);
    } else {
      const filtered = participantes.filter(p => 
        p.U_NOMBRE?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.U_APELLIDO?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.U_CORREO?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setParticipantesFiltrados(filtered);
    }
  }, [searchTerm, participantes]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isNearBottom);
  };

  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const mostrarNotificacionReaccion = (reaccion) => {
    if (reaccion.receptorId === usuarioActual) {
      toast.success(`💬 ${reaccion.emisorNombre || 'Alguien'} te envió ${reaccion.emoji}`, {
        duration: 3000,
        icon: reaccion.emoji,
        style: {
          background: '#4f46e5',
          color: '#fff',
        },
      });
    }
  };

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

        socketRef.current.on('nuevo-mensaje-chat', (nuevoMensaje) => {
          console.log('📢 Nuevo mensaje recibido:', nuevoMensaje);
          setMensajes(prev => [...prev, nuevoMensaje]);
          
          if (!isChatFocused || !autoScroll) {
            setNewMessagesCount(prev => prev + 1);
          } else {
            setTimeout(scrollToBottom, 100);
          }
        });

        socketRef.current.on('usuario-escribiendo', ({ usuario, estaEscribiendo }) => {
          setTypingUsers(prev => ({
            ...prev,
            [usuario]: estaEscribiendo
          }));
          setTimeout(() => {
            setTypingUsers(prev => ({ ...prev, [usuario]: false }));
          }, 2000);
        });

        socketRef.current.on('nueva-reaccion', (reaccion) => {
          setParticipantes(prev => prev.map(p => 
            p.U_CODIGO === reaccion.receptorId
              ? { 
                  ...p, 
                  reacciones: [...(p.reacciones || []), { 
                    emoji: reaccion.emoji, 
                    de: reaccion.emisorId,
                    emisorNombre: reaccion.emisorNombre,
                    fecha: new Date()
                  }] 
                }
              : p
          ));
          mostrarNotificacionReaccion(reaccion);
        });
      } else {
        socketRef.current.emit('join-quiniela', quinielaId);
        setIsChatFocused(true);
        setNewMessagesCount(0);
      }

      cargarDatos();

      return () => {
        if (socketRef.current) {
          socketRef.current.emit('leave-quiniela', quinielaId);
        }
      };
    }
  }, [isOpen, quinielaId]);

  const handleTyping = () => {
    if (!isTyping && socketRef.current) {
      setIsTyping(true);
      socketRef.current.emit('usuario-escribiendo', {
        quinielaId,
        estaEscribiendo: true
      });
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        setIsTyping(false);
        socketRef.current.emit('usuario-escribiendo', {
          quinielaId,
          estaEscribiendo: false
        });
      }
    }, 1000);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [participantesRes, mensajesRes] = await Promise.all([
        api.get(`/api/quinielas/${quinielaId}/participantes`),
        api.get(`/api/quinielas/${quinielaId}/mensajes?limit=50`)
      ]);
      
      setParticipantes(participantesRes.data.data || []);
      setParticipantesFiltrados(participantesRes.data.data || []);
      
      const mensajesOrdenados = (mensajesRes.data.data || []).reverse();
      setMensajes(mensajesOrdenados);
      setHasMoreMessages(mensajesOrdenados.length >= 50);
      setPage(1);
      
      setTimeout(scrollToBottom, 200);
      
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarMasMensajes = async () => {
    if (loadingMore || !hasMoreMessages) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const response = await api.get(`/api/quinielas/${quinielaId}/mensajes?limit=50&page=${nextPage}`);
      const nuevosMensajes = (response.data.data || []).reverse();
      
      if (nuevosMensajes.length > 0) {
        setMensajes(prev => [...nuevosMensajes, ...prev]);
        setPage(nextPage);
        setHasMoreMessages(nuevosMensajes.length >= 50);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error cargando más mensajes:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim()) return;
    
    setEnviando(true);
    try {
      await api.post(`/api/quinielas/${quinielaId}/mensajes`, {
        mensaje: nuevoMensaje,
        tipo: 'texto'
      });
      
      setNuevoMensaje('');
      setIsTyping(false);
      if (socketRef.current) {
        socketRef.current.emit('usuario-escribiendo', {
          quinielaId,
          estaEscribiendo: false
        });
      }
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
      
      saveRecentEmoji(emoji);
      toast.success(`Reacción ${emoji.emoji} enviada`);
      setShowEmojis(null);
      
    } catch (error) {
      console.error('Error enviando reacción:', error);
      toast.error(error.response?.data?.message || 'Error al enviar reacción');
    }
  };

  useEffect(() => {
    if (autoScroll && !loading) {
      scrollToBottom();
    }
  }, [mensajes.length, autoScroll, loading]);

  useEffect(() => {
    const handleFocus = () => {
      setIsChatFocused(true);
      setNewMessagesCount(0);
    };
    const handleBlur = () => setIsChatFocused(false);
    
    const chatContainer = messagesContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('focus', handleFocus);
      chatContainer.addEventListener('blur', handleBlur);
      return () => {
        chatContainer.removeEventListener('focus', handleFocus);
        chatContainer.removeEventListener('blur', handleBlur);
      };
    }
  }, []);

  const emojisPorCategoria = emojisDisponibles.reduce((acc, emoji) => {
    if (!acc[emoji.categoria]) acc[emoji.categoria] = [];
    acc[emoji.categoria].push(emoji);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              {mobile && (
                <button
                  onClick={() => setShowParticipantesDrawer(true)}
                  className="text-white/70 hover:text-white relative"
                >
                  <Users className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {participantes.length}
                  </span>
                </button>
              )}
              <div>
                <h2 className="text-lg font-bold">Chat en vivo</h2>
                <p className="text-xs text-indigo-200 truncate max-w-[180px]">{quinielaNombre}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-300' : 'text-red-300'}`}>
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              </div>
              <button onClick={onClose} className="text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Chat - Vista principal siempre visible */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Área de mensajes */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
              onScroll={handleScroll}
              tabIndex={0}
            >
              {hasMoreMessages && !loading && (
                <div className="text-center">
                  <button
                    onClick={cargarMasMensajes}
                    disabled={loadingMore}
                    className="text-xs text-indigo-500 hover:text-indigo-700 py-1"
                  >
                    {loadingMore ? (
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    ) : (
                      'Cargar mensajes anteriores ↑'
                    )}
                  </button>
                </div>
              )}
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                </div>
              ) : mensajes.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No hay mensajes aún. ¡Sé el primero en saludar!
                </div>
              ) : (
                mensajes.map((msg, idx) => (
                  <div key={msg.ID_MENSAJE || idx} className="bg-gray-100 rounded-xl px-4 py-2 max-w-[85%]">
                    <p className="text-xs font-semibold text-indigo-600">
                      {msg.U_NOMBRE} {msg.U_APELLIDO}
                    </p>
                    <p className="text-sm text-gray-700 break-words">{msg.MENSAJE}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.FECHA_CREACION).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))
              )}
              
              {Object.values(typingUsers).some(v => v) && (
                <div className="text-xs text-gray-400 italic">
                  {Object.entries(typingUsers)
                    .filter(([, typing]) => typing)
                    .map(([usuario]) => usuario)
                    .join(', ')} está escribiendo...
                </div>
              )}
              
              {newMessagesCount > 0 && !autoScroll && (
                <button
                  onClick={() => {
                    scrollToBottom();
                    setNewMessagesCount(0);
                  }}
                  className="sticky bottom-0 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center gap-1"
                >
                  <ChevronDown className="h-3 w-3" />
                  {newMessagesCount} mensaje(s) nuevo(s)
                </button>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input de mensaje - Siempre visible */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={() => setAutoScroll(!autoScroll)}
                  className={`p-2 rounded-full ${autoScroll ? 'text-indigo-600 bg-indigo-100' : 'text-gray-400 bg-gray-200'}`}
                  title={autoScroll ? 'Auto-scroll activado' : 'Auto-scroll desactivado'}
                >
                  {autoScroll ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => {
                    setNuevoMensaje(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  autoFocus
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

      {/* Drawer de participantes para móvil */}
      {mobile && (
        <>
          {/* Overlay */}
          {showParticipantesDrawer && (
            <div 
              className="fixed inset-0 bg-black/50 z-50 transition-opacity"
              onClick={() => setShowParticipantesDrawer(false)}
            />
          )}
          
          {/* Drawer */}
          <div className={`fixed top-0 left-0 bottom-0 w-11/12 max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
            showParticipantesDrawer ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Drawer Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div>
                <h3 className="font-bold">Participantes</h3>
                <p className="text-xs text-indigo-200">{participantes.length} personas</p>
              </div>
              <button 
                onClick={() => setShowParticipantesDrawer(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Búsqueda */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar participantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de participantes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                </div>
              ) : participantesFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {searchTerm ? 'No se encontraron participantes' : 'No hay participantes'}
                </div>
              ) : (
                participantesFiltrados.map((p) => (
                  <div key={p.U_CODIGO} className="bg-white rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {p.U_NOMBRE?.charAt(0)}{p.U_APELLIDO?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">
                            {p.U_NOMBRE} {p.U_APELLIDO}
                          </p>
                          {p.puntuacion_total > 0 && (
                            <p className="text-xs text-yellow-600">⭐ {p.puntuacion_total} pts</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => setShowEmojis(showEmojis === p.U_CODIGO ? null : p.U_CODIGO)}
                          className="p-2 rounded-full hover:bg-gray-100 transition"
                        >
                          <Smile className="h-5 w-5 text-gray-400" />
                        </button>
                        
                        {showEmojis === p.U_CODIGO && (
                          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-10 w-72">
                            {recentEmojis.length > 0 && showRecentEmojis && (
                              <div className="mb-3">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs text-gray-500">🕐 Recientes</span>
                                  <button 
                                    onClick={() => setShowRecentEmojis(false)}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                  >
                                    Ocultar
                                  </button>
                                </div>
                                <div className="grid grid-cols-8 gap-1">
                                  {recentEmojis.map((emoji) => (
                                    <button
                                      key={emoji.id}
                                      onClick={() => {
                                        enviarReaccion(p.U_CODIGO, emoji);
                                        setShowEmojis(null);
                                      }}
                                      className="p-2 rounded-lg text-2xl hover:bg-gray-100 transition"
                                      title={emoji.nombre}
                                    >
                                      {emoji.emoji}
                                    </button>
                                  ))}
                                </div>
                                <div className="border-t border-gray-100 my-2"></div>
                              </div>
                            )}
                            <div className="max-h-64 overflow-y-auto">
                              {Object.entries(emojisPorCategoria).map(([categoria, emojis]) => (
                                <div key={categoria} className="mb-3">
                                  <span className="text-xs text-gray-500 capitalize">{categoria}</span>
                                  <div className="grid grid-cols-4 gap-1 mt-1">
                                    {emojis.map((emoji) => (
                                      <button
                                        key={emoji.id}
                                        onClick={() => {
                                          enviarReaccion(p.U_CODIGO, emoji);
                                          setShowEmojis(null);
                                        }}
                                        className="p-2 rounded-lg text-2xl hover:bg-gray-100 transition"
                                        title={emoji.nombre}
                                      >
                                        {emoji.emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {p.reacciones?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.reacciones.slice(-5).map((r, idx) => (
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
        </>
      )}

      {/* Versión desktop: panel lateral de participantes */}
      {!mobile && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-40 transform transition-transform border-l border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <h3 className="font-bold">Participantes</h3>
            <p className="text-sm text-indigo-200">{participantes.length} personas en la quiniela</p>
          </div>

          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar participantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
              </div>
            ) : participantesFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchTerm ? 'No se encontraron participantes' : 'No hay participantes'}
              </div>
            ) : (
              participantesFiltrados.map((p) => (
                <div key={p.U_CODIGO} className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {p.U_NOMBRE?.charAt(0)}{p.U_APELLIDO?.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {p.U_NOMBRE} {p.U_APELLIDO}
                        </p>
                        {p.puntuacion_total > 0 && (
                          <p className="text-xs text-yellow-600">⭐ {p.puntuacion_total} pts</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEmojis(showEmojis === p.U_CODIGO ? null : p.U_CODIGO)}
                      className="p-1 rounded-full hover:bg-gray-200 transition"
                    >
                      <Smile className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  {showEmojis === p.U_CODIGO && (
                    <div className="mt-2 bg-white rounded-lg shadow-lg border p-2">
                      <div className="grid grid-cols-6 gap-1">
                        {emojisDisponibles.slice(0, 12).map((emoji) => (
                          <button
                            key={emoji.id}
                            onClick={() => {
                              enviarReaccion(p.U_CODIGO, emoji);
                              setShowEmojis(null);
                            }}
                            className="p-1 text-xl hover:bg-gray-100 rounded"
                          >
                            {emoji.emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {p.reacciones?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.reacciones.slice(-3).map((r, idx) => (
                        <span key={idx} className="text-xs bg-white rounded-full px-2 py-0.5">
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
      )}
    </>
  );
};