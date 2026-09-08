import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PROFILE } from '@/data/profile';
import { Shield, Code, Award, ArrowRight, CheckCircle, UserCheck } from 'lucide-react';

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
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="glass-panel rounded-[0.25rem] p-6 bg-[#192122] border border-[#00f2ff]/30 space-y-4 text-center">
                <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden border-2 border-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.25)]">
                  <Image
                    src="/images/Eu.jpg"
                    alt="Foto de Elias Ribeiro dos Reis"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#dce4e4]">{PROFILE.name}</h3>
                  <p className="text-xs font-mono text-[#00f2ff]">{PROFILE.role}</p>
                  <p className="text-xs text-[#b9cacb] mt-1">{PROFILE.location}</p>
                </div>
                <div className="pt-2">
                  <Link href="/contato">
                    <Button variant="primary" size="sm" className="w-full">
                      Entrar em Contato
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6 text-sm text-[#b9cacb] leading-relaxed">
            <h3 className="text-2xl font-bold text-[#dce4e4]">
              Transformando Desafios Operacionais em Soluções Tecnológicas Escaláveis
            </h3>

            <p>
              Sou Analista de Sistemas e Desenvolvedor com sólida formação técnica pelo SENAI e histórico contínuo de aprendizado prático. Ao longo da minha carreira, atuei desde o suporte técnico N2/N3 e manutenção de infraestrutura até o desenvolvimento de sistemas corporativos, gerenciamento de bancos de dados relacionais e implementação de pipelines de automação.
            </p>

            <p>
              Com a evolução acelerada da tecnologia, especializei-me em áreas estratégicas como <strong className="text-[#00f2ff]">Inteligência Artificial Generativa</strong> (utilizando Google Antigravity e Microsoft AI Foundry), <strong className="text-[#c0c1ff]">Cibersegurança Defensiva e Pentest</strong> (Fortinet FCA, Python para Segurança e Análise Forense) e <strong className="text-[#74f5ff]">Nuvem AWS / Azure</strong>.
            </p>

            <div className="p-4 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] space-y-2">
              <div className="flex items-center gap-2 text-[#00f2ff] font-mono text-xs uppercase font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Compromisso com Fatos e Transparência</span>
              </div>
              <p className="text-xs">
                Todas as minhas qualificações, certificações e projetos publicados possuem comprovação factual verificável (documentação SENAI, repositórios GitHub e credenciais autorizadas).
              </p>
            </div>
          </div>
        </div>

        {/* Princípios de Trabalho */}
        <section className="space-y-8">
          <h3 className="text-xl font-bold text-[#dce4e4] border-b border-[#3a494b] pb-3 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#00f2ff]" />
            <span>Valores e Princípios de Engenharia</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hoverEffect>
              <CardHeader>
                <div className="w-8 h-8 rounded-[0.25rem] bg-[#00f2ff]/10 border border-[#00f2ff]/30 flex items-center justify-center text-[#00f2ff] mb-2">
                  <Code className="w-4 h-4" />
                </div>
                <CardTitle className="text-base">Código Limpo & Tipado</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#b9cacb]">
                Priorizo legibilidade, desacoplamento de responsabilidades, tipagem estrita com TypeScript/Python e testes automatizados.
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardHeader>
                <div className="w-8 h-8 rounded-[0.25rem] bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 flex items-center justify-center text-[#ffb4ab] mb-2">
                  <Shield className="w-4 h-4" />
                </div>
                <CardTitle className="text-base">Segurança por Padrão (AppSec)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#b9cacb]">
                Sanitização de entradas, proteção de dados (LGPD), menor privilégio e políticas ativas de cibersegurança em todas as camadas.
              </CardContent>
            </Card>

            <Card hoverEffect>
              <CardHeader>
                <div className="w-8 h-8 rounded-[0.25rem] bg-[#c0c1ff]/10 border border-[#c0c1ff]/30 flex items-center justify-center text-[#c0c1ff] mb-2">
                  <Award className="w-4 h-4" />
                </div>
                <CardTitle className="text-base">Aprendizado Contínuo</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#b9cacb]">
                Atualização constante em ecossistemas de ponta como Agentes de IA, Engenharia de Prompts, RAG e Arquiteturas Cloud.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA para Experiência */}
        <div className="p-8 rounded-[0.25rem] glass-panel bg-[#192122] border border-[#00f2ff]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-[#dce4e4]">Deseja ver meu histórico de atuação nas empresas?</h4>
            <p className="text-xs text-[#b9cacb] mt-1">
              Confira os cargos, responsabilidades em Ação + Contexto + Efeito e métricas de resultado.
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
