// components/onboarding/DriverTour.jsx
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, ArrowRight, ArrowLeft } from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: '🎉 ¡Bienvenido a Quiniela Lucalza!',
    description: 'Te mostraremos paso a paso cómo funciona todo. ¡No te preocupes, es muy fácil!',
    target: null,
    position: 'center'
  },
  {
    id: 'mis-quinielas',
    title: '📋 Mis Quinielas',
    description: 'Aquí están todas las quinielas en las que participas. Haz clic para ver los partidos y hacer tus pronósticos.',
    target: 'mis-quinielas-link',
    position: 'bottom',
    action: 'click',
    actionTarget: 'mis-quinielas-link'
  },
  {
    id: 'participantes-chat',
    title: '💬 Participantes y Chat',
    description: '¡Nueva función! Aquí puedes ver quién más participa, enviar mensajes y reaccionar con emojis.',
    target: 'participantes-link',
    position: 'bottom',
    action: 'click',
    actionTarget: 'participantes-link'
  },
  {
    id: 'ranking',
    title: '🏆 Ranking',
    description: 'Puedes ver tu posición en cada quiniela y competir con otros usuarios.',
    target: 'ranking-link',
    position: 'bottom',
    action: 'click',
    actionTarget: 'ranking-link'
  },
  {
    id: 'completado',
    title: '🎉 ¡Listo para comenzar!',
    description: 'Ya conoces las principales funciones. ¡Empieza a disfrutar y demuestra quién es el mejor pronosticador!',
    target: null,
    position: 'center'
  }
];

export const DriverTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [targetRect, setTargetRect] = useState(null);
  const [isHighlighting, setIsHighlighting] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Obtener posición del elemento objetivo
  useEffect(() => {
    if (step.target) {
      const element = document.getElementById(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom + window.scrollY,
          right: rect.right + window.scrollX
        });
        
        // Resaltar elemento
        setIsHighlighting(true);
        
        // Scroll suave al elemento
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
      setIsHighlighting(false);
    }
  }, [currentStep, step.target]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Si el paso tiene una acción, ejecutarla
      if (step.action === 'click' && step.actionTarget) {
        const element = document.getElementById(step.actionTarget);
        if (element) {
          element.click();
        }
      }
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

  // Calcular posición del tooltip
  const getTooltipPosition = () => {
    if (!targetRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const positions = {
      top: { top: targetRect.top - 20, left: targetRect.left + targetRect.width / 2, transform: 'translateX(-50%) translateY(-100%)' },
      bottom: { top: targetRect.bottom + 20, left: targetRect.left + targetRect.width / 2, transform: 'translateX(-50%)' },
      left: { top: targetRect.top + targetRect.height / 2, left: targetRect.left - 20, transform: 'translateX(-100%) translateY(-50%)' },
      right: { top: targetRect.top + targetRect.height / 2, left: targetRect.right + 20, transform: 'translateY(-50%)' }
    };

    const pos = positions[step.position] || positions.bottom;
    return { top: `${pos.top}px`, left: `${pos.left}px`, transform: pos.transform };
  };

  const tooltipStyle = getTooltipPosition();

  return (
    <>
      {/* Overlay oscuro con agujero para el elemento resaltado */}
      <div className="fixed inset-0 z-50">
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
              style={{ pointerEvents: 'auto' }}
              onClick={handleSkip}
            />
            {/* Borde de resaltado */}
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
            style={{ pointerEvents: 'auto' }}
            onClick={handleSkip}
          />
        )}
      </div>

      {/* Tooltip flotante */}
      <div 
        className="fixed z-50 bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in"
        style={tooltipStyle}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <button 
            onClick={handleSkip}
            className="text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1 rounded-lg hover:bg-gray-100"
          >
            Omitir tour
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-4">
            <span className="text-6xl block mb-3">{step.title.split(' ')[0]}</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Demo visual para el chat */}
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
                  <span className="text-sm">😂</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 ml-10">¡Qué emoción el partido de hoy! ⚽</p>
              <div className="flex gap-2 mt-2 ml-10">
                <span className="text-xs bg-white/50 rounded-full px-2 py-0.5">👍 3</span>
                <span className="text-xs bg-white/50 rounded-full px-2 py-0.5">❤️ 2</span>
              </div>
            </div>
          )}

          {/* Indicador de progreso */}
          <div className="flex justify-center gap-1.5 mt-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
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
        <div className="flex gap-3 p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition flex items-center justify-center gap-2 group"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 px-4 py-2 rounded-xl text-white font-medium transition flex items-center justify-center gap-2 ${
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
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Flecha que apunta al elemento */}
      {targetRect && (
        <div 
          className="fixed z-50 w-0 h-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-white animate-pulse"
          style={{
            ...(step.position === 'bottom' && {
              top: targetRect.bottom + 8,
              left: targetRect.left + targetRect.width / 2 - 12,
              transform: 'rotate(0deg)'
            }),
            ...(step.position === 'top' && {
              top: targetRect.top - 24,
              left: targetRect.left + targetRect.width / 2 - 12,
              transform: 'rotate(180deg)'
            }),
            ...(step.position === 'left' && {
              top: targetRect.top + targetRect.height / 2 - 8,
              left: targetRect.left - 24,
              transform: 'rotate(270deg)'
            }),
            ...(step.position === 'right' && {
              top: targetRect.top + targetRect.height / 2 - 8,
              left: targetRect.right + 8,
              transform: 'rotate(90deg)'
            })
          }}
        />
      )}

      <style>{`
        @keyframes fadeIn {
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
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};