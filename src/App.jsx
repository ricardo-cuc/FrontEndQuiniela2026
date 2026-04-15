// src/App.jsx
import React from 'react';
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

// Importar páginas de administración
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

// Componente para rutas protegidas (requiere login)
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

// Componente para rutas de admin (requiere rol ADMIN)
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated() && isAdmin() ? children : <Navigate to="/" />;
};

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rutas protegidas (requieren login) */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/quinielas"
            element={
              <PrivateRoute>
                <QuinielasPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/quinielas/:id"
            element={
              <PrivateRoute>
                <QuinielaDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/ranking/:id"
            element={
              <PrivateRoute>
                <RankingPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/mis-predicciones"
            element={
              <PrivateRoute>
                <MisPrediccionesPage />
              </PrivateRoute>
            }
          />
          
          {/* Nuevas rutas para usuario */}
          <Route
            path="/mis-quinielas"
            element={
              <PrivateRoute>
                <MisQuinielasPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/quinielas/:id/pronosticos"
            element={
              <PrivateRoute>
                <PronosticosQuinielaPage />
              </PrivateRoute>
            }
          />
          
          {/* Rutas de administración (requieren rol ADMIN) */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          
          {/* Rutas para Campeonatos */}
          <Route
            path="/admin/campeonatos"
            element={
              <AdminRoute>
                <CampeonatosPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/campeonatos/:c_campeonato"
            element={
              <AdminRoute>
                <CampeonatoDetallePage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/campeonatos/:c_campeonato/quinielas"
            element={
              <AdminRoute>
                <QuinielasPorCampeonatoPage />
              </AdminRoute>
            }
          />
          
          {/* Rutas para Quinielas */}
          <Route
            path="/admin/crear-quiniela"
            element={
              <AdminRoute>
                <CrearQuinielaPage />
              </AdminRoute>
            }
          />
          
          {/* NUEVA RUTA: Detalle de Quiniela (Admin) */}
          <Route
            path="/admin/quinielas/:id"
            element={
              <AdminRoute>
                <QuinielaDetallePage />
              </AdminRoute>
            }
          />
          
          {/* Rutas para Equipos, Grupos, Partidos */}
          <Route
            path="/admin/crear-equipo"
            element={
              <AdminRoute>
                <CrearEquipoPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/crear-grupo"
            element={
              <AdminRoute>
                <CrearGrupoPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/crear-partido"
            element={
              <AdminRoute>
                <CrearPartidoPage />
              </AdminRoute>
            }
          />
          
          {/* Rutas para Usuarios */}
          <Route
            path="/admin/inscribir-usuario"
            element={
              <AdminRoute>
                <InscribirUsuarioPage />
              </AdminRoute>
            }
          />
          
          {/* Rutas para Resultados */}
          <Route
            path="/admin/resultados"
            element={
              <AdminRoute>
                <SeleccionarQuinielaResultados />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/quinielas/:id/resultados"
            element={
              <AdminRoute>
                <ResultadosPage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;