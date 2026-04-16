import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    u_correo: '',
    u_password: '',
  });

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

      toast.success('Login exitoso');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
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

            <h2 className="text-4xl xl:text-5xl font-bold leading-tight text-white">
              Vive la emoción de tu quiniela con una experiencia más profesional.
            </h2>

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
                {/* Correo */}
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

                {/* Contraseña */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="u_password"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Contraseña
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
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

                {/* Opciones */}
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

                {/* Botón */}
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

                {/* Registro */}
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
              </form>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
              Quiniela Lucalza · Mundial 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;