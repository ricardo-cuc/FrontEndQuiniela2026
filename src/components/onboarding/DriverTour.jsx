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
  const [isScrolling, setIsScrolling] = useState(false);
  const tooltipRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Función para hacer scroll suave y esperar a que termine
  const smoothScrollTo = (element, offset = 100) => {
    return new Promise((resolve) => {
      setIsScrolling(true);
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        resolve();
      }, 800);
    });
  };

  // Actualizar posición del elemento y tooltip
  useEffect(() => {
    const updatePosition = async () => {
      if (!step.target) {
        setTargetRect(null);
        setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
        return;
      }
      
      const element = document.getElementById(step.target);
      if (!element) return;
      
      // Scroll al elemento ANTES de calcular posición
      if (!isScrolling) {
        await smoothScrollTo(element, isMobile ? 80 : 120);
      }
      
      // Calcular posición después del scroll
      const rect = element.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
      
      setTargetRect({
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom + scrollTop,
        clientTop: rect.top,
        clientLeft: rect.left,
        clientBottom: rect.bottom,
        clientRight: rect.right
      });
      
      // Posicionar tooltip
      let newTop, newLeft;
      const tooltipHeight = tooltipRef.current?.offsetHeight || 320;
      
      if (isMobile) {
        // En móvil: tooltip debajo del elemento
        newTop = rect.bottom + scrollTop + 15;
        // Verificar si cabe debajo
        if (newTop + tooltipHeight > scrollTop + window.innerHeight - 20) {
          // Si no cabe, poner arriba
          newTop = rect.top + scrollTop - tooltipHeight - 15;
        }
        setTooltipPosition({
          top: newTop,
          left: scrollLeft + window.innerWidth / 2,
          transform: 'translateX(-50%)'
        });
      } else {
        // Desktop: tooltip a la derecha o izquierda según espacio
        const spaceRight = window.innerWidth - rect.right;
        const spaceLeft = rect.left;
        
        if (spaceRight > 360) {
          // Tooltip a la derecha
          newTop = rect.top + scrollTop + (rect.height / 2);
          setTooltipPosition({
            top: newTop,
            left: rect.right + scrollLeft + 15,
            transform: 'translateY(-50%)'
          });
        } else if (spaceLeft > 360) {
          // Tooltip a la izquierda
          newTop = rect.top + scrollTop + (rect.height / 2);
          setTooltipPosition({
            top: newTop,
            left: rect.left + scrollLeft - 15,
            transform: 'translateY(-50%) translateX(-100%)'
          });
        } else {
          // Tooltip debajo
          newTop = rect.bottom + scrollTop + 15;
          setTooltipPosition({
            top: newTop,
            left: rect.left + scrollLeft + (rect.width / 2),
            transform: 'translateX(-50%)'
          });
        }
      }
    };
    
    updatePosition();
    
    // Recalcular al hacer scroll o resize
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [currentStep, step.target, isMobile, isScrolling]);

  const handleNext = async () => {
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
      {/* Overlay */}
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
                  rx="16"
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="black" fillOpacity="0.75" mask="url(#hole-mask)" />
            <rect
              x={targetRect.left - 6}
              y={targetRect.top - 6}
              width={targetRect.width + 12}
              height={targetRect.height + 12}
              rx="20"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3"
              className="animate-pulse"
            />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
        )}
      </div>

      {/* Tooltip */}
      <div 
        ref={tooltipRef}
        className="fixed z-50 bg-white rounded-2xl shadow-2xl transition-all duration-200"
        style={{
          ...tooltipPosition,
          width: isMobile ? 'calc(100% - 32px)' : '360px',
          maxWidth: '400px',
          maxHeight: '80vh',
          overflow: 'auto'
        }}
      >
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <button onClick={handleSkip} className="text-xs text-gray-400 hover:text-gray-600">
            Omitir
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="text-center mb-4">
            <span className="text-6xl block mb-3">{step.title.split(' ')[0]}</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
          </div>

          {/* Demo del chat */}
          {step.id === 'participantes-chat' && (
            <div className="mt-4 p-3 bg-pink-50 rounded-xl border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-bold">U</div>
                <div className="flex-1"><p className="text-xs font-semibold text-pink-600">Usuario Ejemplo</p></div>
                <div className="flex gap-1"><span className="text-base">👍</span><span className="text-base">❤️</span></div>
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

        {/* Botones */}
        <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50">
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
      </div>

      {/* Flecha apuntadora (solo desktop) */}
      {targetRect && !isMobile && tooltipPosition.left && (
        <div 
          className="fixed z-45 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-white"
          style={{
            top: targetRect.bottom + 5,
            left: targetRect.left + targetRect.width / 2 - 10
          }}
        />
      )}

      <style>{`
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
};