// components/onboarding/OnboardingTour.jsx
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Trophy, Users, PenTool, Bell, Wifi } from 'lucide-react';

const steps = [
  {
    id: 'welcome',
    title: '🎉 ¡Bienvenido a Quiniela Lucalza!',
    description: 'Te guiaremos por las principales funciones para que no te pierdas nada.',
    icon: '🎯',
    target: null
  },
  {
    id: 'mis-quinielas',
    title: '📋 Mis Quinielas',
    description: 'Aquí encontrarás todas las quinielas en las que participas. Si no ves ninguna, contacta al administrador para que te inscriba.',
    icon: '📋',
    target: 'mis-quinielas-link'
  },
  {
    id: 'pronosticos',
    title: '⚽ Hacer Pronósticos',
    description: 'Selecciona una quiniela y podrás predecir los resultados de cada partido. Solo tienes que ingresar los goles que crees que habrá.',
    icon: '⚽',
    target: 'quinielas-link'
  },
  {
    id: 'tiempo-real',
    title: '🔄 Tiempo Real',
    description: 'Los resultados se actualizan automáticamente cuando hay cambios. Verás el ícono de WiFi en la esquina cuando estés conectado.',
    icon: '🔄',
    target: null
  },
  {
    id: 'ranking',
    title: '🏆 Ranking',
    description: 'Puedes ver tu posición en cada quiniela y competir con otros usuarios por los primeros lugares.',
    icon: '🏆',
    target: 'ranking-link'
  },
  {
    id: 'puntos',
    title: '⭐ Sistema de Puntos',
    description: 'Cada acierto te da puntos. ¡Mientras más aciertes, más puntos acumulas y más subes en el ranking!',
    icon: '⭐',
    target: null
  }
];

export const OnboardingTour = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay oscuro con efecto blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleComplete} />
      
      {/* Tarjeta del tour */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 rounded-t-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <span className="text-xs text-gray-400">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <button onClick={handleComplete} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <span className="text-6xl block mb-4">{step.icon}</span>
            <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
            <p className="text-gray-600 mt-2 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Tips adicionales */}
          {step.id === 'pronosticos' && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-xs text-yellow-700">
                💡 <strong>Tip:</strong> Los pronósticos solo se pueden hacer antes de que comience el partido.
              </p>
            </div>
          )}

          {step.id === 'puntos' && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <p className="text-xs text-green-700">
                💡 <strong>Tip:</strong> Acierta el resultado exacto para ganar más puntos.
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-100">
          {currentStep > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 px-4 py-2 rounded-xl text-white font-medium transition flex items-center justify-center gap-1 ${
              currentStep < steps.length - 1
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {currentStep < steps.length - 1 ? (
              <>
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Comenzar
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};