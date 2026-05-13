import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaInstagram, FaFacebook, FaTiktok, FaLinkedin } from "react-icons/fa";
import {
  UserPlus,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronRight,
  User,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Info
} from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formData, setFormData] = useState({
    u_codigo: '',
    u_nombre: '',
    u_apellido: '',
    u_correo: '',
    u_password: '',
    confirmPassword: '',
  });

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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'u_password') {
      let strength = 0;
      if (value.length >= 6) strength++;
      if (value.match(/[a-z]/) && value.match(/[A-Z]/)) strength++;
      if (value.match(/[0-9]/)) strength++;
      if (value.match(/[^a-zA-Z0-9]/)) strength++;
      setPasswordStrength(strength);
    }
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'Muy débil';
    if (passwordStrength === 1) return 'Débil';
    if (passwordStrength === 2) return 'Media';
    if (passwordStrength === 3) return 'Fuerte';
    if (passwordStrength === 4) return 'Muy fuerte';
    return '';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-red-500';
    if (passwordStrength === 1) return 'bg-orange-500';
    if (passwordStrength === 2) return 'bg-yellow-500';
    if (passwordStrength === 3) return 'bg-green-500';
    if (passwordStrength === 4) return 'bg-emerald-500';
    return 'bg-gray-200';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.u_password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.u_codigo.length !== 5) {
      toast.error('El código de usuario debe tener exactamente 5 caracteres');
      return;
    }

    if (formData.u_password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      toast.success('✅ ¡Registro exitoso! Ahora puedes iniciar sesión');
      toast('📌 Recuerda: Un administrador debe inscribirte en una quiniela', {
        duration: 5000,
        icon: '💡',
      });
      navigate('/login');
    } catch (error) {
      let mensaje = error.response?.data?.mensaje || 'Error al registrar usuario';
      if (error.response?.status === 400) {
        mensaje = 'El código o correo ya está registrado. Intenta con otro.';
      }
      toast.error(mensaje);
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
        {/* Panel izquierdo - Mismo que Login */}
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
              Registro seguro y rápido
            </p>

            <p className="mt-5 text-base xl:text-lg text-slate-300 leading-relaxed">
              Crea tu cuenta y comienza a participar en las mejores quinielas. 
              Predice resultados, compite con amigos y sube en el ranking.
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

        {/* Panel derecho - Formulario de registro */}
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
              <div className="mb-6 text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </Link>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                  Crear cuenta
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Completa tus datos para comenzar
                </p>
              </div>

              {/* Tarjeta informativa */}
              <div className="mb-5 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-indigo-800 font-medium">¿Qué pasa después?</p>
                    <p className="text-xs text-indigo-600 mt-0.5">
                      Un administrador te inscribirá en una quiniela. Luego podrás hacer tus pronósticos.
                    </p>
                  </div>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Código de usuario */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Código de usuario
                  </label>
                  <input
                    name="u_codigo"
                    type="text"
                    required
                    maxLength={5}
                    value={formData.u_codigo}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Ej: U0001"
                  />
                  <p className="mt-1 text-xs text-slate-400">5 caracteres · Identificador único</p>
                </div>

                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Nombre
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        name="u_nombre"
                        type="text"
                        required
                        value={formData.u_nombre}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        placeholder="Nombre"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Apellido
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        name="u_apellido"
                        type="text"
                        required
                        value={formData.u_apellido}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        placeholder="Apellido"
                      />
                    </div>
                  </div>
                </div>

                {/* Correo */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      name="u_correo"
                      type="email"
                      required
                      value={formData.u_correo}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      name="u_password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.u_password}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-12 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.u_password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`} style={{ width: `${(passwordStrength / 4) * 100}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-500">{getPasswordStrengthText()}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Confirmar contraseña
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-12 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      placeholder="Repite tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.u_password !== formData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Las contraseñas no coinciden
                    </p>
                  )}
                  {formData.confirmPassword && formData.u_password === formData.confirmPassword && formData.u_password && (
                    <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Las contraseñas coinciden
                    </p>
                  )}
                </div>

                {/* Botón de registro */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-700/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Registrarse
                      <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                {/* Link a login */}
                <div className="pt-2 text-center">
                  <p className="text-sm text-slate-600">
                    ¿Ya tienes cuenta?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Inicia sesión aquí
                    </Link>
                  </p>
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
    </div>
  );
};

export default Register;