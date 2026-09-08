import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PROJECTS } from '@/data/projects';
import { ArrowLeft, CheckCircle, ExternalLink, Server, Lock, TestTube } from 'lucide-react';

interface ProjectSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PROJECTS.map((p) => ({
    slug: p.slug,
  }));
}

export default async function ProjectDetailPage({ params }: ProjectSlugPageProps) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Top Back Link */}
        <div>
          <Link href="/projetos">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Voltar para Lista de Projetos
            </Button>
          </Link>
        </div>

        {/* Header do Estudo de Caso */}
        <div className="space-y-4 border-b border-[#3a494b]/80 pb-8">
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <Badge key={tech} variant="cyber">
                {tech}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#dce4e4] tracking-tight">
            {project.title}
          </h1>
          <p className="text-base text-[#b9cacb] max-w-3xl leading-relaxed">
            {project.summary}
          </p>
        </div>

        {/* Grid de Seções Técnicas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Coluna Esquerda: Contexto, Problema e Solução */}
          <div className="lg:col-span-8 space-y-8">
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle className="text-base text-[#00f2ff]">Contexto & Motivação</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[#b9cacb] leading-relaxed">
                {project.context}
              </CardContent>
            </Card>

            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle className="text-base text-[#ffb4ab]">O Problema Enfrentado</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[#b9cacb] leading-relaxed">
                {project.problem}
              </CardContent>
            </Card>

            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle className="text-base text-[#c0c1ff]">A Solução Desenvolvida</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[#b9cacb] leading-relaxed">
                {project.solution}
              </CardContent>
            </Card>

            {/* Arquitetura */}
            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle className="text-base text-[#00f2ff] flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  <span>Componentes da Arquitetura</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#b9cacb]">
                  {project.architecture.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 bg-[#151d1e] p-3 rounded-[0.25rem] border border-[#3a494b]">
                      <span className="text-[#00f2ff] font-mono shrink-0">[{i + 1}]</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Controles de Segurança & Testes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card hoverEffect={false}>
                <CardHeader>
                  <CardTitle className="text-sm text-[#ffb4ab] flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Controles de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-[#b9cacb]">
                    {project.securityControls.map((sec, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#ffb4ab] font-mono">•</span>
                        <span>{sec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card hoverEffect={false}>
                <CardHeader>
                  <CardTitle className="text-sm text-[#74f5ff] flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Validação & Testes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-xs text-[#b9cacb]">
                    {project.testing.map((test, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#74f5ff] font-mono">•</span>
                        <span>{test}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Coluna Direita: Métricas e Links */}
          <div className="lg:col-span-4 space-y-6">
            <Card activeGlow>
              <CardHeader>
                <CardTitle className="text-base text-[#00f2ff] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Métricas de Resultado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.outcomes.map((outcome) => (
                  <div key={outcome.label} className="p-3 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] space-y-1">
                    <span className="text-xs text-[#b9cacb] block font-mono">{outcome.label}</span>
                    <span className="text-xl font-bold text-[#00f2ff] font-mono">{outcome.value}</span>
                    <span className="text-[10px] text-[#849495] block font-mono">STATUS: VERIFICADO</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card hoverEffect={false}>
              <CardHeader>
                <CardTitle className="text-base text-[#dce4e4]">Links & Artefatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button variant="outline" size="sm" className="w-full justify-between" rightIcon={<ExternalLink className="w-4 h-4" />}>
                      <span>{link.label}</span>
                    </Button>
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
