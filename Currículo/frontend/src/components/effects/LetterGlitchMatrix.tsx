'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LetterGlitchMatrixProps {
  opacity?: number;
  className?: string;
}

const CHARACTERS = '01TSJSAISQLAPIASWAZURESECCODEDATA{}</>λ01010101';
const PALETTE = ['#00f2ff', '#74f5ff', '#c0c1ff', '#3a494b', '#006a71'];

export const LetterGlitchMatrix: React.FC<LetterGlitchMatrixProps> = ({
  opacity = 0.1,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const fontSize = width < 768 ? 16 : 14;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () =>
      Math.floor(Math.random() * -50)
    );

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      for (let i = 0; i < columns; i++) {
        const text = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const x = i * fontSize;
        const y = ((i * 37) % (height - 40)) + 20;
        ctx.fillStyle = '#00f2ff22';
        ctx.fillText(text, x, y);
      }
    };

    if (reducedMotion) {
      drawStatic();
      return;
    }

    let lastTime = performance.now();
    const fpsInterval = 1000 / 30; // 30 FPS cap for energy saving

    const render = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(render);

      const elapsed = currentTime - lastTime;
      if (elapsed < fpsInterval) return;
      lastTime = currentTime - (elapsed % fpsInterval);

      ctx.fillStyle = 'rgba(13, 21, 21, 0.18)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const isHead = Math.random() > 0.85;
        ctx.fillStyle = isHead
          ? '#e1fdff'
          : PALETTE[Math.floor(Math.random() * PALETTE.length)];

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(animationFrameId);
      } else {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const currentDpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * currentDpr;
      canvas.height = height * currentDpr;
      ctx.scale(currentDpr, currentDpr);
      if (reducedMotion) {
        drawStatic();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [reducedMotion]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 print:hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Radial vignette mask to protect center reading area */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#0d1515_85%)]" />
    </div>
  );
};
