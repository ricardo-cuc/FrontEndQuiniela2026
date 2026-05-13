import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Shield } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const userMenuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Controlar visibilidad del navbar al hacer scroll
  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Mostrar loading mientras se verifica autenticación
  if (loading) {
    return (
      <nav className="bg-indigo-600 text-white shadow-lg fixed top-0 left-0 right-0 z-50 h-16">
        <div className="container mx-auto px-4 flex items-center justify-center h-full">
          <div className="animate-pulse">Cargando...</div>
        </div>
      </nav>
    );
  }

  // ✅ Si no hay usuario, no mostrar nada (las rutas protegidas redirigirán)
  if (!user) return null;

  return (
    <>
      <nav className={`
        bg-indigo-600 text-white shadow-lg 
        fixed top-0 left-0 right-0 z-50
        transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo - Responsive */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <img 
                src="/logo.png"
                alt="Lucalza"
                className="h-8 w-auto"
              />
              <span className="hidden sm:inline-block text-lg md:text-xl font-bold">
                Quiniela Lucalza
              </span>
            </Link>

            {/* Menú de administrador - solo visible para admins en desktop */}
            {isAdmin && (
              <div className="hidden md:flex items-center space-x-4">
                <Link 
                  to="/admin" 
                  className="flex items-center space-x-1 hover:text-indigo-200 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </div>
            )}

            {/* Menú de usuario */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center justify-center p-2 rounded-full hover:bg-indigo-500 transition-colors"
                title="Mi cuenta"
              >
                <User className="h-5 w-5" />
              </button>

              {/* Menú desplegable */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.U_NOMBRE} {user.U_APELLIDO}
                    </p>
                    {/* ✅ SOLO mostrar email si existe y no es null/undefined */}
                    {user.U_EMAIL && user.U_EMAIL !== 'null' && user.U_EMAIL !== 'undefined' && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {user.U_EMAIL}
                      </p>
                    )}
                  </div>
                  <div className="py-1">
                    {/* Panel de administrador - solo visible para admins */}
                    {isAdmin && (
                      <>
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4" />
                            <span>Panel de Administrador</span>
                          </div>
                        </Link>
                        <div className="border-t border-gray-200"></div>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Espaciador */}
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;