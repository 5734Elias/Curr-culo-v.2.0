'use client';

import React from 'react';
import { Reveal } from './Reveal';

interface StaggerGroupProps {
  children: React.ReactNode[];
  staggerMs?: number;
  baseDelayMs?: number;
  className?: string;
}

export const StaggerGroup: React.FC<StaggerGroupProps> = ({
  children,
  staggerMs = 80,
  baseDelayMs = 0,
  className = '',
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <Reveal key={index} delayMs={baseDelayMs + index * staggerMs}>
          {child}
        </Reveal>
      ))}
    </div>
  );
};
