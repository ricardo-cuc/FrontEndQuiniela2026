import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, Trophy, Calendar, User, LogOut, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold">
            Quiniela App
          </Link>

          <div className="flex space-x-4">
            <Link to="/" className="flex items-center space-x-1 hover:text-indigo-200">
              <Home className="h-4 w-4" />
              <span>Inicio</span>
            </Link>
            <Link to="/mis-quinielas" className="flex items-center space-x-1 hover:text-indigo-200">
              <Trophy className="h-4 w-4" />
              <span>Mis Quinielas</span>
            </Link>
            <Link to="/mis-predicciones" className="flex items-center space-x-1 hover:text-indigo-200">
              <Calendar className="h-4 w-4" />
              <span>Mis Predicciones</span>
            </Link>
            {isAdmin() && (  // ← Cambiado: isAdmin() como función
              <Link to="/admin" className="flex items-center space-x-1 hover:text-indigo-200">
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="h-4 w-4" />
              <span className="text-sm">{user.U_NOMBRE} {user.U_APELLIDO}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 hover:text-indigo-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;