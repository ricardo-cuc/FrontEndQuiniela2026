import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import NotificationInitializer from './components/NotificationInitializer';
import { io } from 'socket.io-client';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Navbar from './components/common/Navbar';

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
let socketPresencia = null;

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
// 🕐 SESSION MONITOR - Escucha eventos de expiración
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

    // Escuchar evento personalizado de expiración
    window.addEventListener('sessionExpired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [logout, navigate, isAuthenticated]);

  return null;
}

// ============================================
// ROUTES
// ============================================
function AppRoutes() {
  return (
    <>
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PRIVATE */}
        <Route path="/" element={<PrivateRoute><PrivateLayout><HomePage /></PrivateLayout></PrivateRoute>} />
        <Route path="/quinielas" element={<PrivateRoute><PrivateLayout><QuinielasPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/quinielas/:id" element={<PrivateRoute><PrivateLayout><QuinielaDetailPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/ranking/:id" element={<PrivateRoute><PrivateLayout><RankingPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/mis-predicciones" element={<PrivateRoute><PrivateLayout><MisPrediccionesPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/mis-aciertos" element={<PrivateRoute><PrivateLayout><MisAciertosPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/mis-quinielas" element={<PrivateRoute><PrivateLayout><MisQuinielasPage /></PrivateLayout></PrivateRoute>} />
        <Route path="/quinielas/:id/pronosticos" element={<PrivateRoute><PrivateLayout><PronosticosQuinielaPage /></PrivateLayout></PrivateRoute>} />

        {/* ADMIN */}
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

      <Toaster position="top-right" />
      <PushNotificaciones />
    </>
  );
}

// ============================================
// COMPONENTE DE PRESENCIA (dentro de AuthProvider)
// ============================================
function PresenceManager() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user && user.U_CODIGO) {
      if (!socketPresencia) {
        socketPresencia = io(API_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true
        });

        socketPresencia.on('connect', () => {
          console.log('🔌 Conectado a servidor de presencia');
          socketPresencia.emit('registrar-usuario', {
            u_codigo: user.U_CODIGO,
            nombre: `${user.U_NOMBRE || ''} ${user.U_APELLIDO || ''}`.trim() || user.U_CORREO
          });
        });

        socketPresencia.on('sesion-duplicada', (data) => {
          console.warn('⚠️ Sesión duplicada detectada:', data);
          alert('⚠️ Tu sesión se ha abierto en otro dispositivo. Serás redirigido al login.');
          sessionStorage.clear();
          window.location.href = '/login';
        });
      }
    } else if (!isAuthenticated && socketPresencia) {
      socketPresencia.disconnect();
      socketPresencia = null;
    }

    return () => {
      if (socketPresencia && !isAuthenticated) {
        socketPresencia.disconnect();
        socketPresencia = null;
      }
    };
  }, [isAuthenticated, user]);

  return null;
}

// ============================================
// APP
// ============================================
function App() {
  const [puedeInstalar, setPuedeInstalar] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;

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
        <SessionMonitor /> {/* ✅ Monitor de sesión expirada */}
        <PresenceManager />
        <AppRoutes />
        {puedeInstalar && (
          <button
            onClick={instalarApp}
            className="fixed bottom-4 right-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
          >
            📲 Instalar App
          </button>
        )}
      </AuthProvider>
    </Router>
  );
}

export default App;