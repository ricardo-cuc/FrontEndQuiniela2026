// components/help/FloatingHelpWidget.jsx
import React, { useState } from 'react';
import { HelpCircle, X, MessageCircle, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: '¿Cómo puedo participar en una quiniela?',
    answer: 'Un administrador debe inscribirte. Una vez inscrito, aparecerá en "Mis Quinielas".'
  },
  {
    question: '¿Cómo hago mis pronósticos?',
    answer: 'Ve a "Mis Quinielas", selecciona una quiniela y en cada partido ingresa los goles que crees que habrá.'
  },
  {
    question: '¿Hasta cuándo puedo hacer pronósticos?',
    answer: 'Puedes hacer pronósticos hasta que el partido comience. Después de eso, ya no se aceptan más predicciones.'
  },
  {
    question: '¿Cómo se calculan los puntos?',
    answer: 'Los puntos se calculan según tus aciertos. Aciertas el resultado exacto o te acercas, cada quiniela tiene su sistema.'
  },
  {
    question: '¿Qué significa el indicador de WiFi?',
    answer: 'Indica si estás conectado al servidor en tiempo real. Cuando está verde, los resultados se actualizan automáticamente.'
  }
];

export const FloatingHelpWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFaqs, setShowFaqs] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-40 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 hover:scale-110"
        title="Ayuda"
      >
        {isOpen ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
      </button>

      {/* Panel de ayuda */}
      {isOpen && (
        <div className="fixed bottom-28 right-4 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">¿Necesitas ayuda?</h3>
                <p className="text-xs text-indigo-200">Resolvemos tus dudas</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-4">
            {!showFaqs ? (
              // Opciones principales
              <div className="space-y-3">
                <button
                  onClick={() => setShowFaqs(true)}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">❓</span>
                    <div>
                      <p className="font-medium text-gray-900">Preguntas frecuentes</p>
                      <p className="text-xs text-gray-500">Respuestas rápidas</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition" />
                </button>

                <Link
                  to="/mis-quinielas"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div>
                      <p className="font-medium text-gray-900">Mis Quinielas</p>
                      <p className="text-xs text-gray-500">Ver mis quinielas activas</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition" />
                </Link>

                <button
                  onClick={() => {
                    window.open('https://wa.me/123456789?text=Necesito ayuda con Quiniela Lucalza', '_blank');
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-green-50 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="font-medium text-gray-900">Contactar soporte</p>
                      <p className="text-xs text-gray-500">Habla con un agente</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            ) : (
              // Lista de FAQs
              <div>
                <button
                  onClick={() => {
                    setShowFaqs(false);
                    setSelectedFaq(null);
                  }}
                  className="mb-3 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  ← Volver al menú
                </button>

                {!selectedFaq ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {faqs.map((faq, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedFaq(faq)}
                        className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition border border-gray-100"
                      >
                        <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{selectedFaq.question}</h4>
                    <p className="text-sm text-gray-600 mb-4">{selectedFaq.answer}</p>
                    <button
                      onClick={() => setSelectedFaq(null)}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      ← Ver más preguntas
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              ¿No encuentras lo que buscas? Contáctanos
            </p>
          </div>
        </div>
      )}
    </>
  );
};