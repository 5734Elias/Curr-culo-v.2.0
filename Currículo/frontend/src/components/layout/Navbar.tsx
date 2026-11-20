'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const PRIMARY_NAV_ITEMS = [
  { label: 'Início', href: '/' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Projetos', href: '/projetos' },
  { label: 'Currículo', href: '/curriculo' },
  { label: 'Contato', href: '/contato' },
];

const SECONDARY_NAV_ITEMS = [
  { label: 'Experiência', href: '/experiencia' },
  { label: 'Competências', href: '/competencias' },
  { label: 'Formação', href: '/formacao' },
];

const ALL_NAV_ITEMS = [
  { label: 'Início', href: '/' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'Experiência', href: '/experiencia' },
  { label: 'Projetos', href: '/projetos' },
  { label: 'Competências', href: '/competencias' },
  { label: 'Formação', href: '/formacao' },
  { label: 'Currículo', href: '/curriculo' },
  { label: 'Contato', href: '/contato' },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const isSecondaryActive = SECONDARY_NAV_ITEMS.some((item) => pathname === item.href);

  useEffect(() => {
    if (!moreMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMoreMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [moreMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && mobileMenuRef.current) {
        const focusables = Array.from(
          mobileMenuRef.current.querySelectorAll<HTMLElement>('a, button')
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#3a494b]/50 bg-[#0d1515]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Identidade Editorial */}
        <Link
          href="/"
          className="flex items-center gap-3 group min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#00f2ff]"
        >
          <span className="w-9 h-9 rounded-[0.375rem] bg-[#161f21] border border-[#3a494b]/80 flex items-center justify-center text-xs font-semibold tracking-wider text-[#00f2ff] group-hover:border-[#00f2ff]/60 transition-colors">
            ER
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-[#dce4e4] group-hover:text-[#00f2ff] transition-colors">
              Elias Ribeiro dos Reis
            </span>
            <span className="text-[11px] text-[#b9cacb]">
              Engenharia de Software &amp; Arquitetura
            </span>
          </div>
        </Link>

        {/* Navegação Desktop Simplificada */}
        <nav aria-label="Navegação Principal" className="hidden lg:flex items-center gap-1.5">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'px-3.5 py-2 min-h-[44px] inline-flex items-center rounded-[0.375rem] text-sm font-medium transition-colors',
                  isActive
                    ? 'text-[#00f2ff] bg-[#161f21] font-semibold'
                    : 'text-[#b9cacb] hover:text-[#dce4e4] hover:bg-[#161f21]/60'
                )}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Menu Secundário Agrupado */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((prev) => !prev)}
              aria-expanded={moreMenuOpen}
              aria-haspopup="menu"
              className={clsx(
                'px-3.5 py-2 min-h-[44px] inline-flex items-center gap-1.5 rounded-[0.375rem] text-sm font-medium transition-colors cursor-pointer',
                isSecondaryActive || moreMenuOpen
                  ? 'text-[#00f2ff] bg-[#161f21] font-semibold'
                  : 'text-[#b9cacb] hover:text-[#dce4e4] hover:bg-[#161f21]/60'
              )}
            >
              <span>Trajetória</span>
              <ChevronDown
                className={clsx('w-4 h-4 transition-transform', moreMenuOpen && 'rotate-180')}
                aria-hidden="true"
              />
            </button>

            {moreMenuOpen && (
              <div
                role="menu"
                aria-label="Trajetória e Qualificações"
                className="absolute right-0 mt-2 w-48 rounded-[0.375rem] bg-[#161f21] border border-[#3a494b]/70 shadow-xl py-1.5 z-50"
              >
                {SECONDARY_NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setMoreMenuOpen(false)}
                      className={clsx(
                        'flex items-center px-4 py-2.5 min-h-[44px] text-sm transition-colors',
                        isActive
                          ? 'text-[#00f2ff] bg-[#1c2628] font-semibold'
                          : 'text-[#b9cacb] hover:text-[#dce4e4] hover:bg-[#1c2628]/70'
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ml-2 pl-3 border-l border-[#3a494b]/50 flex items-center">
            <ThemeToggle />
          </div>
        </nav>

        {/* Ações Mobile: ThemeToggle + Botão Menu */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            ref={menuButtonRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center p-2 rounded-[0.375rem] text-[#b9cacb] hover:text-[#00f2ff] hover:bg-[#161f21] focus-visible:outline-2 focus-visible:outline-[#00f2ff]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu Móvel Acessível */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          role="dialog"
          aria-label="Menu móvel"
          aria-modal="true"
          className="lg:hidden border-b border-[#3a494b]/70 bg-[#12191b] px-4 pt-3 pb-6 space-y-1.5"
        >
          {ALL_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center px-4 py-2.5 min-h-[44px] rounded-[0.375rem] text-base font-medium transition-colors',
                  isActive
                    ? 'text-[#00f2ff] bg-[#161f21] font-semibold'
                    : 'text-[#b9cacb] hover:text-[#dce4e4] hover:bg-[#161f21]/70'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
