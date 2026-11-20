import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PROFILE } from '@/data/profile';
import { Shield, Code, Award, ArrowRight, CheckCircle, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: `Sobre & Visão de Engenharia | ${PROFILE.name}`,
  description:
    'Conheça a trajetória técnica, princípios de engenharia e proposta de valor profissional de Elias Ribeiro dos Reis.',
};

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        <SectionHeader
          badge="Sobre Mim & Visão de Engenharia"
          title="Trajetória Técnica & Proposta de Valor"
          description="Evolução contínua conectando infraestrutura de TI, desenvolvimento de sistemas, ciência de dados, computação em nuvem, inteligência artificial e segurança cibernética."
        />

        {/* Perfil & Resumo Executivo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="glass-panel rounded-[0.375rem] overflow-hidden bg-[#192122] border border-[#00f2ff]/30">
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                  <Image
                    src="/images/elias-sobre-office.webp"
                    alt="Retrato profissional de Elias Ribeiro dos Reis em estação de engenharia de software"
                    fill
                    sizes="(max-width: 1024px) 92vw, 384px"
                    priority
                    className="object-cover object-top"
                  />
                </div>
                <div className="p-6 space-y-4 text-center border-t border-[#3a494b]/70">
                  <div>
                    <h2 className="text-xl font-bold text-[#dce4e4]">{PROFILE.name}</h2>
                    <p className="text-xs font-mono text-[#00f2ff] mt-1">{PROFILE.role}</p>
                    <p className="text-sm text-[#b9cacb] mt-1">{PROFILE.location}</p>
                  </div>
                  <div className="pt-1">
                    <Link href="/contato">
                      <Button variant="primary" size="md" className="w-full">
                        Entrar em Contato
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6 text-base text-[#b9cacb] leading-relaxed">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#dce4e4] leading-snug">
              Transformando Desafios Operacionais em Soluções Tecnológicas Escaláveis
            </h3>

            <p>
              Sou Analista de Sistemas e Desenvolvedor com sólida formação técnica pelo SENAI e
              histórico contínuo de aprendizado prático. Ao longo da minha carreira, atuei desde o
              suporte técnico N2/N3 e manutenção de infraestrutura até o desenvolvimento de sistemas
              corporativos, gerenciamento de bancos de dados relacionais e implementação de
              pipelines de automação.
            </p>

            <p>
              Com a evolução acelerada da tecnologia, especializei-me em áreas estratégicas como{' '}
              <strong className="text-[#00f2ff]">Inteligência Artificial Generativa</strong>{' '}
              (utilizando Google Antigravity e Microsoft AI Foundry),{' '}
              <strong className="text-[#c0c1ff]">Cibersegurança Defensiva e Pentest</strong>{' '}
              (Fortinet FCA, Python para Segurança e Análise Forense) e{' '}
              <strong className="text-[#74f5ff]">Nuvem AWS / Azure</strong>.
            </p>

            <div className="p-5 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] space-y-2">
              <div className="flex items-center gap-2 text-[#00f2ff] font-mono text-xs uppercase font-bold">
                <CheckCircle className="w-4 h-4" aria-hidden="true" />
                <span>Compromisso com Fatos e Transparência</span>
              </div>
              <p className="text-sm text-[#b9cacb]">
                Todas as minhas qualificações, certificações e projetos publicados possuem
                comprovação factual verificável (documentação SENAI, repositórios GitHub e
                credenciais autorizadas).
              </p>
            </div>
          </div>
        </div>

        {/* Princípios de Trabalho */}
        <section className="space-y-8">
          <h3 className="text-xl font-bold text-[#dce4e4] border-b border-[#3a494b] pb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#00f2ff]" aria-hidden="true" />
            <span>Valores e Princípios de Engenharia</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverEffect>
              <CardHeader>
                <div className="w-10 h-10 rounded-[0.25rem] bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff] mb-2">
                  <Code className="w-5 h-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-lg">Código Limpo &amp; Tipado</CardTitle>
              </CardHeader>
              <CardContent className="text-sm sm:text-base text-[#b9cacb] leading-relaxed">
                Priorizo legibilidade, desacoplamento de responsabilidades, tipagem estrita com
                TypeScript/Python e testes automatizados.
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardHeader>
                <div className="w-10 h-10 rounded-[0.25rem] bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 flex items-center justify-center text-[#ffb4ab] mb-2">
                  <Shield className="w-5 h-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-lg">Segurança por Padrão (AppSec)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm sm:text-base text-[#b9cacb] leading-relaxed">
                Sanitização de entradas, proteção de dados (LGPD), menor privilégio e políticas
                ativas de cibersegurança em todas as camadas.
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardHeader>
                <div className="w-10 h-10 rounded-[0.25rem] bg-[#c0c1ff]/10 border border-[#c0c1ff]/30 flex items-center justify-center text-[#c0c1ff] mb-2">
                  <Award className="w-5 h-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-lg">Aprendizado Contínuo</CardTitle>
              </CardHeader>
              <CardContent className="text-sm sm:text-base text-[#b9cacb] leading-relaxed">
                Atualização constante em ecossistemas de ponta como Agentes de IA, Engenharia de
                Prompts, RAG e Arquiteturas Cloud.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA para Experiência */}
        <div className="p-8 rounded-[0.25rem] glass-panel bg-[#192122] border border-[#00f2ff]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-[#dce4e4]">
              Deseja ver meu histórico de atuação nas empresas?
            </h4>
            <p className="text-sm text-[#b9cacb] mt-1">
              Confira os cargos, responsabilidades em Ação + Contexto + Efeito e métricas de
              resultado.
            </p>
          </div>
          <Link href="/experiencia">
            <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Ver Experiência Profissional
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
