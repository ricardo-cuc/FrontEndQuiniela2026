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

// Componente para rutas protegidas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// Componente para rutas de admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated() && isAdmin() ? children : <Navigate to="/" replace />;
};

// Layout privado con navbar y contenedor
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
        {/* Rutas públicas SIN layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <HomePage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quinielas"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <QuinielasPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quinielas/:id"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <QuinielaDetailPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/ranking/:id"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <RankingPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/mis-predicciones"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <MisPrediccionesPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/mis-quinielas"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <MisQuinielasPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/quinielas/:id/pronosticos"
          element={
            <PrivateRoute>
              <PrivateLayout>
                <PronosticosQuinielaPage />
              </PrivateLayout>
            </PrivateRoute>
          }
        />

        {/* Rutas admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <PrivateLayout>
                <AdminPage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/campeonatos"
          element={
            <AdminRoute>
              <PrivateLayout>
                <CampeonatosPage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/campeonatos/:c_campeonato"
          element={
            <AdminRoute>
              <PrivateLayout>
                <CampeonatoDetallePage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/campeonatos/:c_campeonato/quinielas"
          element={
            <AdminRoute>
              <PrivateLayout>
                <QuinielasPorCampeonatoPage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/crear-quiniela"
          element={
            <AdminRoute>
              <PrivateLayout>
                <CrearQuinielaPage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/quinielas/:id"
          element={
            <AdminRoute>
              <PrivateLayout>
                <QuinielaDetallePage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/crear-equipo"
          element={
            <AdminRoute>
              <PrivateLayout>
                <CrearEquipoPage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/crear-grupo"
          element={
            <AdminRoute>
              <PrivateLayout>
                <CrearGrupoPage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/crear-partido"
          element={
            <AdminRoute>
              <PrivateLayout>
                <CrearPartidoPage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/inscribir-usuario"
          element={
            <AdminRoute>
              <PrivateLayout>
                <InscribirUsuarioPage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/resultados"
          element={
            <AdminRoute>
              <PrivateLayout>
                <SeleccionarQuinielaResultados />
              </PrivateLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/quinielas/:id/resultados"
          element={
            <AdminRoute>
              <PrivateLayout>
                <ResultadosPage />
              </PrivateLayout>
            </AdminRoute>
          }
        />
      </Routes>

      <Toaster position="top-right" />
    </>
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