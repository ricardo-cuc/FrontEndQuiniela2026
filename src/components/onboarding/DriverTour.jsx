// components/onboarding/DriverTour.jsx
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: '🎉 ¡Bienvenido a Quiniela Lucalza!',
    description: 'Te mostraremos paso a paso cómo funciona todo. No te preocupes, es muy fácil.',
    target: null,
    position: 'center'
  },
  {
    id: 'mis-quinielas',
    title: '📋 Mis Quinielas',
    description: 'Aquí están todas las quinielas en las que participas. Cada quiniela tiene sus propios partidos, reglas y ranking.',
    target: 'mis-quinielas-link',
    position: 'bottom'
  },
  {
    id: 'mis-predicciones',
    title: '📝 Mis Predicciones',
    description: 'Aquí puedes ver todos los pronósticos que has realizado en cada quiniela. También ves cuántos puntos te dio cada predicción.',
    target: 'mis-predicciones-link',
    position: 'bottom',
    extraInfo: '💡 Puedes ver el historial completo de tus pronósticos y cuántos puntos te dio cada uno.'
  },
  {
    id: 'mis-aciertos',
    title: '🎯 Mis Aciertos',
    description: 'Muestra todos los partidos que acertaste correctamente. ¡Cada acierto suma puntos para tu ranking!',
    target: 'mis-aciertos-link',
    position: 'bottom',
    extraInfo: '💡 Acierta el resultado exacto (goles locales y visitantes) para ganar más puntos.'
  },
  {
    id: 'mi-puntuacion',
    title: '⭐ Mi Puntuación',
    description: 'Total de puntos acumulados en todas las quinielas. ¡Entre más puntos tengas, mejor posición en el ranking!',
    target: 'mi-puntuacion-link',
    position: 'bottom',
    extraInfo: '💡 Los puntos se calculan según tus aciertos. Cada quiniela puede tener su propio sistema de puntuación.'
  },
  {
    id: 'participantes-chat',
    title: '💬 Participantes y Chat',
    description: '¡Nueva función! Aquí puedes ver quién más participa, enviar mensajes y reaccionar con emojis.',
    target: 'participantes-link',
    position: 'bottom',
    extraInfo: '💡 Puedes reaccionar con 👍, ❤️, 😂, 🎉, ⚽, 🏆 y más. Los mensajes son en tiempo real.'
  },
  {
    id: 'ranking',
    title: '🏆 Ranking',
    description: 'Puedes ver tu posición en cada quiniela y competir con otros usuarios. ¡Sube posiciones con cada acierto!',
    target: 'ranking-link',
    position: 'bottom',
    extraInfo: '💡 Mientras más puntos acumules, más subes en el ranking.'
  },
  {
    id: 'completado',
    title: '🎉 ¡Listo para comenzar!',
    description: 'Ya conoces todas las funciones principales. ¡Empieza a disfrutar y demuestra quién es el mejor pronosticador!',
    target: null,
    position: 'center'
  }
];

export const DriverTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const [isMobile, setIsMobile] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Obtener y actualizar posición del elemento objetivo
  useEffect(() => {
    const updatePosition = () => {
      if (step.target) {
        const element = document.getElementById(step.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          const scrollTop = window.scrollY || document.documentElement.scrollTop;
          const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
          
          setTargetRect({
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom + scrollTop,
            right: rect.right + scrollLeft,
            clientTop: rect.top,
            clientLeft: rect.left
          });

          // Calcular posición del tooltip según el dispositivo
          let newPosition = {};
          
          if (isMobile) {
            newPosition = {
              top: rect.bottom + scrollTop + 15,
              left: scrollLeft + window.innerWidth / 2,
              transform: 'translateX(-50%)'
            };
          } else {
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            if (spaceBelow > 300) {
              newPosition = {
                top: rect.bottom + scrollTop + 15,
                left: rect.left + scrollLeft + rect.width / 2,
                transform: 'translateX(-50%)'
              };
            } else if (spaceAbove > 300) {
              newPosition = {
                top: rect.top + scrollTop - 15,
                left: rect.left + scrollLeft + rect.width / 2,
                transform: 'translateX(-50%) translateY(-100%)'
              };
            } else {
              newPosition = {
                top: rect.bottom + scrollTop + 15,
                left: scrollLeft + window.innerWidth / 2,
                transform: 'translateX(-50%)'
              };
            }
          }
          
          setTooltipPosition(newPosition);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          setTargetRect(null);
          setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
        }
      } else {
        setTargetRect(null);
        setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, step.target, isMobile]);

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

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('driver_tour_completed', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('driver_tour_completed', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay oscuro */}
      <div className="fixed inset-0 z-50">
        {targetRect ? (
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'auto' }}>
            <defs>
              <mask id="hole-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left}
                  y={targetRect.top}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="12"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="black"
              fillOpacity="0.7"
              mask="url(#hole-mask)"
              onClick={handleSkip}
            />
            <rect
              x={targetRect.left - 4}
              y={targetRect.top - 4}
              width={targetRect.width + 8}
              height={targetRect.height + 8}
              rx="14"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3"
              className="animate-pulse"
            />
          </svg>
        ) : (
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
            onClick={handleSkip}
          />
        )}
      </div>

      {/* Tooltip flotante */}
      <div 
        className={`fixed z-50 bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
          isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        } ${isMobile ? 'w-[calc(100%-32px)] max-w-sm' : 'w-80 md:w-96'}`}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: tooltipPosition.transform,
          maxHeight: '80vh',
          overflow: 'auto'
        }}
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-t-2xl overflow-hidden sticky top-0">
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
        <div className="p-5">
          <div className="text-center mb-4">
            <span className="text-5xl block mb-3">{step.title.split(' ')[0]}</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
          </div>

          {/* Información adicional */}
          {step.extraInfo && (
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700">{step.extraInfo}</p>
            </div>
          )}

          {/* Demo visual del chat */}
          {step.id === 'participantes-chat' && (
            <div className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
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
                </div>
              </div>
              <p className="text-sm text-gray-700 ml-10">¡Qué emoción el partido de hoy! ⚽</p>
            </div>
          )}

          {/* Demo de puntuación */}
          {step.id === 'mi-puntuacion' && (
            <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Tus puntos totales</p>
                  <p className="text-2xl font-bold text-yellow-600">125 pts</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Posición en ranking</p>
                  <p className="text-2xl font-bold text-indigo-600">#3</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition flex items-center justify-center gap-2 ${
              isLastStep
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90'
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
        </div>
      </div>

      {/* Flecha que apunta al elemento - solo en desktop */}
      {targetRect && !isMobile && (
        <div 
          className="fixed z-50 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-white animate-pulse"
          style={{
            top: targetRect.bottom + 5,
            left: targetRect.left + targetRect.width / 2 - 10,
            transform: 'rotate(0deg)'
          }}
        />
      )}
    </>
  );
};