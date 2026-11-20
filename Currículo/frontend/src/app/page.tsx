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
import { getPublishedProjects, getPublishedCertificates } from '@/services/cmsDataService';
import {
  Terminal,
  Shield,
  Code,
  Cpu,
  ArrowRight,
  CheckCircle,
  Database,
  FileText,
  Users,
  Server,
} from 'lucide-react';

export default async function HomePage() {
  const [projects, courses] = await Promise.all([
    getPublishedProjects(),
    getPublishedCertificates(),
  ]);

  const featuredProjects = projects.slice(0, 3);
  const featuredCourses = courses.filter((c) => c.issuerPriority === 'featured').slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow space-y-24 pb-24">
        {/* HERO ASSIMÉTRICO COM RETRATO REAL */}
        <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-[#3a494b]/60 bg-gradient-to-b from-[#151d1e]/90 via-[#0d1515] to-[#0d1515]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              {/* Coluna Editorial Principal */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[0.25rem] bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] font-mono text-xs uppercase tracking-wider">
                  <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>System Architecture &amp; Software Engineering</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-[#dce4e4] leading-[1.12]">
                  Engenharia de Software, <span className="text-[#00f2ff]">Cloud</span>,{' '}
                  <span className="text-[#c0c1ff]">IA</span> &amp; Cibersegurança
                </h1>

                <p className="text-base sm:text-lg text-[#b9cacb] leading-relaxed max-w-2xl">
                  <strong className="text-[#dce4e4] font-semibold">{PROFILE.name}</strong> —{' '}
                  {PROFILE.headline}. Trajetória sólida integrando desenvolvimento full-stack em Java
                  e Python, APIs REST com Spring Boot, engenharia de dados, infraestrutura em nuvem
                  AWS/Azure e cibersegurança aplicada.
                </p>

                {/* Métricas Verificáveis */}
                <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-5 border-t border-[#3a494b]/60 font-mono">
                  <div>
                    <span className="text-2xl sm:text-3xl font-bold text-[#00f2ff] block">
                      {courses.length}
                    </span>
                    <span className="text-xs text-[#b9cacb]">Cursos e Certificados</span>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-bold text-[#c0c1ff] block">
                      {projects.length}
                    </span>
                    <span className="text-xs text-[#b9cacb]">Estudos de Caso</span>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-bold text-[#ffe173] block">5+</span>
                    <span className="text-xs text-[#b9cacb]">Organizações Atendidas</span>
                  </div>
                </div>

                {/* Ações Principais */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
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
                  <Link
                    href="/curriculo"
                    className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 text-sm font-mono text-[#c0c1ff] hover:text-[#00f2ff] underline underline-offset-4 transition-colors"
                  >
                    <FileText className="w-4 h-4" aria-hidden="true" />
                    <span>Currículo Web / PDF</span>
                  </Link>
                </div>
              </div>

              {/* Coluna Direita: Retrato Editorial Assimétrico */}
              <div className="lg:col-span-5 flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[420px]">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-1.5 rounded-[0.375rem] bg-gradient-to-tr from-[#00f2ff]/35 via-[#3131c0]/25 to-transparent blur-xl opacity-70"
                  />
                  <figure className="relative rounded-[0.375rem] overflow-hidden bg-[#151d1e] border border-[#00f2ff]/40 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <Image
                        src="/images/elias-hero-architecture.webp"
                        alt="Elias Ribeiro dos Reis em ambiente de engenharia de software com diagramas de arquitetura de sistemas"
                        fill
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 420px, 420px"
                        className="object-cover object-top"
                        priority
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0d1515] via-[#0d1515]/75 to-transparent"
                      />
                    </div>
                    <figcaption className="p-5 bg-[#151d1e]/95 border-t border-[#3a494b]/70 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-base font-bold text-[#dce4e4]">{PROFILE.name}</p>
                          <p className="text-xs font-mono text-[#00f2ff]">{PROFILE.location}</p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[0.25rem] bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[11px] font-mono text-[#00f2ff] shrink-0">
                          <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          Verificado
                        </span>
                      </div>
                      <p className="text-xs text-[#b9cacb] leading-relaxed">
                        {PROFILE.role}
                      </p>
                    </figcaption>
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LIDERANÇA TÉCNICA, ARQUITETURA & PILARES DE ATUAÇÃO */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <SectionHeader
            badge="Arquitetura & Liderança Técnica"
            title="Domínios Tecnológicos & Infraestrutura Crítica"
            description="Soluções projetadas com rigor de engenharia, código limpo, observabilidade, automação de dados e conformidade de segurança."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Retrato de Liderança e Infraestrutura no CPD */}
            <div className="lg:col-span-5 flex flex-col">
              <figure className="h-full flex flex-col rounded-[0.375rem] overflow-hidden bg-[#151d1e] border border-[#3a494b] surface-tier-2">
                <div className="relative aspect-[3/4] w-full flex-grow min-h-[340px] overflow-hidden">
                  <Image
                    src="/images/elias-cpd-enterprise.webp"
                    alt="Elias Ribeiro dos Reis em pé no CPD Enterprise Data Center com racks de servidores ao fundo"
                    fill
                    sizes="(max-width: 1024px) 100vw, 440px"
                    className="object-cover object-top"
                  />
                </div>
                <figcaption className="p-5 border-t border-[#3a494b]/70 space-y-2 bg-[#151d1e]">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00f2ff] uppercase tracking-wider">
                    <Server className="w-4 h-4" aria-hidden="true" />
                    <span>Da Infraestrutura à Arquitetura</span>
                  </div>
                  <p className="text-sm text-[#b9cacb] leading-relaxed">
                    Experiência prática conectando operação de Data Center, redes seguras, bancos
                    corporativos e desenvolvimento de sistemas escaláveis.
                  </p>
                </figcaption>
              </figure>
            </div>

            {/* 4 Pilares de Competência */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card hoverEffect className="flex flex-col justify-between">
                <CardHeader>
                  <div className="w-11 h-11 rounded-[0.25rem] bg-[#00f2ff]/10 border border-[#00f2ff]/40 flex items-center justify-center text-[#00f2ff]">
                    <Code className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="mt-4 text-lg">Desenvolvimento &amp; Software</CardTitle>
                </CardHeader>
                <CardContent className="text-sm sm:text-base text-[#b9cacb] leading-relaxed">
                  Construção de aplicações robustas em Java (Spring Boot / JPA / Security), Python,
                  TypeScript, React, Next.js e C/C++ com APIs REST seguras e tipagem estrita.
                </CardContent>
              </Card>

              <Card hoverEffect className="flex flex-col justify-between">
                <CardHeader>
                  <div className="w-11 h-11 rounded-[0.25rem] bg-[#c0c1ff]/10 border border-[#c0c1ff]/40 flex items-center justify-center text-[#c0c1ff]">
                    <Cpu className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="mt-4 text-lg">IA Generativa &amp; Agentes</CardTitle>
                </CardHeader>
                <CardContent className="text-sm sm:text-base text-[#b9cacb] leading-relaxed">
                  Agentes autônomos com Microsoft AI Foundry e Google Antigravity, integração
                  multimodal, arquiteturas RAG e orquestração orientada a resultados.
                </CardContent>
              </Card>

              <Card hoverEffect className="flex flex-col justify-between">
                <CardHeader>
                  <div className="w-11 h-11 rounded-[0.25rem] bg-[#ffb4ab]/10 border border-[#ffb4ab]/40 flex items-center justify-center text-[#ffb4ab]">
                    <Shield className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="mt-4 text-lg">Cibersegurança &amp; Pentest</CardTitle>
                </CardHeader>
                <CardContent className="text-sm sm:text-base text-[#b9cacb] leading-relaxed">
                  Configuração Fortigate (FCA), simulações de Pentest, Análise Forense
                  Computacional, Python para Segurança e conformidade LGPD por padrão.
                </CardContent>
              </Card>

              <Card hoverEffect className="flex flex-col justify-between">
                <CardHeader>
                  <div className="w-11 h-11 rounded-[0.25rem] bg-[#74f5ff]/10 border border-[#74f5ff]/40 flex items-center justify-center text-[#74f5ff]">
                    <Database className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <CardTitle className="mt-4 text-lg">Dados &amp; Cloud AWS/Azure</CardTitle>
                </CardHeader>
                <CardContent className="text-sm sm:text-base text-[#b9cacb] leading-relaxed">
                  Modelagem e integração de SQL Server, MySQL, Oracle e PostgreSQL, pipelines com
                  Python/Pandas e infraestrutura em nuvem AWS e Azure.
                </CardContent>
              </Card>
            </div>
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
              <Button variant="outline" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
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
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription className="text-sm">{project.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono text-[#00f2ff] block uppercase tracking-wider">
                        Resultados Comprovados:
                      </span>
                      {project.outcomes.map((outcome) => (
                        <div
                          key={outcome.label}
                          className="flex justify-between gap-3 text-xs font-mono text-[#b9cacb]"
                        >
                          <span>{outcome.label}:</span>
                          <span className="text-[#00f2ff] font-semibold text-right">
                            {outcome.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>
                <CardFooter>
                  <Link href={`/projetos/${project.slug}`} className="w-full">
                    <Button variant="primary" size="md" className="w-full">
                      Ver Estudo de Caso
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* SEÇÃO CONTEXTUAL DE COLABORAÇÃO & TIMES MULTIDISCIPLINARES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <SectionHeader
            badge="Colaboração & Engenharia em Equipe"
            title="Atuação Integrada em Infraestrutura, Dados e IA"
            description="Colaboração técnica conectando infraestrutura crítica de TI, engenharia de software, ciência de dados e inteligência artificial aplicada."
          />

          <Card hoverEffect={false} className="p-0 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-7 relative aspect-[4/3] lg:aspect-auto lg:min-h-[380px] w-full overflow-hidden">
                <Image
                  src="/images/equipe-data-science-ia.webp"
                  alt="Elias Ribeiro dos Reis com equipe multidisciplinar de TI, Infraestrutura, Data Science e IA"
                  fill
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-cover object-top"
                />
              </div>

              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center space-y-6 bg-[#151d1e]/95 border-t lg:border-t-0 lg:border-l border-[#3a494b]/70">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#00f2ff] uppercase tracking-wider">
                    <Users className="w-4 h-4" aria-hidden="true" />
                    <span>Infraestrutura &amp; Operações de TI</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#dce4e4]">
                    Continuidade Operacional &amp; Suporte Especializado
                  </h3>
                  <p className="text-sm sm:text-base text-[#b9cacb] leading-relaxed">
                    Integração com times de infraestrutura, redes e suporte N2/N3 para assegurar
                    disponibilidade, segurança de perímetro e governança em ambientes corporativos.
                  </p>
                </div>

                <div className="pt-5 border-t border-[#3a494b]/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#c0c1ff] uppercase tracking-wider">
                    <Cpu className="w-4 h-4" aria-hidden="true" />
                    <span>Data Science, Engenharia &amp; IA</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#dce4e4]">
                    Pipelines de Dados e Agentes Inteligentes
                  </h3>
                  <p className="text-sm sm:text-base text-[#b9cacb] leading-relaxed">
                    Trabalho conjunto em modelagem de dados, automação analítica em Python e
                    construção de fluxos com modelos generativos e validação contínua.
                  </p>
                </div>
              </div>
            </div>
          </Card>
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
              <Button variant="outline" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Ver Todas as Certificações ({courses.length})
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredCourses.map((course) => (
              <Card key={course.id} hoverEffect className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge category={course.category}>{course.category}</Badge>
                    <span className="text-xs font-mono text-[#00f2ff]">
                      {course.workloadHours ? `${course.workloadHours}h Comprovadas` : course.institution}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#dce4e4]">{course.title}</h3>
                  <p className="text-sm text-[#b9cacb] mt-1 font-semibold flex flex-wrap items-center gap-1.5">
                    <span className="text-[#00f2ff]">{course.institution}</span>
                    {course.technologyProvider && (
                      <span className="text-[#c0c1ff] font-mono text-xs">
                        ({course.technologyProvider})
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {course.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs font-mono px-2.5 py-1 rounded-[0.25rem] bg-[#151d1e] text-[#b9cacb] border border-[#3a494b]"
                      >
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
