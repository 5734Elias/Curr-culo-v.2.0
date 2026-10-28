import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { getExperiences } from '@/data/experiences';
import { PROFILE } from '@/data/profile';
import { Briefcase, Calendar, MapPin, CheckCircle, ArrowRight, Shield } from 'lucide-react';

// Revalidação periódica de 24h no Next.js (Incremental Static Regeneration)
// Garante que o cálculo dinâmico de duração de experiências reflita a passagem do tempo
export const revalidate = 86400;

export const metadata: Metadata = {
  title: `Experiência Profissional | ${PROFILE.name}`,
  description:
    'Histórico de atuação profissional com responsabilidades estruturadas em Ação, Contexto e Efeito, abrangendo desenvolvimento de software e infraestrutura.',
};

export default function ExperienciaPage() {
  const experiences = getExperiences();

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        <SectionHeader
          badge="Linha do Tempo Profissional"
          title="Trajetória de Atuação e Experiência"
          description="Histórico profissional em ordem cronológica inversa, com responsabilidades estruturadas em Ação + Contexto + Efeito e destaques técnicos qualitativos."
        />

        {/* Timeline Container */}
        <div className="relative border-l-2 border-[#3a494b] ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
          {experiences.map((exp) => (
            <div key={exp.id} className="relative group">
              {/* Marker Icon */}
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-6 h-6 rounded-full bg-[#192122] border-2 border-[#00f2ff] flex items-center justify-center text-[#00f2ff] shadow-[0_0_10px_rgba(0,242,255,0.4)] group-hover:scale-110 transition-transform">
                <Briefcase className="w-3 h-3" />
              </div>

              <Card hoverEffect className="bg-[#192122]/90 border border-[#3a494b]">
                <CardHeader className="border-b-0 pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-[#00f2ff] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {exp.period}
                    </span>
                    {exp.location && (
                      <span className="text-xs text-[#849495] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#849495]" />
                        {exp.location}
                      </span>
                    )}
                  </div>

                  <CardTitle className="text-xl text-[#dce4e4]">{exp.role}</CardTitle>
                  <p className="text-sm font-semibold text-[#c0c1ff] mt-0.5">{exp.company}</p>
                  {exp.overlapNote && (
                    <p className="text-xs text-[#00f2ff]/80 font-mono mt-1.5 flex items-center gap-1.5 bg-[#00f2ff]/5 border border-[#00f2ff]/20 px-2.5 py-1 rounded-[0.25rem]">
                      <span>ℹ</span>
                      <span>{exp.overlapNote}</span>
                    </p>
                  )}
                </CardHeader>

                <CardContent className="space-y-6 pt-4 border-t border-[#3a494b]/60">
                  {/* Bullet Responsabilidades (Ação + Contexto + Efeito) */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#00f2ff]">
                      Responsabilidades & Impacto:
                    </h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-[#b9cacb] leading-relaxed">
                      {exp.responsibilities.map((resp, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#00f2ff] font-mono shrink-0 mt-0.5">›</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tecnologias Utlizadas */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#849495]">
                      Tecnologias Envolvidas:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map((tech) => (
                        <Badge key={tech} variant="outline">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Destaques e Entregas Técnicas */}
                  {exp.outcomes && exp.outcomes.length > 0 && (
                    <div className="p-4 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] space-y-3">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-[#00f2ff] flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Destaques e Entregas Técnicas:
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {exp.outcomes.map((outcome) => (
                          <div key={outcome.label} className="text-xs space-y-0.5">
                            <span className="text-[#00f2ff] font-mono font-semibold block">{outcome.label}:</span>
                            <p className="text-[#b9cacb] leading-relaxed">{outcome.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="p-6 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#b9cacb]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00f2ff]" />
            <span>Todos os dados de empresas e atribuições foram checados factualmentes sem exagero de métricas.</span>
          </div>
          <Link href="/projetos">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Ver Estudo de Casos
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
