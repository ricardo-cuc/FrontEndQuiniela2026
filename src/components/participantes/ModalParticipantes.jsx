import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Smile, Send, Wifi, WifiOff, Search, Loader2, ChevronDown, Eye, EyeOff, Reply } from 'lucide-react';
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
  const [autoScroll, setAutoScroll] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [isChatFocused, setIsChatFocused] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [showParticipantesDrawer, setShowParticipantesDrawer] = useState(false);
  const [screenSize, setScreenSize] = useState('desktop');
  
  const [mensajeRespondiendo, setMensajeRespondiendo] = useState(null);
  const [showReaccionesMensaje, setShowReaccionesMensaje] = useState(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const recentEmojis = getRecentEmojis();

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize === 'mobile';
  const isTablet = screenSize === 'tablet';
  const isDesktop = screenSize === 'desktop';

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
    
    if (scrollTop === 0 && hasMoreMessages && !loadingMore) {
      cargarMasMensajes();
    }
  };

  const scrollToBottom = () => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
        api.get(`/api/quinielas/${quinielaId}/mensajes?limit=50&include=reacciones,respuestas`)
      ]);
      
      const participantesConReacciones = (participantesRes.data.data || []).map(p => ({
        ...p,
        reacciones: p.reacciones || []
      }));
      
      setParticipantes(participantesConReacciones);
      setParticipantesFiltrados(participantesConReacciones);
      
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
      const response = await api.get(`/api/quinielas/${quinielaId}/mensajes?limit=50&page=${nextPage}&include=reacciones,respuestas`);
      const nuevosMensajes = (response.data.data || []).reverse();
      
      if (nuevosMensajes.length > 0) {
        const scrollHeightBefore = messagesContainerRef.current?.scrollHeight || 0;
        setMensajes(prev => [...nuevosMensajes, ...prev]);
        setPage(nextPage);
        setHasMoreMessages(nuevosMensajes.length >= 50);
        
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - scrollHeightBefore;
          }
        }, 100);
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

  const enviarReaccionParticipante = async (receptorId, emoji) => {
    if (showEmojis === 'enviando') return;
    
    try {
      setShowEmojis('enviando');
      
      await api.post(`/api/quinielas/${quinielaId}/reacciones`, {
        usuario_id: receptorId,
        emoji: emoji.emoji
      });
      
      saveRecentEmoji(emoji);
      toast.success(`Reacción ${emoji.emoji} enviada`, { duration: 1500 });
      setShowEmojis(null);
      
      const participantesRes = await api.get(`/api/quinielas/${quinielaId}/participantes`);
      const participantesConReacciones = (participantesRes.data.data || []).map(p => ({
        ...p,
        reacciones: p.reacciones || []
      }));
      setParticipantes(participantesConReacciones);
      setParticipantesFiltrados(participantesConReacciones);
      
    } catch (error) {
      console.error('Error enviando reacción:', error);
      toast.error(error.response?.data?.message || 'Error al enviar reacción');
      setShowEmojis(null);
    }
  };

  // ✅ Única versión correcta - CON RECARGA DE MENSAJES
  const enviarReaccionMensaje = async (mensajeId, emoji) => {
    try {
      await api.post(`/api/quinielas/${quinielaId}/mensajes/${mensajeId}/reacciones`, {
        emoji: emoji.emoji
      });
      
      saveRecentEmoji(emoji);
      toast.success(`Reacción ${emoji.emoji} añadida al mensaje`, { duration: 1500 });
      setShowReaccionesMensaje(null);
      
      // ✅ Recargar mensajes para ver la reacción actualizada
      const mensajesRes = await api.get(`/api/quinielas/${quinielaId}/mensajes?limit=50&include=reacciones,respuestas`);
      const mensajesOrdenados = (mensajesRes.data.data || []).reverse();
      setMensajes(mensajesOrdenados);
      
    } catch (error) {
      console.error('Error enviando reacción a mensaje:', error);
      toast.error('Error al enviar reacción');
    }
  };

  const enviarRespuestaMensaje = async () => {
    if (!respuestaTexto.trim() || !mensajeRespondiendo) return;
    
    try {
      await api.post(`/api/quinielas/${quinielaId}/mensajes/${mensajeRespondiendo.ID_MENSAJE}/responder`, {
        mensaje: respuestaTexto
      });
      
      setRespuestaTexto('');
      setMensajeRespondiendo(null);
      toast.success('Respuesta enviada');
      cargarDatos();
      
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      toast.error(error.response?.data?.message || 'Error al enviar respuesta');
    }
  };

  const renderMensaje = (msg) => {
    const esRespondiendo = mensajeRespondiendo?.ID_MENSAJE === msg.ID_MENSAJE;
    
    // Mostrar reacciones del mensaje
    const tieneReacciones = msg.reacciones && msg.reacciones.length > 0;
    
    return (
      <div key={msg.ID_MENSAJE} className="mb-3">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 max-w-[720px]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs font-semibold text-indigo-600">
              {msg.U_NOMBRE} {msg.U_APELLIDO}
            </p>
            
            <div className="flex gap-1">
              <button
                onClick={() => setShowReaccionesMensaje(showReaccionesMensaje === msg.ID_MENSAJE ? null : msg.ID_MENSAJE)}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                title="Reaccionar a este mensaje"
              >
                <Smile className="h-3 w-3 text-gray-600" />
              </button>
              <button
                onClick={() => setMensajeRespondiendo(msg)}
                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                title="Responder a este mensaje"
              >
                <Reply className="h-3 w-3 text-gray-600" />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 break-words mt-2 leading-relaxed">
            {msg.MENSAJE}
          </p>
          
          {/* Mostrar reacciones existentes */}
          {tieneReacciones && (
            <div className="flex flex-wrap gap-1 mt-2">
              {msg.reacciones.map((reaccion, idx) => (
                <span key={idx} className="text-xs bg-gray-100 rounded-full px-2 py-0.5" title={reaccion.nombre}>
                  {reaccion.emoji}
                </span>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-400 mt-1">
            {new Date(msg.FECHA_CREACION).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        
        {showReaccionesMensaje === msg.ID_MENSAJE && (
          <div className="mt-1 ml-4 bg-white rounded-lg shadow-xl border border-gray-200 p-2 inline-block">
            <div className="grid grid-cols-6 gap-1">
              {emojisDisponibles.slice(0, 12).map((emoji) => (
                <button
                  key={emoji.id}
                  onClick={() => enviarReaccionMensaje(msg.ID_MENSAJE, emoji)}
                  className="p-1 text-xl hover:bg-gray-100 rounded transition"
                  title={emoji.nombre}
                >
                  {emoji.emoji}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {esRespondiendo && (
          <div className="mt-2 ml-8 pl-3 border-l-2 border-indigo-300">
            <div className="bg-indigo-50 rounded-lg p-2">
              <p className="text-xs text-indigo-600 mb-1">
                Respondiendo a {msg.U_NOMBRE}:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && enviarRespuestaMensaje()}
                  placeholder="Escribe tu respuesta..."
                  className="flex-1 px-3 py-1 text-sm border border-indigo-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  onClick={enviarRespuestaMensaje}
                  disabled={!respuestaTexto.trim()}
                  className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm hover:bg-indigo-700"
                >
                  Enviar
                </button>
                <button
                  onClick={() => {
                    setMensajeRespondiendo(null);
                    setRespuestaTexto('');
                  }}
                  className="text-gray-400 hover:text-gray-600 px-2"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderParticipantesList = () => (
    <div className="space-y-2">
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
                  className="p-1 rounded-full hover:bg-gray-200 transition"
                  disabled={showEmojis === 'enviando'}
                >
                  <Smile className="h-4 w-4 text-gray-400" />
                </button>
                
                {showEmojis === p.U_CODIGO && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-20 w-64">
                    <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                      {emojisDisponibles.map((emoji) => (
                        <button
                          key={emoji.id}
                          onClick={() => enviarReaccionParticipante(p.U_CODIGO, emoji)}
                          className="p-1 text-xl hover:bg-gray-100 rounded transition"
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
                {p.reacciones.slice(-3).map((r, idx) => (
                  <span key={idx} className="text-xs bg-white rounded-full px-2 py-0.5 shadow-sm" title={r.emisorNombre}>
                    {r.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  useEffect(() => {
    if (autoScroll && !loading) {
      scrollToBottom();
    }
  }, [mensajes.length, autoScroll, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60">
      <div
        className={`bg-white rounded-none md:rounded-2xl shadow-2xl w-full h-full md:h-[90vh] overflow-hidden flex flex-col
        ${isMobile ? 'max-w-full' : isTablet ? 'max-w-4xl' : 'max-w-5xl'}
        `}
        style={{
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          transform: 'translateZ(0)'
        }}
      >
        
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          
          {/* Columna del Chat */}
          <div className={`flex flex-col overflow-hidden ${isDesktop ? 'md:w-[65%]' : 'flex-1'}`}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-indigo-600 text-white">
              <div className="flex items-center gap-3">
                {(isMobile || isTablet) && (
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
                  <span className="hidden sm:inline">{isConnected ? 'Conectado' : 'Desconectado'}</span>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Área de mensajes */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
              onScroll={handleScroll}
              tabIndex={0}
            >
              {loadingMore && (
                <div className="text-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin inline text-indigo-500" />
                  <span className="text-xs text-gray-400 ml-2">Cargando mensajes anteriores...</span>
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
                mensajes.map((msg) => renderMensaje(msg))
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

            {/* Input de mensaje */}
            <div className="p-4 border-t border-gray-200 bg-white">
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  autoFocus
                />
                <button
                  onClick={enviarMensaje}
                  disabled={!nuevoMensaje.trim() || enviando}
                  className="bg-indigo-600 text-white px-4 py-3 rounded-full hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                💡 Sé respetuoso. Los mensajes son visibles para todos.
              </p>
            </div>
          </div>

          {/* Panel de Participantes Desktop */}
          {isDesktop && (
            <div className="md:w-[35%] bg-white border-l border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 bg-indigo-600 text-white">
                <h3 className="font-bold">Participantes</h3>
                <p className="text-sm text-indigo-200">{participantes.length} personas</p>
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

              <div className="flex-1 overflow-y-auto p-3">
                {renderParticipantesList()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawer de participantes para móvil/tablet */}
      {(isMobile || isTablet) && showParticipantesDrawer && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
            onClick={() => setShowParticipantesDrawer(false)}
          />
          
          <div className={`fixed top-0 left-0 bottom-0 w-11/12 max-w-sm bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-out flex flex-col
            ${showParticipantesDrawer ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-indigo-600 text-white">
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

            <div className="flex-1 overflow-y-auto p-3">
              {renderParticipantesList()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};