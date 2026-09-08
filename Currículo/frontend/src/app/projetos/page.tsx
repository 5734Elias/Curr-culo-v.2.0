'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { PROJECTS } from '@/data/projects';
import { ArrowRight } from 'lucide-react';

export default function ProjetosPage() {
  const [selectedDomain, setSelectedDomain] = useState<string>('todos');

  const filteredProjects = PROJECTS.filter((project) => {
    if (selectedDomain === 'todos') return true;
    if (selectedDomain === 'ia') return project.technologies.some((t) => t.includes('IA') || t.includes('Gemini') || t.includes('Foundry'));
    if (selectedDomain === 'seguranca') return project.technologies.some((t) => t.includes('Fortinet') || t.includes('Pentest') || t.includes('Security'));
    if (selectedDomain === 'cloud') return project.technologies.some((t) => t.includes('AWS') || t.includes('Data') || t.includes('SQL'));
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <SectionHeader
          badge="Portfólio & Casos de Estudo"
          title="Projetos de Software, IA, Cloud e Segurança"
          description="Estudos de caso reais e projetos estruturados em arquitetura de microsserviços, inteligência artificial multimodal, perímetros Fortinet e pipelines de dados."
        />

        {/* Filtros Nomeados */}
        <div className="flex flex-wrap items-center gap-3 border-b border-[#3a494b]/60 pb-6">
          <span className="text-xs font-mono text-[#849495] uppercase tracking-wider mr-2">
            Filtrar por Domínio:
          </span>
          <Button
            size="sm"
            variant={selectedDomain === 'todos' ? 'primary' : 'ghost'}
            onClick={() => setSelectedDomain('todos')}
          >
            Todos os Projetos ({PROJECTS.length})
          </Button>
          <Button
            size="sm"
            variant={selectedDomain === 'ia' ? 'primary' : 'ghost'}
            onClick={() => setSelectedDomain('ia')}
          >
            IA Generativa & Agentes
          </Button>
          <Button
            size="sm"
            variant={selectedDomain === 'seguranca' ? 'primary' : 'ghost'}
            onClick={() => setSelectedDomain('seguranca')}
          >
            Cibersegurança & Pentest
          </Button>
          <Button
            size="sm"
            variant={selectedDomain === 'cloud' ? 'primary' : 'ghost'}
            onClick={() => setSelectedDomain('cloud')}
          >
            AWS Cloud & Data Pipelines
          </Button>
        </div>

        {/* Grid de Projetos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <Card key={project.slug} hoverEffect className="flex flex-col justify-between h-full bg-[#192122]/90 border border-[#3a494b]">
              <div>
                <CardHeader>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <Badge key={tech} variant="cyber">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-lg leading-snug">{project.title}</CardTitle>
                  <CardDescription className="text-xs mt-2 leading-relaxed">
                    {project.summary}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono text-[#00f2ff] block uppercase tracking-wider">
                      Resultados Medidos:
                    </span>
                    {project.outcomes.map((outcome) => (
                      <div key={outcome.label} className="flex justify-between text-xs font-mono text-[#b9cacb]">
                        <span>{outcome.label}:</span>
                        <span className="text-[#00f2ff] font-semibold">{outcome.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-[#3a494b]/60">
                <Link href={`/projetos/${project.slug}`} className="w-full">
                  <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Abrir Estudo de Caso
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
