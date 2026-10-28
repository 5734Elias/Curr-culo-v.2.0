import React from 'react';
import Link from 'next/link';
import { PROFILE, WHATSAPP_CONTACT_URL, TELEGRAM_CONTACT_URL } from '@/data/profile';
import { Mail, ShieldCheck, Terminal, MessageCircle, Send } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#3a494b]/80 bg-[#151d1e] text-[#b9cacb] py-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Coluna 1: Perfil */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-[#00f2ff]">
              <Terminal className="w-5 h-5" />
              <span className="font-bold text-sm tracking-tight text-[#dce4e4]">
                {PROFILE.name}
              </span>
            </div>
            <p className="text-xs text-[#b9cacb] leading-relaxed max-w-md">
              {PROFILE.summary}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#00f2ff] font-mono">
              <ShieldCheck className="w-4 h-4" />
              <span>Conformidade LGPD & Segurança de Dados por Padrão</span>
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#00f2ff]">
              Navegação Rápida
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/sobre" className="hover:text-[#00f2ff] transition-colors">
                  Sobre & Trajetória
                </Link>
              </li>
              <li>
                <Link href="/experiencia" className="hover:text-[#00f2ff] transition-colors">
                  Experiência Profissional
                </Link>
              </li>
              <li>
                <Link href="/projetos" className="hover:text-[#00f2ff] transition-colors">
                  Projetos & Estudo de Caso
                </Link>
              </li>
              <li>
                <Link href="/formacao" className="hover:text-[#00f2ff] transition-colors">
                  Formação & Certificados
                </Link>
              </li>
              <li>
                <Link href="/curriculo" className="hover:text-[#00f2ff] transition-colors">
                  Currículo Web / PDF
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Conexões Diretas */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-widest text-[#00f2ff]">
              Canais Autorizados
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href={WHATSAPP_CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-1 rounded-[0.25rem] hover:text-[#00f2ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f2ff] transition-colors"
                  aria-label={`Conversar pelo WhatsApp no número ${PROFILE.phone}`}
                >
                  <MessageCircle className="w-4 h-4 text-[#00f2ff] shrink-0" aria-hidden="true" />
                  <span>WhatsApp — {PROFILE.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={TELEGRAM_CONTACT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-1 rounded-[0.25rem] hover:text-[#00f2ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f2ff] transition-colors"
                  aria-label={`Enviar mensagem pelo Telegram para ${PROFILE.phone}`}
                >
                  <Send className="w-4 h-4 text-[#00f2ff] shrink-0" aria-hidden="true" />
                  <span>Telegram — {PROFILE.phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={PROFILE.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-1 rounded-[0.25rem] hover:text-[#00f2ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f2ff] transition-colors"
                  aria-label="Acessar perfil profissional no LinkedIn"
                >
                  <LinkedinIcon className="w-4 h-4 text-[#00f2ff] shrink-0" aria-hidden="true" />
                  <span>LinkedIn</span>
                </a>
              </li>
              <li>
                <a
                  href={PROFILE.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 py-1 rounded-[0.25rem] hover:text-[#00f2ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f2ff] transition-colors"
                  aria-label="Acessar projetos e repositórios no GitHub"
                >
                  <GithubIcon className="w-4 h-4 text-[#00f2ff] shrink-0" aria-hidden="true" />
                  <span>GitHub</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${PROFILE.email}`}
                  className="inline-flex items-center gap-2 py-1 rounded-[0.25rem] hover:text-[#00f2ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00f2ff] transition-colors"
                  aria-label={`Enviar e-mail para ${PROFILE.email}`}
                >
                  <Mail className="w-4 h-4 text-[#00f2ff] shrink-0" aria-hidden="true" />
                  <span>{PROFILE.email}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé inferior */}
        <div className="pt-8 border-t border-[#3a494b]/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#849495] gap-4">
          <p>© {new Date().getFullYear()} Elias Ribeiro dos Reis. Todos os direitos reservados.</p>
          <p className="font-mono text-[#00f2ff]/80">
            Arquitetura em Next.js App Router • Design System Google Stitch
          </p>
        </div>
      </div>
    </footer>
  );
};
