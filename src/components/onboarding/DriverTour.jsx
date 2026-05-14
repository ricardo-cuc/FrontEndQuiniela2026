// components/onboarding/DriverTour.jsx
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

const steps = [
  { id: 'welcome', title: '🎉 ¡Bienvenido!', description: 'Te guiaremos por las funciones principales. Puedes deslizar para ver más.', target: null, position: 'center' },
  { id: 'mis-quinielas', title: '📋 Mis Quinielas', description: 'Todas las quinielas donde participas.', target: 'mis-quinielas-link', position: 'bottom' },
  { id: 'mis-predicciones', title: '📝 Mis Predicciones', description: 'Historial de tus pronósticos y puntos.', target: 'mis-predicciones-link', position: 'bottom' },
  { id: 'mis-aciertos', title: '🎯 Mis Aciertos', description: 'Partidos que acertaste correctamente.', target: 'mis-aciertos-link', position: 'bottom' },
  { id: 'mi-puntuacion', title: '⭐ Mi Puntuación', description: 'Total de puntos acumulados.', target: 'mi-puntuacion-link', position: 'bottom' },
  { id: 'participantes-chat', title: '💬 Participantes', description: 'Chat en vivo y reacciones con emojis.', target: 'participantes-link', position: 'bottom' },
  { id: 'ranking', title: '🏆 Ranking', description: 'Tu posición en la quiniela.', target: 'ranking-link', position: 'bottom' },
  { id: 'completado', title: '🎉 ¡Listo!', description: 'Ya conoces todas las funciones. ¡Buena suerte!', target: null, position: 'center' }
];

export const DriverTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [targetRect, setTargetRect] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // En móvil, permitir scroll del body
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'auto';
        document.body.style.position = 'relative';
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.body.style.overflow = '';
      document.body.style.position = '';
    };
  }, []);

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

          // Posicionar tooltip
          let newTop, newLeft;
          
          if (isMobile) {
            // En móvil, tooltip debajo del elemento
            newTop = rect.bottom + scrollTop + 15;
            newLeft = scrollLeft + window.innerWidth / 2;
            setTooltipPosition({
              top: newTop,
              left: newLeft,
              transform: 'translateX(-50%)'
            });
            // Scroll al elemento
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // Desktop: tooltip al lado
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow > 300) {
              newTop = rect.bottom + scrollTop + 15;
              newLeft = rect.left + scrollLeft + rect.width / 2;
              setTooltipPosition({ top: newTop, left: newLeft, transform: 'translateX(-50%)' });
            } else {
              newTop = rect.top + scrollTop - 15;
              newLeft = rect.left + scrollLeft + rect.width / 2;
              setTooltipPosition({ top: newTop, left: newLeft, transform: 'translateX(-50%) translateY(-100%)' });
            }
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
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
    setIsVisible(false);
    document.body.style.overflow = '';
    document.body.style.position = '';
    localStorage.setItem('driver_tour_completed', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    document.body.style.overflow = '';
    document.body.style.position = '';
    localStorage.setItem('driver_tour_completed', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay - En móvil no bloquea el scroll */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        {targetRect ? (
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        )}
      </div>

      {/* Tooltip flotante - Permite interacción */}
      <div 
        className={`fixed z-50 bg-white rounded-2xl shadow-2xl transition-all ${
          isMobile ? 'w-[calc(100%-32px)] max-w-sm' : 'w-80 md:w-96'
        }`}
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
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 sticky top-1.5 bg-white">
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
        <div className="p-4 sm:p-5">
          <div className="text-center mb-3">
            <span className="text-4xl sm:text-5xl block mb-2">{step.title.split(' ')[0]}</span>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>

          {/* Demo visual del chat */}
          {step.id === 'participantes-chat' && (
            <div className="mt-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
                  U
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-pink-600">Usuario Ejemplo</p>
                </div>
                <div className="flex gap-1">
                  <span className="text-sm">👍</span>
                  <span className="text-sm">❤️</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 ml-10">¡Qué emoción el partido! ⚽</p>
            </div>
          )}

          {/* Demo de puntuación */}
          {step.id === 'mi-puntuacion' && (
            <div className="mt-3 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Tus puntos</p>
                  <p className="text-xl font-bold text-yellow-600">125 pts</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Posición</p>
                  <p className="text-xl font-bold text-indigo-600">#3</p>
                </div>
              </div>
            </div>
          )}

          {/* Indicadores de progreso - clickeables */}
          <div className="flex justify-center gap-1.5 mt-4">
            {steps.map((_, idx) => (
              <button
                key={idx}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentStep 
                    ? 'w-6 bg-indigo-600' 
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
        <div className="flex gap-3 p-3 sm:p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition flex items-center justify-center gap-1 sm:gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-white font-medium transition flex items-center justify-center gap-1 sm:gap-2 ${
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

      {/* Flecha apuntadora - solo desktop */}
      {targetRect && !isMobile && (
        <div 
          className="fixed z-50 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-white animate-pulse"
          style={{
            top: targetRect.bottom + 8,
            left: targetRect.left + targetRect.width / 2 - 10,
            transform: 'rotate(0deg)'
          }}
        />
      )}
    </>
  );
};