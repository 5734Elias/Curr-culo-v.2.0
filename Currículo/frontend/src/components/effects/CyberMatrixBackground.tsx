'use client';

import React from 'react';
import { LetterGlitchMatrix } from './LetterGlitchMatrix';
import { ThreadsBackground } from './ThreadsBackground';
import { DotGridBackground } from './DotGridBackground';

export type BackgroundVariant = 'letter-glitch' | 'threads' | 'dot-grid';

interface CyberMatrixBackgroundProps {
  variant?: BackgroundVariant;
  opacity?: number;
}

export const CyberMatrixBackground: React.FC<CyberMatrixBackgroundProps> = ({
  variant = 'letter-glitch',
  opacity = 0.1,
}) => {
  switch (variant) {
    case 'threads':
      return <ThreadsBackground opacity={opacity} />;
    case 'dot-grid':
      return <DotGridBackground opacity={opacity} />;
    case 'letter-glitch':
    default:
      return <LetterGlitchMatrix opacity={opacity} />;
  }
};
