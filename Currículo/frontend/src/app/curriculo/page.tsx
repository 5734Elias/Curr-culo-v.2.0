'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { PROFILE } from '@/data/profile';
import { getExperiences } from '@/data/experiences';
import { Printer, Mail, MapPin } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from '@/components/ui/Icons';

export default function CurriculoPage() {
  const experiences = React.useMemo(() => getExperiences(), []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {/* Top Header & Print CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3a494b]/80 pb-6 print:hidden">
          <SectionHeader
            badge="Versão Profissional Completa"
            title="Currículo Vitae - Elias Ribeiro dos Reis"
            description="Visão limpa para leitura profissional com opção de impressão e download em PDF."
            className="mb-0"
          />
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="primary" size="sm" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>

        {/* ESTRUTURA DO CURRÍCULO WEB (PRINT-FRIENDLY) */}
        <div className="glass-panel rounded-[0.25rem] p-6 sm:p-10 bg-[#192122] border border-[#3a494b] space-y-10 text-[#dce4e4] print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
          {/* Cabeçalho do Currículo */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-[#3a494b] pb-8 print:border-black">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#dce4e4] print:text-black">
                {PROFILE.name}
              </h1>
              <p className="text-sm font-mono text-[#00f2ff] print:text-black font-semibold">
                {PROFILE.role}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#b9cacb] print:text-black pt-1 font-mono">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#00f2ff] print:text-black" />
                  {PROFILE.location}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#00f2ff] print:text-black" />
                  {PROFILE.email}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono print:text-black">
              <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#00f2ff]">
                <LinkedinIcon className="w-4 h-4 text-[#00f2ff] print:text-black" />
                <span>LinkedIn</span>
              </a>
              <a href={PROFILE.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#00f2ff]">
                <GithubIcon className="w-4 h-4 text-[#00f2ff] print:text-black" />
                <span>GitHub</span>
              </a>
            </div>
          </div>

          {/* Resumo Profissional */}
          <div className="space-y-3">
            <h2 className="text-sm font-mono uppercase tracking-widest text-[#00f2ff] print:text-black font-bold border-b border-[#3a494b]/60 pb-1 print:border-black">
              Resumo Profissional
            </h2>
            <p className="text-xs sm:text-sm text-[#b9cacb] print:text-black leading-relaxed">
              {PROFILE.summary}
            </p>
          </div>

          {/* Experiência Profissional */}
          <div className="space-y-6">
            <h2 className="text-sm font-mono uppercase tracking-widest text-[#00f2ff] print:text-black font-bold border-b border-[#3a494b]/60 pb-1 print:border-black">
              Experiência Profissional
            </h2>
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="space-y-2 print:break-inside-avoid">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-[#dce4e4] print:text-black">{exp.role}</span>
                    <span className="font-mono text-[#00f2ff] print:text-black">{exp.period}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#c0c1ff] print:text-black">{exp.company}</p>
                  {exp.overlapNote && (
                    <p className="text-[11px] text-[#849495] print:text-gray-600 italic">
                      Obs: {exp.overlapNote}
                    </p>
                  )}
                  <ul className="space-y-1 text-xs text-[#b9cacb] print:text-black list-disc list-inside">
                    {exp.responsibilities.map((resp, i) => (
                      <li key={i}>{resp}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Formação Acadêmica & Treinamentos */}
          <div className="space-y-4">
            <h2 className="text-sm font-mono uppercase tracking-widest text-[#00f2ff] print:text-black font-bold border-b border-[#3a494b]/60 pb-1 print:border-black">
              Formação & Certificações Relevantes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-[0.25rem] bg-[#151d1e] print:bg-gray-100 border border-[#3a494b] print:border-black">
                <span className="font-bold block text-[#dce4e4] print:text-black">
                  Técnico em Análise e Desenvolvimento de Sistemas (SENAI)
                </span>
                <span className="text-[11px] font-mono text-[#00f2ff] print:text-black">1.200h • Conclusão 2023</span>
              </div>
              <div className="p-3 rounded-[0.25rem] bg-[#151d1e] print:bg-gray-100 border border-[#3a494b] print:border-black">
                <span className="font-bold block text-[#dce4e4] print:text-black">
                  IA Generativa (Google Antigravity & Microsoft AI Foundry)
                </span>
                <span className="text-[11px] font-mono text-[#00f2ff] print:text-black">80h • SENAI 2026</span>
              </div>
              <div className="p-3 rounded-[0.25rem] bg-[#151d1e] print:bg-gray-100 border border-[#3a494b] print:border-black">
                <span className="font-bold block text-[#dce4e4] print:text-black">
                  Cibersegurança Fortinet FCA & Pentest
                </span>
                <span className="text-[11px] font-mono text-[#00f2ff] print:text-black">Fortigate 7.4 • SENAI 2024</span>
              </div>
              <div className="p-3 rounded-[0.25rem] bg-[#151d1e] print:bg-gray-100 border border-[#3a494b] print:border-black">
                <span className="font-bold block text-[#dce4e4] print:text-black">
                  AWS Cloud Practitioner & Data Science Python
                </span>
                <span className="text-[11px] font-mono text-[#00f2ff] print:text-black">100h • SENAI 2025/2026</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
