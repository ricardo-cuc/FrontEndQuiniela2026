// components/onboarding/OnboardingTour.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, ChevronRight, ChevronLeft, Check, 
  Trophy, Users, PenTool, Bell, Wifi, 
  MessageCircle, Smile, Star, Award,
  ArrowRight, ArrowLeft, Sparkles, Zap
} from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: '🎉 ¡Bienvenido a Quiniela Lucalza!',
    description: 'Descubre una nueva forma de disfrutar el fútbol, prediciendo resultados y compitiendo con amigos en tiempo real.',
    icon: '🎯',
    target: null,
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'mis-quinielas',
    title: '📋 Tus Quinielas',
    description: 'Aquí encontrarás todas las quinielas en las que participas. Cada quiniela tiene sus propios partidos, reglas y ranking.',
    icon: '📋',
    target: 'mis-quinielas-link',
    gradient: 'from-blue-500 to-indigo-500',
    actionText: 'Ver mis quinielas',
    tip: '💡 ¿No ves ninguna quiniela? Contacta al administrador para que te inscriba.'
  },
  {
    id: 'pronosticos',
    title: '⚽ Haz tus Pronósticos',
    description: 'Selecciona una quiniela y predice los resultados. Ingresa los goles que crees que marcará cada equipo.',
    icon: '⚽',
    target: 'quinielas-link',
    gradient: 'from-green-500 to-emerald-500',
    actionText: 'Ir a pronósticos',
    tip: '💡 Los pronósticos solo se pueden hacer antes de que el partido comience.'
  },
  {
    id: 'participantes-chat',
    title: '💬 Participantes y Chat',
    description: '¡Conoce a los demás participantes! Puedes ver quién está en tu quiniela, enviar mensajes y reaccionar con emojis.',
    icon: '💬',
    target: 'participantes-link',
    gradient: 'from-pink-500 to-rose-500',
    actionText: 'Explorar chat',
    tip: '💡 Usa los emojis 👍, ❤️, 😂, 🎉 y más para reaccionar a los mensajes de otros.'
  },
  {
    id: 'tiempo-real',
    title: '🔄 Tiempo Real',
    description: 'Todo se actualiza automáticamente. Los resultados y mensajes nuevos aparecen al instante sin necesidad de recargar.',
    icon: '🔄',
    target: null,
    gradient: 'from-cyan-500 to-blue-500',
    tip: '💡 El ícono de WiFi en la esquina te indica si estás conectado en tiempo real.'
  },
  {
    id: 'ranking',
    title: '🏆 Ranking en Vivo',
    description: 'Sigue tu posición en cada quiniela. Compite con otros usuarios y sube posiciones con cada acierto.',
    icon: '🏆',
    target: 'ranking-link',
    gradient: 'from-yellow-500 to-amber-500',
    actionText: 'Ver ranking',
    tip: '💡 Mientras más aciertes, más puntos acumulas y más subes en el ranking.'
  },
  {
    id: 'notificaciones',
    title: '🔔 Notificaciones',
    description: 'Recibe alertas cuando haya resultados nuevos, cambios en el ranking o mensajes en el chat.',
    icon: '🔔',
    target: null,
    gradient: 'from-orange-500 to-red-500',
    tip: '💡 Activa las notificaciones para no perderte nada importante.'
  },
  {
    id: 'completado',
    title: '🎉 ¡Listo para comenzar!',
    description: 'Ya conoces todas las funciones. ¡Empieza a disfrutar de Quiniela Lucalza y demuestra quién es el mejor pronosticador!',
    icon: '⭐',
    target: null,
    gradient: 'from-purple-500 to-pink-500'
  }
];

