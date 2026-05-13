// components/common/InfoTooltip.jsx
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export const InfoTooltip = ({ message, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="text-gray-400 hover:text-indigo-500 transition"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {isVisible && (
        <div className={`absolute z-50 ${positions[position]} w-48 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg pointer-events-none`}>
          {message}
          <div className={`absolute ${
            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-gray-900' :
            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900' :
            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-l-gray-900' :
            'right-full top-1/2 -translate-y-1/2 border-r-gray-900'
          } border-4 border-transparent`} />
        </div>
      )}
    </div>
  );
};