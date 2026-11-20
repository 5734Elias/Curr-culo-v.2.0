import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PROFILE } from '@/data/profile';
import { EXPERIENCES } from '@/data/experiences';
import { getPublishedProjects, getPublishedCertificates } from '@/services/cmsDataService';
import { ArrowRight, FileText, Mail } from 'lucide-react';

export default async function HomePage() {
  const [projects, courses] = await Promise.all([
    getPublishedProjects(),
    getPublishedCertificates(),
  ]);

  const featuredProjects = projects.slice(0, 3);
  const recentExperiences = EXPERIENCES.slice(0, 3);
  const featuredCourses = courses.filter((c) => c.issuerPriority === 'featured').slice(0, 4);

  const practiceAreas = [
    {
      title: 'Engenharia de Software & APIs',
      description:
        'Desenvolvimento full stack com Java, Spring Boot, Python, TypeScript e React, priorizando arquitetura limpa e escalabilidade.',
    },
    {
      title: 'Cloud, Dados & Infraestrutura',
      description:
        'Bancos relacionais (SQL Server, MySQL, PostgreSQL), automação analítica, Docker e operações em ambientes AWS e Azure.',
    },
    {
      title: 'IA Generativa & Automação',
      description:
        'Construção de agentes inteligentes, fluxos com RAG e integração de modelos de linguagem voltados a produtividade real.',
    },
    {
      title: 'Cibersegurança & Conformidade',
      description:
        'Segurança aplicada no ciclo de desenvolvimento, Fortinet FCA, análise de vulnerabilidades e proteção de dados (LGPD).',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow">
        {/* 1. HERO PESSOAL: Duas colunas no desktop; foto primeiro no mobile */}
        <section className="pt-10 pb-16 lg:pt-20 lg:pb-24 border-b border-[#3a494b]/35">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              {/* Lado Textual */}
              <div className="lg:col-span-7 space-y-6 order-2 lg:order-1">
                <p className="text-sm font-medium tracking-wide text-[#00f2ff]">
                  Analista de Sistemas &amp; Arquiteto de Software
                </p>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-[#dce4e4] leading-[1.12]">
                  {PROFILE.name}
                </h1>

                <p className="text-lg sm:text-xl text-[#b9cacb] leading-relaxed max-w-2xl">
                  Arquiteto de sistemas e desenvolvedor full stack, conectando software, cloud,
                  dados, IA e segurança para transformar problemas complexos em soluções confiáveis.
                </p>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
                  <Link href="/projetos" className="w-full sm:w-auto">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full sm:w-auto"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Explorar Projetos
                    </Button>
                  </Link>
                  <Link href="/contato" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Entrar em Contato
                    </Button>
                  </Link>
                  <Link
                    href="/curriculo"
                    className="inline-flex items-center justify-center sm:justify-start gap-2 min-h-[44px] px-3 py-2 text-sm font-medium text-[#b9cacb] hover:text-[#00f2ff] transition-colors"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span>Ver Currículo Completo</span>
                  </Link>
                </div>
              </div>

              {/* Lado Visual: Fotografia vertical real com presença editorial */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end order-1 lg:order-2">
                <figure className="w-full max-w-[400px] rounded-[0.5rem] overflow-hidden bg-[#12191b] border border-[#3a494b]/45 shadow-2xl">
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <Image
                      src="/images/elias-hero-architecture.webp"
                      alt="Retrato profissional de Elias Ribeiro dos Reis em ambiente de arquitetura e engenharia de software"
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 400px, 400px"
                      className="object-cover object-top"
                      priority
                    />
                  </div>
                  <figcaption className="px-5 py-4 bg-[#12191b] border-t border-[#3a494b]/35 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#dce4e4]">
                        Software, Cloud &amp; Segurança
                      </p>
                      <p className="text-xs text-[#b9cacb]">{PROFILE.location}</p>
                    </div>
                  </figcaption>
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PROVA RÁPIDA DE VALOR */}
        <section className="py-12 border-b border-[#3a494b]/30 bg-[#11181a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-tight text-[#dce4e4]">
                  {courses.length} certificações
                </p>
                <p className="text-sm text-[#b9cacb]">
                  Formação auditada em engenharia, dados, nuvem e cibersegurança (SENAI, AWS, Fortinet).
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-tight text-[#dce4e4]">
                  {projects.length} estudos de caso
                </p>
                <p className="text-sm text-[#b9cacb]">
                  Projetos documentados com arquitetura, controles de segurança e resultados mensuráveis.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold tracking-tight text-[#dce4e4]">
                  5+ organizações
                </p>
                <p className="text-sm text-[#b9cacb]">
                  Atuação contínua conectando infraestrutura crítica, integração de sistemas e entrega de valor.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SOBRE PROFISSIONAL */}
        <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <figure className="w-full max-w-[420px] mx-auto lg:mx-0 rounded-[0.5rem] overflow-hidden bg-[#12191b] border border-[#3a494b]/40">
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src="/images/elias-data-center.webp"
                    alt="Elias Ribeiro dos Reis em pé no CPD Enterprise Data Center com racks de servidores ao fundo"
                    fill
                    sizes="(max-width: 1024px) 92vw, 420px"
                    className="object-cover object-top"
                  />
                </div>
                <figcaption className="px-5 py-3.5 bg-[#12191b] border-t border-[#3a494b]/35 text-xs text-[#b9cacb]">
                  Da operação de Data Center à arquitetura de software corporativo.
                </figcaption>
              </figure>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#00f2ff]">Sobre minha trajetória</p>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#dce4e4]">
                  Visão ponta a ponta entre infraestrutura e código
                </h2>
              </div>

              <div className="space-y-4 text-base text-[#b9cacb] leading-relaxed">
                <p>
                  Sou Analista de Sistemas e Desenvolvedor Full Stack na FapUnifesp, com trajetória
                  construída na prática — desde o suporte e a sustentação de infraestrutura até o
                  desenvolvimento de APIs REST em Java e Spring Boot, automações em Python e
                  interfaces modernas em React e TypeScript.
                </p>
                <p>
                  Essa base em operações reais de TI me permite projetar sistemas que não apenas
                  funcionam bem no código, mas respeitam requisitos de segurança, integridade de
                  dados e continuidade operacional em produção.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/sobre"
                  className="inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-[#00f2ff] hover:underline underline-offset-4"
                >
                  <span>Conhecer trajetória completa e princípios de trabalho</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ÁREAS DE ATUAÇÃO */}
        <section className="py-20 border-y border-[#3a494b]/30 bg-[#11181a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium text-[#00f2ff]">Áreas de atuação</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#dce4e4]">
                Especialidades aplicadas a problemas reais
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {practiceAreas.map((area) => (
                <Card
                  key={area.title}
                  surfaceTier="informative"
                  className="flex flex-col justify-between p-6"
                >
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-[#dce4e4]">{area.title}</h3>
                    <p className="text-sm text-[#b9cacb] leading-relaxed">{area.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 5. PROJETOS SELECIONADOS */}
        <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-sm font-medium text-[#00f2ff]">Projetos selecionados</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#dce4e4]">
                Estudos de caso e entregas
              </h2>
            </div>
            <Link
              href="/projetos"
              className="inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-[#00f2ff] hover:underline underline-offset-4"
            >
              <span>Ver todos os projetos</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project) => {
              const primaryOutcome = project.outcomes[0];
              return (
                <Card
                  key={project.slug}
                  surfaceTier="featured"
                  hoverEffect
                  className="flex flex-col justify-between p-6"
                >
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-[#dce4e4] leading-snug">
                      {project.title}
                    </h3>

                    <p className="text-sm text-[#b9cacb] leading-relaxed">{project.problem}</p>

                    {primaryOutcome && (
                      <div className="pt-3 border-t border-[#3a494b]/40">
                        <p className="text-xs text-[#849495]">{primaryOutcome.label}</p>
                        <p className="text-sm font-semibold text-[#dce4e4] mt-0.5">
                          {primaryOutcome.value}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {project.technologies.slice(0, 3).map((tech) => (
                        <span
                          key={tech}
                          className="text-xs px-2.5 py-1 rounded-[0.25rem] bg-[#12191b] text-[#b9cacb] border border-[#3a494b]/50"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#3a494b]/35">
                    <Link
                      href={`/projetos/${project.slug}`}
                      className="inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-[#00f2ff] hover:underline underline-offset-4"
                    >
                      <span>Ler estudo de caso</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* 6. EXPERIÊNCIA, COLABORAÇÃO & FORMAÇÃO */}
        <section className="py-20 border-t border-[#3a494b]/30 bg-[#11181a]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Bloco de Colaboração em Equipe */}
            <Card surfaceTier="featured" className="p-0 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                <div className="lg:col-span-6 relative aspect-[4/3] lg:aspect-auto lg:min-h-[340px] w-full overflow-hidden">
                  <Image
                    src="/images/equipe-data-science-ia.webp"
                    alt="Elias Ribeiro dos Reis com equipe multidisciplinar de TI, Dados e Inteligência Artificial"
                    fill
                    sizes="(max-width: 1024px) 100vw, 600px"
                    className="object-cover object-top"
                  />
                </div>
                <div className="lg:col-span-6 p-8 flex flex-col justify-center space-y-4">
                  <p className="text-sm font-medium text-[#00f2ff]">Colaboração multidisciplinar</p>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dce4e4]">
                    Atuação integrada entre engenharia, dados e operações
                  </h2>
                  <p className="text-base text-[#b9cacb] leading-relaxed">
                    Experiência trabalhando em conjunto com times de infraestrutura, suporte
                    especializado, engenharia de dados e inteligência artificial para entregar
                    sistemas confiáveis e sustentáveis.
                  </p>
                </div>
              </div>
            </Card>

            {/* Cronologia Limpa de Experiência e Formação */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Experiência Recente */}
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-[#dce4e4]">Experiência recente</h2>
                  <Link
                    href="/experiencia"
                    className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[#00f2ff] hover:underline underline-offset-4"
                  >
                    <span>Ver histórico</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>

                <ol className="space-y-5 border-l border-[#3a494b]/60 pl-6">
                  {recentExperiences.map((exp) => (
                    <li key={exp.id} className="space-y-1">
                      <p className="text-xs text-[#00f2ff] font-medium">{exp.period}</p>
                      <h3 className="text-base font-semibold text-[#dce4e4]">{exp.role}</h3>
                      <p className="text-sm text-[#b9cacb]">{exp.company}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Formação & Certificações em Destaque */}
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold text-[#dce4e4]">Formação &amp; Certificações</h2>
                  <Link
                    href="/formacao"
                    className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[#00f2ff] hover:underline underline-offset-4"
                  >
                    <span>Ver todas ({courses.length})</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>

                <ul className="space-y-4">
                  {featuredCourses.map((course) => (
                    <li
                      key={course.id}
                      className="p-4 rounded-[0.375rem] bg-[#161f21] border border-[#3a494b]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-[#dce4e4]">
                          {course.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#b9cacb]">{course.institution}</p>
                      </div>
                      {course.workloadHours && (
                        <span className="text-xs font-medium text-[#00f2ff] shrink-0">
                          {course.workloadHours}h
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 7. CTA FINAL */}
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card surfaceTier="featured" className="p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-3 max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#dce4e4]">
                  Vamos conversar sobre sua equipe ou próximo projeto?
                </h2>
                <p className="text-base text-[#b9cacb] leading-relaxed">
                  {PROFILE.availability}. Entre em contato diretamente por WhatsApp, Telegram,
                  e-mail ou LinkedIn.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link href="/contato" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto"
                    leftIcon={<Mail className="w-4 h-4" />}
                  >
                    Falar Comigo
                  </Button>
                </Link>
                <Link href="/curriculo" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Currículo PDF
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
