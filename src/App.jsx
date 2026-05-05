import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';
import QuinielasPage from './pages/QuinielasPage';
import QuinielaDetailPage from './pages/QuinielaDetailPage';
import RankingPage from './pages/RankingPage';
import MisPrediccionesPage from './pages/MisPrediccionesPage';
import AdminPage from './pages/AdminPage';
import MisQuinielasPage from './pages/MisQuinielasPage';
import PronosticosQuinielaPage from './pages/PronosticosQuinielaPage';
import MisAciertosPage from './pages/MisAciertosPage';

// Admin
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

let deferredPromptGlobal = null;

// 🔥 RUTAS PROTEGIDAS - TEMPORALMENTE DESACTIVADAS PARA NGROK
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  //console.log('🔒 PrivateRoute - isAuthenticated:', isAuthenticated());
  //console.log('🔒 PrivateRoute - user:', user);
  
  // 🔥 TEMPORAL: Siempre permitir acceso para pruebas
  //console.log('🔓 Acceso permitido temporalmente (modo ngrok)');
  return children;
  
  // Código original (comentado)
  // return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// 🔥 RUTAS ADMIN - TEMPORALMENTE DESACTIVADAS
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  //console.log('👑 AdminRoute - isAdmin:', isAdmin());
  //console.log('👑 AdminRoute - user:', user);
  
  // 🔥 TEMPORAL: Siempre permitir acceso para pruebas
  //console.log('🔓 Acceso admin permitido temporalmente (modo ngrok)');
  return children;
  
  // Código original (comentado)
  // return isAuthenticated() && isAdmin() ? children : <Navigate to="/" replace />;
};

// Layout
const PrivateLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Privadas - Todas accesibles temporalmente */}
        <Route path="/" element={<PrivateLayout><HomePage /></PrivateLayout>} />
        <Route path="/quinielas" element={<PrivateLayout><QuinielasPage /></PrivateLayout>} />
        <Route path="/quinielas/:id" element={<PrivateLayout><QuinielaDetailPage /></PrivateLayout>} />
        <Route path="/ranking/:id" element={<PrivateLayout><RankingPage /></PrivateLayout>} />
        <Route path="/mis-predicciones" element={<PrivateLayout><MisPrediccionesPage /></PrivateLayout>} />
        <Route path="/mis-aciertos" element={<PrivateLayout><MisAciertosPage /></PrivateLayout>} />
        <Route path="/mis-quinielas" element={<PrivateLayout><MisQuinielasPage /></PrivateLayout>} />
        <Route path="/quinielas/:id/pronosticos" element={<PrivateLayout><PronosticosQuinielaPage /></PrivateLayout>} />

        {/* Admin - Todas accesibles temporalmente */}
        <Route path="/admin" element={<PrivateLayout><AdminPage /></PrivateLayout>} />
        <Route path="/admin/campeonatos" element={<PrivateLayout><CampeonatosPage /></PrivateLayout>} />
        <Route path="/admin/campeonatos/:c_campeonato" element={<PrivateLayout><CampeonatoDetallePage /></PrivateLayout>} />
        <Route path="/admin/campeonatos/:c_campeonato/quinielas" element={<PrivateLayout><QuinielasPorCampeonatoPage /></PrivateLayout>} />
        <Route path="/admin/crear-quiniela" element={<PrivateLayout><CrearQuinielaPage /></PrivateLayout>} />
        <Route path="/admin/quinielas/:id" element={<PrivateLayout><QuinielaDetallePage /></PrivateLayout>} />
        <Route path="/admin/crear-equipo" element={<PrivateLayout><CrearEquipoPage /></PrivateLayout>} />
        <Route path="/admin/crear-grupo" element={<PrivateLayout><CrearGrupoPage /></PrivateLayout>} />
        <Route path="/admin/crear-partido" element={<PrivateLayout><CrearPartidoPage /></PrivateLayout>} />
        <Route path="/admin/inscribir-usuario" element={<PrivateLayout><InscribirUsuarioPage /></PrivateLayout>} />
        <Route path="/admin/resultados" element={<PrivateLayout><SeleccionarQuinielaResultados /></PrivateLayout>} />
        <Route path="/admin/quinielas/:id/resultados" element={<PrivateLayout><ResultadosPage /></PrivateLayout>} />
      </Routes>

      <Toaster position="top-right" />
    </>
  );
}

function App() {
  const [puedeInstalar, setPuedeInstalar] = useState(false);

  // 🔥 Detectar si estamos en ngrok
  const isNgrok = window.location.hostname.includes('ngrok-free.app');
  
  useEffect(() => {
    if (isNgrok) {
      //console.log('🌐 Modo ngrok detectado');
      // Forzar token si no existe
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', 'ngrok-test-token');
        localStorage.setItem('user', JSON.stringify({
          U_CODIGO: '00656',
          U_ROL: 'ADMIN',
          U_CORREO: 'admin@quiniela.com'
        }));
        //console.log('✅ Token de prueba creado automáticamente');
      }
    }
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      deferredPromptGlobal = e;
      setPuedeInstalar(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setPuedeInstalar(false));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isNgrok]);

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
        <AppRoutes />
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