// components/onboarding/DriverTour.jsx
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

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
  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      if (step.target) {
        const element = document.getElementById(step.target);
        if (element) {
          const rect = element.getBoundingClientRect();
          setTargetRect({ top: rect.top + window.scrollY, left: rect.left + window.scrollX, width: rect.width, height: rect.height, bottom: rect.bottom + window.scrollY });
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else setTargetRect(null);
      } else setTargetRect(null);
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, step.target]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else handleComplete();
  };
  const handlePrev = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };
  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('driver_tour_completed', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    onComplete?.();
  };
  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('driver_tour_completed', 'true');
    localStorage.setItem('onboarding_completed', 'true');
    onComplete?.();
  };

  if (!isVisible) return null;

  const tooltipStyle = targetRect ? {
    top: targetRect.bottom + 15,
    left: window.innerWidth / 2,
    transform: 'translateX(-50%)'
  } : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <>
      <div className="fixed inset-0 z-50">
        {targetRect ? (
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'auto' }}>
            <defs><mask id="hole-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect x={targetRect.left} y={targetRect.top} width={targetRect.width} height={targetRect.height} rx="12" fill="black" />
            </mask></defs>
            <rect width="100%" height="100%" fill="black" fillOpacity="0.7" mask="url(#hole-mask)" onClick={handleSkip} />
            <rect x={targetRect.left - 4} y={targetRect.top - 4} width={targetRect.width + 8} height={targetRect.height + 8} rx="14" fill="none" stroke="#4f46e5" strokeWidth="3" className="animate-pulse" />
          </svg>
        ) : (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleSkip} />
        )}
      </div>

      <div className="fixed z-50 bg-white rounded-2xl shadow-2xl transition-all w-[calc(100%-32px)] max-w-sm sm:w-80 md:w-96" style={tooltipStyle}>
        <div className="h-1.5 bg-gray-100 rounded-t-2xl overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Paso {currentStep + 1} de {steps.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSkip} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg">Omitir</button>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="text-center mb-3">
            <span className="text-4xl sm:text-5xl block mb-2">{step.title.split(' ')[0]}</span>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.description}</p>
          </div>
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
          <div className="flex justify-center gap-1.5 mt-4">
            {steps.map((_, idx) => (
              <div key={idx} className={`h-1.5 rounded-full transition-all cursor-pointer ${idx === currentStep ? 'w-6 bg-indigo-600' : idx < currentStep ? 'w-1.5 bg-indigo-300' : 'w-1.5 bg-gray-300'}`} onClick={() => setCurrentStep(idx)} />
            ))}
          </div>
        </div>
        <div className="flex gap-3 p-3 sm:p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {currentStep > 0 && (
            <button onClick={handlePrev} className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition flex items-center justify-center gap-1 sm:gap-2">
              <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Anterior</span>
            </button>
          )}
          <button onClick={handleNext} className={`flex-1 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-white font-medium transition flex items-center justify-center gap-1 sm:gap-2 ${currentStep === steps.length - 1 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
            {currentStep === steps.length - 1 ? <>Comenzar <Check className="h-4 w-4" /></> : <>Siguiente <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </div>

      {targetRect && !isMobile && (
        <div className="fixed z-50 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-white animate-pulse" style={{ top: targetRect.bottom + 8, left: targetRect.left + targetRect.width / 2 - 10 }} />
      )}
    </>
  );
};