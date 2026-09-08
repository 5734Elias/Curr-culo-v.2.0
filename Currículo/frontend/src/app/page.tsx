import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { PROFILE } from '@/data/profile';
import { PROJECTS } from '@/data/projects';
import { COURSES } from '@/data/courses';
import { Terminal, Shield, Code, Cpu, ArrowRight, CheckCircle, Database } from 'lucide-react';

export default function HomePage() {
  const featuredProjects = PROJECTS.slice(0, 3);
  // Priorizar até 4 cursos em destaque (SENAI, Ka Solution, Fundação Bradesco)
  const featuredCourses = COURSES.filter((c) => c.issuerPriority === 'featured').slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow space-y-24 pb-20">
        {/* HERO SECTION */}
        <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-[#3a494b]/60 bg-gradient-to-b from-[#151d1e]/80 to-[#0d1515]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Texto Principal */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[0.25rem] bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] font-mono text-xs uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>[ System Architecture & Software Development ]</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#dce4e4] leading-tight">
                  Engenharia de Software, <span className="text-[#00f2ff]">Nuvem</span>, <span className="text-[#c0c1ff]">IA</span> & Cibersegurança
                </h1>

                <p className="text-base sm:text-lg text-[#b9cacb] leading-relaxed max-w-2xl">
                  {PROFILE.headline}. Trajetória sólida que integra desenvolvimento full-stack em Java e Python, APIs REST com Spring Boot, engenharia de dados, nuvem AWS/Azure e cibersegurança.
                </p>

                {/* Métricas Rápidas */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#3a494b]/60 font-mono">
                  <div>
                    <span className="text-2xl font-bold text-[#00f2ff]">{COURSES.length}+</span>
                    <span className="text-[11px] text-[#b9cacb] block">Cursos Auditados</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-[#c0c1ff]">5+</span>
                    <span className="text-[11px] text-[#b9cacb] block">Empresas Atendidas</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-[#ffe173]">100%</span>
                    <span className="text-[11px] text-[#b9cacb] block">Dados Verificáveis</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link href="/projetos">
                    <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Explorar Projetos
                    </Button>
                  </Link>
                  <Link href="/contato">
                    <Button variant="outline" size="lg">
                      Entrar em Contato
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Card de Perfil Visually Premium (Stitch Style) */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute -inset-1 rounded-[0.25rem] bg-gradient-to-r from-[#00f2ff] to-[#3131c0] opacity-30 blur-xl"></div>
                  <div className="relative glass-panel rounded-[0.25rem] p-6 bg-[#192122] border border-[#00f2ff]/30 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)] shrink-0">
                        <Image
                          src="/images/Eu.jpg"
                          alt="Foto de Elias Ribeiro Dos Reis"
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#dce4e4]">{PROFILE.name}</h2>
                        <p className="text-xs text-[#00f2ff] font-mono">{PROFILE.role}</p>
                        <p className="text-[11px] text-[#b9cacb] mt-1">{PROFILE.location}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-[#b9cacb] bg-[#151d1e] p-4 rounded-[0.25rem] border border-[#3a494b]">
                      <div className="flex items-center justify-between font-mono">
                        <span>Formação Principal:</span>
                        <span className="text-[#00f2ff]">Técnico SENAI</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span>Especializações 2026:</span>
                        <span className="text-[#c0c1ff]">IA & JS Avançado</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span>Status de Segurança:</span>
                        <span className="text-[#ffb4ab]">Fortinet FCA & Pentest</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] font-mono text-[#00f2ff] flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Dados Conferidos
                      </span>
                      <Link href="/curriculo" className="text-xs text-[#c0c1ff] hover:text-[#00f2ff] underline font-mono">
                        Baixar Currículo →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILARES DE ATUAÇÃO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Pilares de Competência"
            title="Domínios Tecnológicos Principais"
            description="Soluções projetadas com rigor de engenharia, código limpo, observabilidade e conformidade de segurança."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverEffect>
              <CardHeader>
                <div className="w-10 h-10 rounded-[0.25rem] bg-[#00f2ff]/10 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff]">
                  <Code className="w-5 h-5" />
                </div>
                <CardTitle className="mt-4 text-base">Desenvolvimento & Software</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#b9cacb]">
                Construção de aplicações robustas em Java (Spring Boot / JPA / Security), Python, TypeScript, React, Next.js e C/C++. APIs REST seguras e limpas.
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardHeader>
                <div className="w-10 h-10 rounded-[0.25rem] bg-[#c0c1ff]/10 border border-[#c0c1ff]/40 flex items-center justify-center text-[#c0c1ff]">
                  <Cpu className="w-5 h-5" />
                </div>
                <CardTitle className="mt-4 text-base">IA Generativa & Agentes</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#b9cacb]">
                Agentes autônomos com Microsoft AI Foundry e Google Antigravity. Integração de Gemini/Imagen, RAG multimodal e prompts estruturados.
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardHeader>
                <div className="w-10 h-10 rounded-[0.25rem] bg-[#ffb4ab]/10 border border-[#ffb4ab]/40 flex items-center justify-center text-[#ffb4ab]">
                  <Shield className="w-5 h-5" />
                </div>
                <CardTitle className="mt-4 text-base">Cibersegurança & Pentest</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#b9cacb]">
                Configuração Fortigate (FCA), simulações de Pentest, Análise Forense Computacional, Python para Segurança e conformidade LGPD.
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardHeader>
                <div className="w-10 h-10 rounded-[0.25rem] bg-[#74f5ff]/10 border border-[#74f5ff]/40 flex items-center justify-center text-[#74f5ff]">
                  <Database className="w-5 h-5" />
                </div>
                <CardTitle className="mt-4 text-base">Dados & Cloud AWS/Azure</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#b9cacb]">
                Gerenciamento de bancos SQL Server, MySQL, Oracle, PostgreSQL, pipelines com Python/Pandas e infraestrutura AWS/Azure.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SEÇÃO PROJETOS EM DESTAQUE */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <SectionHeader
              badge="Portfólio Selecionado"
              title="Estudos de Caso Verificáveis"
              description="Projetos estruturados em contexto, problema, solução, arquitetura, segurança e métricas de resultado."
              className="mb-0"
            />
            <Link href="/projetos">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Ver Todos os Projetos
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((project) => (
              <Card key={project.slug} hoverEffect className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="cyber">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-base">{project.title}</CardTitle>
                    <CardDescription>{project.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono text-[#00f2ff] block uppercase tracking-wider">
                        Resultados Comprovados:
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
                <CardFooter>
                  <Link href={`/projetos/${project.slug}`} className="w-full">
                    <Button variant="primary" size="sm" className="w-full">
                      Ver Estudo de Caso
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* SEÇÃO FORMAÇÃO & CERTIFICADOS RECENTES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <SectionHeader
              badge="Educação & Evidências"
              title="Formação, Cursos & Certificações"
              description="Seleção de qualificações em destaque das instituições SENAI, Ka Solution e Fundação Bradesco."
              className="mb-0"
            />
            <Link href="/formacao">
              <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Ver Todas as Certificações ({COURSES.length})
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredCourses.map((course) => (
              <Card key={course.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge category={course.category}>{course.category}</Badge>
                    <span className="text-xs font-mono text-[#00f2ff]">
                      {course.workloadHours ? `${course.workloadHours}h Comprovadas` : course.institution}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#dce4e4]">{course.title}</h3>
                  <p className="text-xs text-[#b9cacb] mt-1 font-semibold flex items-center gap-1">
                    <span className="text-[#00f2ff]">{course.institution}</span>
                    {course.technologyProvider && (
                      <span className="text-[#c0c1ff] font-mono">({course.technologyProvider})</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {course.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="text-[11px] font-mono px-2 py-0.5 rounded-[0.25rem] bg-[#151d1e] text-[#b9cacb] border border-[#3a494b]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
