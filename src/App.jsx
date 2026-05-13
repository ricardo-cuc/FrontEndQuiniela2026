import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { io } from 'socket.io-client';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Navbar from './components/common/Navbar';
import { SocketStatus } from './components/SocketStatus';
import { FloatingHelpWidget } from './components/help/FloatingHelpWidget'; // ✅ IMPORTACIÓN CORRECTA

import HomePage from './pages/HomePage';
import QuinielasPage from './pages/QuinielasPage';
import QuinielaDetailPage from './pages/QuinielaDetailPage';
import RankingPage from './pages/RankingPage';
import MisPrediccionesPage from './pages/MisPrediccionesPage';
import MisQuinielasPage from './pages/MisQuinielasPage';
import PronosticosQuinielaPage from './pages/PronosticosQuinielaPage';
import MisAciertosPage from './pages/MisAciertosPage';

import PushNotificaciones from './components/PushNotificaciones';

// Admin
import AdminPage from './pages/AdminPage';
import CrearQuinielaPage from './pages/admin/CrearQuinielaPage';
import CrearEquipoPage from './pages/admin/CrearEquipoPage';
import CrearGrupoPage from './pages/admin/CrearGrupoPage';
import CrearPartidoPage from './pages/admin/CrearPartidoPage';
import InscribirUsuarioPage from './pages/admin/InscribirUsuarioPage';
import SeleccionarQuinielaResultados from './pages/admin/SeleccionarQuinielaResultados';
import ResultadosPage from './pages/admin/ResultadosPage';
import CampeonatosPage from './pages/admin/CampeonatosPage';
import QuinielasPorCampeonatoPage from './pages/admin/QuinielasPorCampeonatoPage';
import CampeonatoDetallePage from './pages/admin/CampeonatoDetallePage';
import QuinielaDetallePage from './pages/admin/QuinielaDetallePage';

const API_URL = import.meta.env.VITE_API;
let deferredPromptGlobal = null;

// ✅ Socket global único para toda la app
let globalSocket = null;
let socketEventHandlers = new Map();

// ✅ Función para obtener el socket global (para usar en hooks)
export const getGlobalSocket = () => globalSocket;

// ✅ Función para suscribirse a eventos globales
export const subscribeToSocketEvent = (event, handler) => {
  if (!socketEventHandlers.has(event)) {
    socketEventHandlers.set(event, new Set());
  }
  socketEventHandlers.get(event).add(handler);
  
  if (globalSocket) {
    globalSocket.on(event, handler);
  }
  
  return () => {
    const handlers = socketEventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (globalSocket) {
        globalSocket.off(event, handler);
      }
    }
  };
};

// ============================================
// 🔒 PRIVATE ROUTE
// ============================================
const PrivateRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ============================================
// 👑 ADMIN ROUTE
// ============================================
const AdminRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  const isAdmin = user?.U_ROL === 'ADMIN';

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ============================================
// 📦 LAYOUT
// ============================================
const PrivateLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-100">
    <Navbar />
    <main className="container mx-auto px-4 py-8">
      {children}
    </main>
  </div>
);

// ============================================
// 🕐 SESSION MONITOR
// ============================================
function SessionMonitor() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      if (isAuthenticated) {
        console.log('Sesión expirada, redirigiendo al login...');
        logout();
        navigate('/login', { 
          state: { message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.' }
        });
      }
    };

    window.addEventListener('sessionExpired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [logout, navigate, isAuthenticated]);

  return null;
}

