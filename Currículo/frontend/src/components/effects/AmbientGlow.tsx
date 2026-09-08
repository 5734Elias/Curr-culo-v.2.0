'use client';

import React from 'react';

interface AmbientGlowProps {
  color?: 'cyan' | 'indigo' | 'dual';
  position?: 'top-right' | 'top-left' | 'center' | 'bottom-right';
  className?: string;
}

export const AmbientGlow: React.FC<AmbientGlowProps> = ({
  color = 'cyan',
  position = 'top-right',
  className = '',
}) => {
  const positionClasses = {
    'top-right': '-top-20 -right-20',
    'top-left': '-top-20 -left-20',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'bottom-right': '-bottom-20 -right-20',
  };

  const colorGradients = {
    cyan: 'from-[#00f2ff]/20 to-transparent',
    indigo: 'from-[#c0c1ff]/20 to-transparent',
    dual: 'from-[#00f2ff]/15 via-[#3131c0]/15 to-transparent',
  };

  return (
    <div
      aria-hidden="true"
      className={`absolute w-96 h-96 rounded-full bg-gradient-to-br ${colorGradients[color]} blur-3xl pointer-events-none z-0 print:hidden ${positionClasses[position]} ${className}`}
    />
  );
};
