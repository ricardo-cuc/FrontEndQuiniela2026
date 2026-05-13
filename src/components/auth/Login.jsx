import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaInstagram, FaFacebook, FaTiktok, FaLinkedin } from "react-icons/fa";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronRight,
  HelpCircle,
  X,
  Info
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showAyudaModal, setShowAyudaModal] = useState(false);
  const [esPrimeraVez, setEsPrimeraVez] = useState(false);

  const [formData, setFormData] = useState({
    u_correo: '',
    u_password: '',
  });

  useEffect(() => {
    // Verificar si es la primera vez que ve el login
    const yaVio = localStorage.getItem('visto_login_ayuda');
    if (!yaVio) {
      setEsPrimeraVez(true);
    }
  }, []);

  const cerrarAyudaPermanente = () => {
    localStorage.setItem('visto_login_ayuda', 'true');
    setEsPrimeraVez(false);
  };

  const socialLinks = [
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/lucalzaguatemala/?hl=es-la',
      icon: FaInstagram,
      color: 'hover:bg-pink-600',
    },
    {
      name: 'Facebook',
      url: 'https://www.facebook.com/lucalzaguate/?locale=es_LA',
      icon: FaFacebook,
      color: 'hover:bg-blue-600',
    },
    {
      name: 'TikTok',
      url: 'https://www.tiktok.com/@grupolucalza',
      icon: FaTiktok,
      color: 'hover:bg-black',
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/company/grupo-lucalza/posts/?feedView=all',
      icon: FaLinkedin,
      color: 'hover:bg-blue-700',
    },
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.u_correo.trim() || !formData.u_password.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);

    try {
      await login({
        ...formData,
        rememberMe,
      });

      toast.success('¡Bienvenido de vuelta!');
      navigate('/');
    } catch (error) {
      console.error('Error detallado:', error);
      
      // ✅ Mensajes más amigables según el error
      let mensaje = 'Error al iniciar sesión';
      
      if (error.response?.status === 401) {
        mensaje = '❌ Correo o contraseña incorrectos. Por favor, inténtalo de nuevo.';
      } else if (error.response?.status === 404) {
        mensaje = '❌ Usuario no encontrado. ¿Necesitas registrarte?';
      } else if (error.response?.status === 500) {
        mensaje = '❌ Error del servidor. Intenta más tarde.';
      } else if (error.message === 'Network Error') {
        mensaje = '❌ Error de conexión. Verifica tu internet.';
      } else if (error.response?.data?.mensaje) {
        mensaje = error.response.data.mensaje;
      }
      
      toast.error(mensaje);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Modal de ayuda para nuevos usuarios */}
      {showAyudaModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-indigo-600" />
                ¿Cómo empezar?
              </h2>
              <button onClick={() => setShowAyudaModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-semibold text-green-700 flex items-center gap-2">
                  <span className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                  ¿No tienes cuenta? Regístrate
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Si es tu primera vez, haz clic en <strong>"Regístrate aquí"</strong> para crear tu perfil.
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-blue-700 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                  Inicia sesión
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Usa tu correo electrónico y contraseña para acceder a tu cuenta.
                </p>
              </div>

              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-purple-700 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  ¿Y después del login?
                </h3>
                <div className="mt-2 space-y-2 text-sm text-gray-600">
                  <p>✅ Una vez dentro, verás el panel principal</p>
                  <p>✅ Para participar, necesitas que un <strong>administrador te inscriba</strong> en una quiniela</p>
                  <p>✅ Si ya estás inscrito, ve a <strong>"Mis Quinielas"</strong> para hacer tus pronósticos</p>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  ¿Problemas para acceder?
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Contacta al administrador de la quiniela o al soporte técnico.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t p-4">
              <button
                onClick={() => setShowAyudaModal(false)}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium"
              >
                Entendido, ¡empecemos!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de bienvenida para primera vez */}
      {esPrimeraVez && (
        <div className="fixed top-4 left-4 right-4 z-40 max-w-md mx-auto md:left-auto md:right-4">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl shadow-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div className="flex-1">
                <p className="font-semibold">¡Bienvenido a Quiniela Lucalza!</p>
                <p className="text-sm opacity-95 mt-1">
                  ¿Es tu primera vez? Revisa la guía haciendo clic en el botón de ayuda.
                </p>
              </div>
              <button onClick={cerrarAyudaPermanente} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fondo decorativo */}
      <div className="absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%)]" />
      </div>

      <div className="relative z-10 min-h-screen grid lg:grid-cols-2">
        {/* Panel izquierdo */}
        <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 text-white">
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md shadow-xl">
              <div className="rounded-xl bg-white/10 p-2 backdrop-blur-md">
                <img
                  src="/logo.png"
                  alt="Lucalza"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Quiniela Lucalza</h1>
                <p className="text-sm text-slate-300">Predice, compite y gana</p>
              </div>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Acceso seguro a tu cuenta
            </p>

            <p className="mt-5 text-base xl:text-lg text-slate-300 leading-relaxed">
              Ingresa para administrar tus predicciones, revisar posiciones, competir con tus amigos
              y seguir cada partido de una forma simple y moderna.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <p className="text-sm text-slate-300">Predicciones</p>
                <p className="mt-1 text-2xl font-bold text-white">En tiempo real</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <p className="text-sm text-slate-300">Ranking</p>
                <p className="mt-1 text-2xl font-bold text-white">Competitivo</p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400 mb-3">Síguenos en redes</p>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative rounded-full bg-white/10 p-2.5 backdrop-blur-md transition-all duration-300 hover:scale-110 ${social.color}`}
                    title={social.name}
                  >
                    <social.icon className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                      {social.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="text-sm text-slate-400">
            Plataforma de quinielas · Mundial 2026
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            {/* Logo móvil */}
            <div className="mb-6 flex justify-center lg:hidden">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-md shadow-xl">
                <div className="rounded-xl bg-white/10 p-2 backdrop-blur-md">
                  <img
                    src="/logo.png"
                    alt="Lucalza"
                    className="h-7 w-auto object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-white">Quiniela Lucalza</h1>
                  <p className="text-xs text-slate-300">Predice y compite</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Bienvenido de nuevo
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Inicia sesión para continuar en tu cuenta
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="u_correo"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="u_correo"
                      name="u_correo"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.u_correo}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="u_password"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Contraseña
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="u_password"
                      name="u_password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={formData.u_password}
                      onChange={handleChange}
                      placeholder="Ingresa tu contraseña"
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-12 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe((prev) => !prev)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Recordarme
                  </label>
                  <span className="text-xs text-slate-400">
                    Acceso seguro
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-700 hover:shadow-indigo-700/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5" />
                      Iniciar sesión
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <p className="text-sm text-slate-600">
                    ¿No tienes cuenta?{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Regístrate aquí
                    </Link>
                  </p>
                </div>

                {/* Tarjeta informativa para nuevos usuarios */}
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700">
                        <strong>¿Necesitas ayuda?</strong> Después de registrarte, un administrador deberá 
                        inscribirte en una quiniela para que puedas participar.
                      </p>
                      <button
                        onClick={() => setShowAyudaModal(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-flex items-center gap-1"
                      >
                        <HelpCircle className="h-3 w-3" />
                        Ver guía completa
                      </button>
                    </div>
                  </div>
                </div>

                {/* Redes Sociales en móvil */}
                <div className="mt-6 pt-4 border-t border-slate-200 lg:hidden">
                  <p className="text-center text-sm text-slate-600 mb-3">Síguenos en redes</p>
                  <div className="flex justify-center gap-4">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded-full bg-slate-100 p-2.5 transition-all duration-300 hover:scale-110 ${social.color} hover:text-white`}
                        title={social.name}
                      >
                        <social.icon className="h-5 w-5 text-slate-700 transition-colors group-hover:text-white" />
                      </a>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
              Quiniela Lucalza · Lucalza
            </p>
          </div>
        </div>
      </div>

      {/* Botón de ayuda flotante */}
      <button
        onClick={() => setShowAyudaModal(true)}
        className="fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition z-30"
        title="Ayuda"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Login;