export const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [targetElement, setTargetElement] = useState(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Posicionar tooltip al lado del elemento objetivo
  useEffect(() => {
    if (step.target) {
      const element = document.getElementById(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetElement(element);
        setTooltipPosition({
          top: rect.top + window.scrollY - 140,
          left: rect.left + window.scrollX + rect.width / 2
        });
      }
    }
  }, [currentStep, step.target]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrev = () => {
    if (isAnimating || currentStep === 0) return;
    setIsAnimating(true);
    setCurrentStep(currentStep - 1);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleAction = () => {
    if (step.target) {
      const element = document.getElementById(step.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.click();
        // Avanzar automáticamente después de la acción
        setTimeout(() => {
          handleNext();
        }, 2000);
      } else {
        handleNext();
      }
    } else {
      handleNext();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('interactive_tour_completed', 'true');
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('interactive_tour_completed', 'true');
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay con efecto blur y gradiente */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={handleSkip} />
      
      {/* Resaltado del elemento objetivo */}
      {targetElement && (
        <div
          className="fixed z-50 rounded-xl pointer-events-none transition-all duration-300"
          style={{
            top: targetElement.getBoundingClientRect().top + window.scrollY - 8,
            left: targetElement.getBoundingClientRect().left + window.scrollX - 8,
            width: targetElement.offsetWidth + 16,
            height: targetElement.offsetHeight + 16,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5), 0 0 0 3px rgba(99,102,241,0.8), 0 0 0 6px rgba(99,102,241,0.3)',
            borderRadius: '16px',
            transition: 'all 0.3s ease'
          }}
        />
      )}

      {/* Tarjeta del tour */}
      <div 
        className={`fixed z-50 bg-white rounded-2xl shadow-2xl max-w-md w-full transition-all duration-300 ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        style={{
          ...(step.target && tooltipPosition.left ? {
            top: tooltipPosition.top,
            left: '50%',
            transform: 'translateX(-50%)'
          } : {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          })
        }}
      >
        {/* Progress bar con gradiente */}
        <div className="h-1.5 bg-gray-100 rounded-t-2xl overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${step.gradient || 'from-indigo-500 to-purple-500'} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              Paso {currentStep + 1} de {steps.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              Omitir
            </button>
            <button 
              onClick={handleSkip} 
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-5">
            <div className={`relative inline-block mb-4`}>
              <div className={`absolute inset-0 bg-gradient-to-r ${step.gradient} rounded-full blur-xl opacity-30 animate-pulse`} />
              <span className="relative text-7xl block">{step.icon}</span>
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              {step.description}
            </p>
          </div>

          {/* Tips adicionales */}
          {step.tip && (
            <div className="mb-5 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">{step.tip}</p>
              </div>
            </div>
          )}

          {/* Demo visual del chat */}
          {step.id === 'participantes-chat' && (
            <div className="mb-5 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                  U
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-pink-600">Usuario Ejemplo</p>
                  <p className="text-xs text-gray-400">Hace un momento</p>
                </div>
                <div className="flex gap-1">
                  <span className="text-sm">👍</span>
                  <span className="text-sm">❤️</span>
                  <span className="text-sm">😂</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 ml-10">¡Qué emoción el partido de hoy! ⚽🔥</p>
              <div className="flex gap-2 mt-2 ml-10">
                <span className="text-xs bg-white/50 rounded-full px-2 py-0.5">👍 3</span>
                <span className="text-xs bg-white/50 rounded-full px-2 py-0.5">❤️ 2</span>
                <span className="text-xs bg-white/50 rounded-full px-2 py-0.5">😂 1</span>
              </div>
            </div>
          )}

          {/* Demo de notificaciones */}
          {step.id === 'notificaciones' && (
            <div className="mb-5 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-xs font-semibold text-blue-700">¡Nuevo resultado!</p>
                  <p className="text-xs text-blue-600">México 2 - 0 Alemania</p>
                </div>
              </div>
            </div>
          )}

          {/* Indicadores de progreso */}
          <div className="flex justify-center gap-1.5 mt-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentStep 
                    ? `w-6 bg-gradient-to-r ${step.gradient}` 
                    : idx < currentStep 
                      ? 'w-1.5 bg-indigo-300' 
                      : 'w-1.5 bg-gray-300'
                }`}
                onClick={() => setCurrentStep(idx)}
              />
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition" />
              Anterior
            </button>
          )}
          {step.actionText ? (
            <button
              onClick={handleAction}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition flex items-center justify-center gap-2 group bg-gradient-to-r ${step.gradient} hover:opacity-90`}
            >
              {step.actionText}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition flex items-center justify-center gap-2 ${
                isLastStep
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90'
                  : `bg-gradient-to-r ${step.gradient} hover:opacity-90`
              }`}
            >
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4" />
                  Comenzar
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
};