// ============================================
// 🌐 SOCKET MANAGER UNIFICADO
// ============================================
function SocketManager() {
  const { isAuthenticated, user } = useAuth();
  const isRegisteredRef = useRef(false);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;

  const registerUserPresence = () => {
    if (!globalSocket?.connected || !isAuthenticated || !user?.U_CODIGO) return;
    if (isRegisteredRef.current) return;

    console.log('📝 Registrando usuario en presencia:', user.U_CODIGO);
    globalSocket.emit('registrar-usuario', {
      u_codigo: user.U_CODIGO,
      nombre: `${user.U_NOMBRE || ''} ${user.U_APELLIDO || ''}`.trim() || user.U_CORREO
    });
    isRegisteredRef.current = true;
  };

  const setupSocket = () => {
    if (!isAuthenticated || !user?.U_CODIGO) return;

    if (globalSocket?.connected) {
      console.log('✅ Usando socket existente');
      registerUserPresence();
      return;
    }

    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
    }

    console.log('🔌 Creando nueva conexión socket...');
    globalSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true
    });

    socketEventHandlers.forEach((handlers, event) => {
      handlers.forEach(handler => {
        globalSocket.on(event, handler);
      });
    });

    globalSocket.on('connect', () => {
      console.log('✅ Socket conectado correctamente');
      reconnectAttempts.current = 0;
      isRegisteredRef.current = false;
      registerUserPresence();
    });

    globalSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconectado después de ${attemptNumber} intentos`);
      isRegisteredRef.current = false;
      registerUserPresence();
    });

    globalSocket.on('reconnecting', (attemptNumber) => {
      console.log(`🔄 Reconectando... Intento ${attemptNumber}`);
    });

    globalSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión:', error.message);
      reconnectAttempts.current++;
    });

    globalSocket.on('disconnect', (reason) => {
      console.log(`🔌 Socket desconectado: ${reason}`);
      isRegisteredRef.current = false;
      
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          if (isAuthenticated && globalSocket) {
            globalSocket.connect();
          }
        }, 1000);
      }
    });

    globalSocket.on('sesion-duplicada', (data) => {
      console.warn('⚠️ Sesión duplicada:', data);
      alert('⚠️ Tu sesión se ha abierto en otro dispositivo. Serás redirigido al login.');
      sessionStorage.clear();
      window.location.href = '/login';
    });

    globalSocket.on('usuario-conectado', (data) => {
      console.log('👤 Usuario conectado:', data);
    });

    globalSocket.on('usuario-desconectado', (data) => {
      console.log('👤 Usuario desconectado:', data);
    });
  };

  useEffect(() => {
    if (isAuthenticated && user?.U_CODIGO) {
      setupSocket();
    } else if (!isAuthenticated && globalSocket) {
      console.log('🔌 Cerrando socket por logout');
      globalSocket.disconnect();
      globalSocket = null;
      isRegisteredRef.current = false;
    }

    return () => {};
  }, [isAuthenticated, user?.U_CODIGO]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user?.U_CODIGO) {
        if (!globalSocket?.connected) {
          console.log('📱 Página visible, reconectando...');
          setupSocket();
        } else if (globalSocket?.connected && !isRegisteredRef.current) {
          registerUserPresence();
        }
      }
    };

    const handleOnline = () => {
      console.log('🌐 Red recuperada, reconectando...');
      if (isAuthenticated && user?.U_CODIGO) {
        setupSocket();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [isAuthenticated, user?.U_CODIGO]);

  return null;
}

// ============================================
// ROUTES
// ============================================
function AppRoutes() {
  return (
    <>
      <SessionMonitor />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><PrivateLayout><HomePage /></PrivateLayout></PrivateRoute>} />
        <Route path="/quinielas" element={<PrivateRoute><PrivateLayout><QuinielasPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/quinielas/:id" element={<PrivateRoute><PrivateLayout><QuinielaDetailPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/ranking/:id" element={<PrivateRoute><PrivateLayout><RankingPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/mis-predicciones" element={<PrivateRoute><PrivateLayout><MisPrediccionesPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/mis-aciertos" element={<PrivateRoute><PrivateLayout><MisAciertosPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/mis-quinielas" element={<PrivateRoute><PrivateLayout><MisQuinielasPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/quinielas/:id/pronosticos" element={<PrivateRoute><PrivateLayout><PronosticosQuinielaPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/admin" element={<AdminRoute><PrivateLayout><AdminPage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/campeonatos" element={<AdminRoute><PrivateLayout><CampeonatosPage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/campeonatos/:c_campeonato" element={<AdminRoute><PrivateLayout><CampeonatoDetallePage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/campeonatos/:c_campeonato/quinielas" element={<AdminRoute><PrivateLayout><QuinielasPorCampeonatoPage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/crear-quiniela" element={<AdminRoute><PrivateLayout><CrearQuinielaPage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/quinielas/:id" element={<AdminRoute><PrivateLayout><QuinielaDetallePage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/crear-equipo" element={<AdminRoute><PrivateLayout><CrearEquipoPage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/crear-grupo" element={<AdminRoute><PrivateLayout><CrearGrupoPage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/crear-partido" element={<AdminRoute><PrivateLayout><CrearPartidoPage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/inscribir-usuario" element={<AdminRoute><PrivateLayout><InscribirUsuarioPage /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/resultados" element={<AdminRoute><PrivateLayout><SeleccionarQuinielaResultados /></PrivateLayout></AdminRoute>} />
        <Route path="/admin/quinielas/:id/resultados" element={<AdminRoute><PrivateLayout><ResultadosPage /></PrivateLayout></AdminRoute>} />
      </Routes>
    </>
  );
}

// ============================================
// APP
// ============================================
function App() {
  const [puedeInstalar, setPuedeInstalar] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setPuedeInstalar(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setPuedeInstalar(false));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const instalarApp = async () => {
    if (!deferredPromptGlobal) return;
    deferredPromptGlobal.prompt();
    await deferredPromptGlobal.userChoice;
    deferredPromptGlobal = null;
    setPuedeInstalar(false);
  };

  return (
    <Router>
      <AuthProvider>
        <SocketManager />
        <AppRoutes />
        <Toaster position="top-right" />
        <PushNotificaciones />
        <SocketStatus />
        <FloatingHelpWidget /> {/* ✅ Widget de ayuda flotante */}
        {puedeInstalar && (
          <button onClick={instalarApp} className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            📲 Instalar App
          </button>
        )}
      </AuthProvider>
    </Router>
  );
}

export default App;