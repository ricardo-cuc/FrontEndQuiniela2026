// components/onboarding/DriverTour.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const steps = [
  { id: 'welcome', title: '🎉 ¡Bienvenido!', description: 'Te guiaremos por las funciones principales.', target: null, position: 'center' },
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
  const [tooltipPosition, setTooltipPosition] = useState({});
  const tooltipRef = useRef(null);
  
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        document.body.style.overflow = 'auto';
        document.body.style.position = 'relative';
      } else {
        document.body.style.overflow = '';
        document.body.style.position = '';
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
          if (isMobile) {
            // En móvil, tooltip debajo del elemento con margen
            let newTop = rect.bottom + scrollTop + 20;
            // Asegurar que no se salga de la pantalla
            const tooltipHeight = tooltipRef.current?.offsetHeight || 300;
            const maxTop = scrollTop + window.innerHeight - tooltipHeight - 20;
            if (newTop + tooltipHeight > scrollTop + window.innerHeight) {
              newTop = maxTop;
            }
            setTooltipPosition({
              top: newTop,
              left: scrollLeft + window.innerWidth / 2,
              transform: 'translateX(-50%)',
              bottom: 'auto'
            });
          } else {
            // Desktop: tooltip al lado
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow > 300) {
              setTooltipPosition({
                top: rect.bottom + scrollTop + 15,
                left: rect.left + scrollLeft + rect.width / 2,
                transform: 'translateX(-50%)'
              });
            } else {
              setTooltipPosition({
                top: rect.top + scrollTop - 15,
                left: rect.left + scrollLeft + rect.width / 2,
                transform: 'translateX(-50%) translateY(-100%)'
              });
            }
          }
          
          // Scroll suave al elemento
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTargetRect(null);
        setTooltipPosition({
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        });
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
      {/* Overlay - No bloquea el scroll */}
      <div className="fixed inset-0 z-40 pointer-events-none">
        {targetRect ? (
          <svg className="absolute inset-0 w-full h-full">
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
            <rect width="100%" height="100%" fill="black" fillOpacity="0.7" mask="url(#hole-mask)" />
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

      {/* Flecha apuntadora (solo cuando hay target) */}
      {targetRect && !isMobile && (
        <div 
          className="fixed z-45 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-white"
          style={{
            top: targetRect.bottom + 5,
            left: targetRect.left + targetRect.width / 2 - 10
          }}
        />
      )}

      {/* Tooltip flotante */}
      <div 
        ref={tooltipRef}
        className={`fixed z-45 bg-white rounded-2xl shadow-2xl transition-all ${
          isMobile ? 'w-[calc(100%-32px)] max-w-sm' : 'w-80 md:w-96'
        }`}
        style={{
          ...tooltipPosition,
          maxHeight: isMobile ? '60vh' : '80vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column'
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
        <div className="flex justify-between items-center p-3 border-b border-gray-100 sticky top-1.5 bg-white">
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
            Omitir tour
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1">
          <div className="text-center mb-4">
            <span className="text-5xl block mb-3">{step.title.split(' ')[0]}</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
          </div>

          {/* Demo visual */}
          {step.id === 'participantes-chat' && (
            <div className="mt-3 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">U</div>
                <div className="flex-1"><p className="text-xs font-semibold text-pink-600">Usuario Ejemplo</p></div>
                <div className="flex gap-1"><span className="text-sm">👍</span><span className="text-sm">❤️</span></div>
              </div>
              <p className="text-sm text-gray-700 ml-10">¡Qué emoción el partido! ⚽</p>
            </div>
          )}

          {/* Indicadores de progreso */}
          <div className="flex justify-center gap-2 mt-5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStep 
                    ? 'w-8 bg-indigo-600' 
                    : idx < currentStep 
                      ? 'w-2 bg-indigo-300' 
                      : 'w-2 bg-gray-300'
                }`}
                onClick={() => setCurrentStep(idx)}
              />
            ))}
          </div>
        </div>

        {/* Botones de navegación - Siempre visibles y grandes para móvil */}
        <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 py-3 sm:py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2 active:bg-gray-200"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Anterior</span>
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 py-3 sm:py-2.5 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2 ${
              isLastStep
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 active:opacity-80'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 active:opacity-80'
            }`}
          >
            <span>{isLastStep ? 'Comenzar' : 'Siguiente'}</span>
            {!isLastStep && <ChevronRight className="h-5 w-5" />}
            {isLastStep && <Check className="h-5 w-5" />}
          </button>
        </div>
        
        {/* Skip button adicional para móvil */}
        {isMobile && (
          <button
            onClick={handleSkip}
            className="py-2 text-center text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100 mt-1"
          >
            Saltar el tour
          </button>
        )}
      </div>
    </>
  );
};