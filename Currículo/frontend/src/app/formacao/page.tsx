'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { COURSES } from '@/data/courses';
import { Course } from '@/schemas/content';
import {
  Award,
  GraduationCap,
  Clock,
  ShieldCheck,
  Search,
  BookOpen,
  Building2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function FormacaoPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>('todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [showSecondaryExpansible, setShowSecondaryExpansible] = useState<boolean>(true);

  // Estatísticas Determinísticas
  const totalVerifiedHours = useMemo(() => {
    return COURSES.reduce((sum, c) => sum + (c.workloadHours ?? 0), 0);
  }, []);

  const totalUniqueInstitutions = useMemo(() => {
    return new Set(COURSES.map((c) => c.institution)).size;
  }, []);

  // Filtragem combinada por Grupo, Categoria e Busca
  const filteredCourses = useMemo(() => {
    return COURSES.filter((course) => {
      // Filtro por Grupo Institucional
      if (selectedGroup !== 'todos' && course.institutionGroup !== selectedGroup) {
        return false;
      }

      // Filtro por Categoria
      if (selectedCategory !== 'todos' && course.category !== selectedCategory) {
        return false;
      }

      // Filtro por Busca textual
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = course.title.toLowerCase().includes(query);
        const matchesInst = course.institution.toLowerCase().includes(query);
        const matchesTech = course.technologyProvider?.toLowerCase().includes(query) ?? false;
        const matchesSkills = course.skills.some((s) => s.toLowerCase().includes(query));
        return matchesTitle || matchesInst || matchesTech || matchesSkills;
      }

      return true;
    });
  }, [selectedGroup, selectedCategory, searchQuery]);

  // Separação em Cursos de Instituições em Destaque e Secundárias
  const featuredGroupCourses = useMemo(() => {
    return filteredCourses.filter((c) => c.issuerPriority === 'featured');
  }, [filteredCourses]);

  const secondaryGroupCourses = useMemo(() => {
    return filteredCourses.filter((c) => c.issuerPriority === 'standard');
  }, [filteredCourses]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <SectionHeader
          badge="Educação & Evidências Auditadas"
          title="Formação, Cursos & Certificações"
          description="Acervo completo de qualificações técnicas, treinamentos corporativos, especializações em IA/Cibersegurança/Nuvem e participações em eventos."
        />

        {/* RESUMO VERIFICÁVEL EM CARDS COMPACTOS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-[0.25rem] bg-[#192122] border border-[#00f2ff]/30 space-y-1">
            <div className="flex items-center justify-between text-[#00f2ff]">
              <span className="text-xs font-mono uppercase tracking-wider">Cursos Deduplicados</span>
              <BookOpen className="w-4 h-4" />
            </div>
            <p className="text-3xl font-extrabold text-[#dce4e4] font-mono">{COURSES.length}</p>
            <p className="text-[11px] text-[#b9cacb]">Certificados únicos conferidos</p>
          </div>

          <div className="p-5 rounded-[0.25rem] bg-[#192122] border border-[#c0c1ff]/30 space-y-1">
            <div className="flex items-center justify-between text-[#c0c1ff]">
              <span className="text-xs font-mono uppercase tracking-wider">Horas Comprovadas</span>
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-3xl font-extrabold text-[#dce4e4] font-mono">{totalVerifiedHours.toLocaleString('pt-BR')}h</p>
            <p className="text-[11px] text-[#b9cacb]">Em certificados com carga informada</p>
          </div>

          <div className="p-5 rounded-[0.25rem] bg-[#192122] border border-[#74f5ff]/30 space-y-1">
            <div className="flex items-center justify-between text-[#74f5ff]">
              <span className="text-xs font-mono uppercase tracking-wider">Instituições</span>
              <Building2 className="w-4 h-4" />
            </div>
            <p className="text-3xl font-extrabold text-[#dce4e4] font-mono">{totalUniqueInstitutions}</p>
            <p className="text-[11px] text-[#b9cacb]">SENAI, Ka Solution, Bradesco e outras</p>
          </div>
        </section>

        {/* FORMAÇÃO ACADÊMICA E TÉCNICA PRINCIPAL */}
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-[#dce4e4] border-b border-[#3a494b] pb-3 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#00f2ff]" />
            <span>Formação Acadêmica & Técnica</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card surfaceTier="interactive" activeGlow className="border-[#00f2ff]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="cyber">Diploma Técnico SENAI</Badge>
                  <span className="text-xs font-mono text-[#00f2ff]">Conclusão: 2023</span>
                </div>
                <CardTitle className="mt-2 text-lg">Técnico em Desenvolvimento de Sistemas</CardTitle>
                <CardDescription className="text-xs text-[#c0c1ff] font-semibold">
                  SENAI Suíço-Brasileiro Paulo Ernesto Tolle
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-[#b9cacb] space-y-2">
                <p>
                  Formação técnica completa em análise de sistemas, algoritmos, arquitetura de software, POO, modelagem de dados relacionais e ciclo de desenvolvimento.
                </p>
                <div className="flex items-center gap-2 font-mono text-[11px] text-[#00f2ff] pt-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Carga Horária: 1.200 Horas Comprovadas</span>
                </div>
              </CardContent>
            </Card>

            <Card surfaceTier="featured">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Ensino Médio</Badge>
                  <span className="text-xs font-mono text-[#849495]">Conclusão: 2000</span>
                </div>
                <CardTitle className="mt-2 text-lg">Ensino Médio Completo</CardTitle>
                <CardDescription className="text-xs text-[#b9cacb]">
                  Claudionor Augusto Dias
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-[#b9cacb]">
                Formação regular de ensino médio completa.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* BARRA DE BUSCA E FILTROS HIERÁRQUICOS */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3a494b] pb-6">
            <h3 className="text-lg font-bold text-[#dce4e4] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#00f2ff]" />
              <span>Cursos, Especializações & Certificações</span>
            </h3>

            {/* Campo de Busca */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#849495]" />
              <input
                type="text"
                placeholder="Buscar por curso, habilidade ou tecnologia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#151d1e] border border-[#3a494b] rounded-[0.25rem] pl-9 pr-4 py-1.5 text-xs text-[#dce4e4] placeholder-[#849495] focus:border-[#00f2ff] focus:outline-none"
              />
            </div>
          </div>

          {/* Filtros de Instituição em Destaque */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-[#00f2ff] uppercase tracking-wider mr-2">
                Instituições em Destaque:
              </span>
              <Button
                size="sm"
                variant={selectedGroup === 'todos' ? 'primary' : 'outline'}
                onClick={() => setSelectedGroup('todos')}
              >
                Todas ({COURSES.length})
              </Button>
              <Button
                size="sm"
                variant={selectedGroup === 'senai' ? 'primary' : 'ghost'}
                onClick={() => setSelectedGroup('senai')}
                className="border border-[#00f2ff]/30"
              >
                SENAI ({COURSES.filter((c) => c.institutionGroup === 'senai').length})
              </Button>
              <Button
                size="sm"
                variant={selectedGroup === 'ka-solution' ? 'primary' : 'ghost'}
                onClick={() => setSelectedGroup('ka-solution')}
                className="border border-[#c0c1ff]/30"
              >
                Ka Solution ({COURSES.filter((c) => c.institutionGroup === 'ka-solution').length})
              </Button>
              <Button
                size="sm"
                variant={selectedGroup === 'fundacao-bradesco' ? 'primary' : 'ghost'}
                onClick={() => setSelectedGroup('fundacao-bradesco')}
                className="border border-[#ffe173]/30"
              >
                Fundação Bradesco ({COURSES.filter((c) => c.institutionGroup === 'fundacao-bradesco').length})
              </Button>
              <Button
                size="sm"
                variant={selectedGroup === 'outras' ? 'primary' : 'ghost'}
                onClick={() => setSelectedGroup('outras')}
              >
                Outras Instituições ({COURSES.filter((c) => c.institutionGroup === 'outras').length})
              </Button>
            </div>

            {/* Filtro secundário por Categoria */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#3a494b]/40">
              <span className="text-[11px] font-mono text-[#849495] uppercase tracking-wider mr-2">
                Categoria:
              </span>
              {[
                { id: 'todos', label: 'Todas' },
                { id: 'desenvolvimento', label: 'Desenvolvimento' },
                { id: 'ia', label: 'IA Generativa' },
                { id: 'seguranca', label: 'Cibersegurança' },
                { id: 'dados', label: 'Dados & SQL' },
                { id: 'cloud', label: 'Nuvem AWS/Azure' },
                { id: 'infraestrutura', label: 'Infraestrutura' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-[0.25rem] transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-[#00f2ff]/20 text-[#00f2ff] border border-[#00f2ff]/40 font-semibold'
                      : 'text-[#b9cacb] hover:text-[#dce4e4] bg-[#151d1e] border border-[#3a494b]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SEÇÃO 1: CURSOS DE INSTITUIÇÕES EM DESTAQUE (SENAI, KA SOLUTION, BRADESCO) */}
        {featuredGroupCourses.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#00f2ff]">
              <Sparkles className="w-4 h-4 text-[#00f2ff]" />
              <span>Instituições Principais em Destaque ({featuredGroupCourses.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGroupCourses.map((course) => (
                <Card
                  key={course.id}
                  surfaceTier="featured"
                  hoverEffect
                  className="flex flex-col justify-between h-full bg-[#192122]/90 border border-[#00f2ff]/30 shadow-[0_0_12px_rgba(0,242,255,0.08)]"
                >
                  <div>
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge category={course.category}>{course.category}</Badge>
                        <span className="text-[11px] font-mono font-semibold text-[#00f2ff]">
                          {course.workloadHours ? `${course.workloadHours}h` : 'Carga não informada'}
                        </span>
                      </div>
                      <CardTitle className="text-base leading-snug">{course.title}</CardTitle>
                      <CardDescription className="text-xs text-[#b9cacb] mt-1 font-semibold flex items-center gap-1.5">
                        <span className="text-[#00f2ff]">{course.institution}</span>
                        {course.technologyProvider && (
                          <span className="text-[#c0c1ff] font-mono">({course.technologyProvider})</span>
                        )}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-2 space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#849495]">
                        <span>Tipo: {course.credentialType}</span>
                        <span>{course.issuedAt || 'Concluído'}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {course.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-[0.25rem] bg-[#151d1e] text-[#b9cacb] border border-[#3a494b]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="pt-3 border-t border-[#3a494b]/60">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setActiveCourse(course)}
                    >
                      Ver detalhes do curso
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO 2: OUTRAS INSTITUIÇÕES (EXPANSÍVEL) */}
        {secondaryGroupCourses.length > 0 && (
          <section className="space-y-6 pt-4 border-t border-[#3a494b]">
            <button
              onClick={() => setShowSecondaryExpansible(!showSecondaryExpansible)}
              className="w-full flex items-center justify-between p-4 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] text-left hover:border-[#849495] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#c0c1ff]" />
                <span className="text-sm font-mono font-bold text-[#dce4e4]">
                  Outras Instituições & Cursos de Extensão ({secondaryGroupCourses.length})
                </span>
                <span className="text-xs text-[#849495] hidden sm:inline">
                  (RL System, DIO, Softblue, Dev Samurai, Udemy, Programador Primata)
                </span>
              </div>
              {showSecondaryExpansible ? (
                <ChevronUp className="w-5 h-5 text-[#849495]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#849495]" />
              )}
            </button>

            {showSecondaryExpansible && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {secondaryGroupCourses.map((course) => (
                  <Card
                    key={course.id}
                    surfaceTier="informative"
                    hoverEffect
                    className="flex flex-col justify-between h-full bg-[#151d1e]/80 border border-[#3a494b]"
                  >
                    <div>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{course.category}</Badge>
                          <span className="text-[11px] font-mono text-[#849495]">
                            {course.workloadHours ? `${course.workloadHours}h` : 'Carga não informada'}
                          </span>
                        </div>
                        <CardTitle className="text-sm leading-snug">{course.title}</CardTitle>
                        <CardDescription className="text-xs text-[#b9cacb] mt-1">
                          {course.institution}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="pt-2 space-y-3">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#849495]">
                          <span>Tipo: {course.credentialType}</span>
                          <span>{course.issuedAt || 'Concluído'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {course.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] font-mono px-2 py-0.5 rounded-[0.25rem] bg-[#192122] text-[#b9cacb] border border-[#3a494b]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </div>

                    <CardFooter className="pt-3 border-t border-[#3a494b]/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setActiveCourse(course)}
                      >
                        Ver detalhes do curso
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {/* MODAL DE EVIDÊNCIA E DETALHES DO CURSO */}
        {activeCourse && (
          <Modal
            isOpen={!!activeCourse}
            onClose={() => setActiveCourse(null)}
            title={activeCourse.title}
            subtitle={`Instituição: ${activeCourse.institution}${
              activeCourse.technologyProvider ? ` (${activeCourse.technologyProvider})` : ''
            }`}
            footer={
              <Button variant="primary" size="sm" onClick={() => setActiveCourse(null)}>
                Concluir Visualização
              </Button>
            }
          >
            <div className="space-y-4 text-xs text-[#b9cacb]">
              <div className="p-4 rounded-[0.25rem] bg-[#151d1e] border border-[#00f2ff]/30 space-y-2">
                <div className="flex items-center gap-2 text-[#00f2ff] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Dados conferidos no certificado fornecido</span>
                </div>
                <p>
                  As informações exibidas foram extraídas do documento anexo conferido. Isso representa a verificação fiel do acervo apresentado.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-[11px] bg-[#192122] p-4 rounded-[0.25rem] border border-[#3a494b]">
                <div>
                  <span className="text-[#849495] block">INSTITUIÇÃO:</span>
                  <span className="text-[#dce4e4] font-semibold">{activeCourse.institution}</span>
                </div>
                <div>
                  <span className="text-[#849495] block">CARGA HORÁRIA:</span>
                  <span className="text-[#00f2ff] font-semibold">
                    {activeCourse.workloadHours
                      ? `${activeCourse.workloadHours} Horas Comprovadas`
                      : 'Carga horária não informada no certificado'}
                  </span>
                </div>
                <div>
                  <span className="text-[#849495] block">GRUPO INSTITUCIONAL:</span>
                  <span className="text-[#c0c1ff] font-semibold uppercase">{activeCourse.institutionGroup}</span>
                </div>
                <div>
                  <span className="text-[#849495] block">EMISSÃO / PERÍODO:</span>
                  <span className="text-[#dce4e4] font-semibold">{activeCourse.issuedAt || 'Informada em certificado'}</span>
                </div>
                {activeCourse.sourceFile && (
                  <div className="col-span-2 border-t border-[#3a494b] pt-2">
                    <span className="text-[#849495] block">REGISTRO INSTITUCIONAL / ARQUIVO:</span>
                    <span className="text-[#b9cacb] font-mono text-[10px]">{activeCourse.sourceFile}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-[#00f2ff] uppercase tracking-wider block">
                  Habilidades & Tópicos do Programa:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeCourse.skills.map((skill) => (
                    <Badge key={skill} variant="cyber">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </main>

      <Footer />
    </div>
  );
}
