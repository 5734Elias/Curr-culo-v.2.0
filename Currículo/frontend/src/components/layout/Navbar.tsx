'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Terminal, Shield, Code, Award, FileText, Send, User } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Terminal },
  { label: 'Sobre', href: '/sobre', icon: User },
  { label: 'Experiência', href: '/experiencia', icon: Shield },
  { label: 'Projetos', href: '/projetos', icon: Code },
  { label: 'Competências', href: '/competencias', icon: Terminal },
  { label: 'Formação', href: '/formacao', icon: Award },
  { label: 'Currículo', href: '/curriculo', icon: FileText },
  { label: 'Contato', href: '/contato', icon: Send },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

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
    <header className="sticky top-0 z-40 w-full border-b border-[#3a494b]/80 bg-[#0d1515]/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-[#00f2ff]"
        >
          <div className="w-8 h-8 rounded-[0.25rem] bg-[#00f2ff]/10 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff] group-hover:border-[#00f2ff] group-hover:shadow-[0_0_10px_rgba(0,242,255,0.3)] transition-all">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[#dce4e4] group-hover:text-[#00f2ff] transition-colors">
              Elias Ribeiro dos Reis
            </span>
            <span className="text-[10px] font-mono text-[#00f2ff] uppercase tracking-wider">
              System Architect & Dev
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav aria-label="Navegação Principal" className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'px-3 py-1.5 rounded-[0.25rem] text-xs font-medium transition-all relative flex items-center gap-1.5',
                  isActive
                    ? 'text-[#00f2ff] bg-[#00f2ff]/10 border border-[#00f2ff]/30 shadow-[0_0_10px_rgba(0,242,255,0.15)] font-semibold'
                    : 'text-[#b9cacb] hover:text-[#dce4e4] hover:bg-[#192122]'
                )}
              >
                <item.icon className={clsx('w-3.5 h-3.5', isActive ? 'text-[#00f2ff]' : 'text-[#849495]')} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          ref={menuButtonRef}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          className="lg:hidden p-2 rounded-[0.25rem] text-[#b9cacb] hover:text-[#00f2ff] hover:bg-[#192122] focus-visible:outline-2 focus-visible:outline-[#00f2ff]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          role="dialog"
          aria-label="Menu móvel"
          aria-modal="true"
          className="lg:hidden border-b border-[#3a494b] bg-[#151d1e] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-[0.25rem] text-sm font-medium transition-colors',
                  isActive
                    ? 'text-[#00f2ff] bg-[#00f2ff]/10 border border-[#00f2ff]/30 font-semibold'
                    : 'text-[#b9cacb] hover:text-[#dce4e4] hover:bg-[#192122]'
                )}
              >
                <item.icon className={clsx('w-4 h-4', isActive ? 'text-[#00f2ff]' : 'text-[#849495]')} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
