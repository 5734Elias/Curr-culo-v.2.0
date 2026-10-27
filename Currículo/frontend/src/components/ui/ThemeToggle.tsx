'use client';

import React, { useSyncExternalStore } from 'react';
import { Sun, Moon } from 'lucide-react';

function getThemeSnapshot(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

function getServerSnapshot(): 'dark' | 'light' {
  return 'dark';
}

function subscribeTheme(callback: () => void) {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'class') {
        callback();
      }
    }
  });

  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  return () => observer.disconnect();
}

const emptySubscribe = () => () => {};

export const ThemeToggle: React.FC = () => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerSnapshot);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Ignora erro se localStorage estiver indisponível
    }
    document.documentElement.classList.toggle('light', next === 'light');
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  if (!isClient) {
    return (
      <div
        className="w-8 h-8 rounded-[0.25rem] border border-[#3a494b] bg-transparent opacity-0"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={theme === 'dark' ? 'Alternar para Tema Claro' : 'Alternar para Tema Escuro'}
      className="p-2 rounded-[0.25rem] text-[#b9cacb] hover:text-[#00f2ff] hover:bg-[#192122] border border-transparent hover:border-[#3a494b] transition-colors focus-visible:outline-2 focus-visible:outline-[#00f2ff] cursor-pointer"
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[#ffe173]" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-[#3131c0]" aria-hidden="true" />
      )}
    </button>
  );
};
