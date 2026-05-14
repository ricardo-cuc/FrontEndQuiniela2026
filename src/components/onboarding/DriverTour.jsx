// components/onboarding/DriverTour.jsx
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';

const steps = [
  { id: 'welcome', title: '🎉 ¡Bienvenido!', description: 'Conoce las principales funciones de la plataforma.', icon: '🎉' },
  { id: 'mis-quinielas', title: '📋 Mis Quinielas', description: 'Todas las quinielas donde participas.', icon: '📋' },
  { id: 'mis-predicciones', title: '📝 Mis Predicciones', description: 'Historial de tus pronósticos y puntos.', icon: '📝' },
  { id: 'mis-aciertos', title: '🎯 Mis Aciertos', description: 'Partidos que acertaste correctamente.', icon: '🎯' },
  { id: 'mi-puntuacion', title: '⭐ Mi Puntuación', description: 'Total de puntos acumulados.', icon: '⭐' },
  { id: 'participantes-chat', title: '💬 Participantes', description: 'Chat en vivo y reacciones con emojis.', icon: '💬', demo: true },
  { id: 'ranking', title: '🏆 Ranking', description: 'Tu posición en la quiniela.', icon: '🏆' },
  { id: 'completado', title: '🎉 ¡Listo!', description: '¡Empieza a disfrutar y gana muchos puntos!', icon: '🎉' }
];

export const DriverTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Resaltar la tarjeta actual
  useEffect(() => {
    // Limpiar resaltado anterior
    document.querySelectorAll('[id$="-link"]').forEach(el => {
      el.style.transition = 'all 0.3s ease';
      el.style.transform = '';
      el.style.boxShadow = '';
    });
    
    // Resaltar tarjeta actual
    if (step.id !== 'welcome' && step.id !== 'completado') {
      const element = document.getElementById(`${step.id}-link`);
      if (element) {
        element.style.transform = 'scale(1.02)';
        element.style.boxShadow = '0 10px 25px -5px rgba(79, 70, 229, 0.3), 0 8px 10px -6px rgba(79, 70, 229, 0.2)';
        element.style.zIndex = '10';
        
        // Scroll a la tarjeta
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Remover resaltado después de un tiempo (opcional)
        const timeout = setTimeout(() => {
          if (element) {
            element.style.transform = '';
            element.style.boxShadow = '';
          }
        }, 2000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [currentStep, step.id]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Limpiar resaltados
    document.querySelectorAll('[id$="-link"]').forEach(el => {
      el.style.transform = '';
      el.style.boxShadow = '';
    });
    setIsVisible(false);
    localStorage.setItem('driver_tour_completed', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    document.querySelectorAll('[id$="-link"]').forEach(el => {
      el.style.transform = '';
      el.style.boxShadow = '';
    });
    setIsVisible(false);
    localStorage.setItem('driver_tour_completed', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay semi-transparente */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
      
      {/* Tarjeta del tour - Siempre centrada y visible */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto animate-fade-in">
          
          {/* Progress bar */}
          <div className="h-1 bg-gray-100 rounded-t-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                {currentStep + 1} / {steps.length}
              </span>
            </div>
            <button 
              onClick={handleSkip}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg"
            >
              Omitir
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="text-center">
              <span className="text-6xl block mb-3">{step.icon}</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
            </div>

            {/* Demo del chat */}
            {step.demo && (
              <div className="mt-4 p-3 bg-pink-50 rounded-xl border border-pink-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-bold">U</div>
                  <div className="flex-1"><p className="text-xs font-semibold text-pink-600">Usuario Ejemplo</p></div>
                  <div className="flex gap-1"><span className="text-base">👍</span><span className="text-base">❤️</span></div>
                </div>
                <p className="text-sm text-gray-700 ml-10">¡Qué emoción el partido! ⚽</p>
              </div>
            )}

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mt-5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`transition-all duration-200 ${
                    idx === currentStep 
                      ? 'w-8 h-2 bg-indigo-600 rounded-full' 
                      : idx < currentStep 
                        ? 'w-2 h-2 bg-indigo-300 rounded-full' 
                        : 'w-2 h-2 bg-gray-300 rounded-full'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 active:bg-gray-200 transition flex items-center justify-center gap-2"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Anterior</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className={`flex-1 py-3 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2 ${
                isLastStep
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 active:opacity-80'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 active:opacity-80'
              }`}
            >
              {isLastStep ? (
                <>Comenzar <Check className="h-5 w-5" /></>
              ) : (
                <>Siguiente <ChevronRight className="h-5 w-5" /></>
              )}
            </button>
          </div>
          
          {/* Skip button for mobile */}
          {isMobile && (
            <button
              onClick={handleSkip}
              className="w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100"
            >
              Saltar el tour
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};