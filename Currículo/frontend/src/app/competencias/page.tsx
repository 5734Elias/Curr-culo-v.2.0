import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Code, Cpu, Shield, Database, Server, CheckCircle, ArrowRight } from 'lucide-react';

const SKILL_GROUPS = [
  {
    category: 'Desenvolvimento de Software',
    icon: Code,
    color: '#00f2ff',
    skills: [
      'JavaScript ES6+ / TypeScript',
      'Python',
      'C# .NET',
      'Java',
      'C & C++',
      'React.js & Next.js App Router',
      'APIs RESTful & Microsserviços',
      'Zod Validation',
    ],
    evidences: ['Técnico em Desenvolvimento de Sistemas (SENAI)', 'Desenvolvimento em JavaScript (60h)', 'Programação Java (120h)'],
  },
  {
    category: 'Inteligência Artificial Generativa',
    icon: Cpu,
    color: '#c0c1ff',
    skills: [
      'Agentes Autônomos de IA',
      'Google Antigravity Platform',
      'Microsoft AI Foundry',
      'Engenharia de Prompts Estruturados',
      'Arquiteturas RAG (Retrieval-Augmented Generation)',
      'Visão Computacional & Fala',
      'IA Responsável & Observabilidade',
    ],
    evidences: ['Google Antigravity AI (SENAI 40h 2026)', 'Microsoft AI Foundry (SENAI 40h 2026)', 'Microsoft AI-900'],
  },
  {
    category: 'Cibersegurança & Defesa Cibernética',
    icon: Shield,
    color: '#ffb4ab',
    skills: [
      'Fortinet FortiGate 7.4 (FCA Operator)',
      'Técnicas de Pentest & Scan de Vulnerabilidades',
      'Python para Cibersegurança',
      'Análise Forense Computacional',
      'Conformidade LGPD & Minimização de Dados',
      'Análise de Logs & Wireshark',
    ],
    evidences: ['Cibersegurança Fortinet (60h)', 'Pentest SENAI 2024', 'Análise Forense 2024', 'LGPD 2022'],
  },
  {
    category: 'Dados & Cloud Computing',
    icon: Database,
    color: '#74f5ff',
    skills: [
      'AWS Cloud Practitioner (IaaS, PaaS, SaaS)',
      'Microsoft Azure Fundamentals',
      'MySQL, PostgreSQL, Oracle',
      'Python para Data Science (Pandas & NumPy)',
      'Modelagem Relacional & SQL Avançado',
    ],
    evidences: ['AWS Cloud Practitioner (40h 2026)', 'Python Data Science (60h 2025)', 'Banco de Dados Data Science (40h)'],
  },
  {
    category: 'Infraestrutura & Sistemas Embarcados',
    icon: Server,
    color: '#b9cacb',
    skills: [
      'Linux & Administração de Redes',
      'Modelo OSI & Protocolos TCP/IP',
      'Microcontroladores Arduino (C/C++)',
      'Raspberry Pi (Python IoT)',
      'Redes Móveis 5G',
    ],
    evidences: ['Tecnologia da Informação (SENAI)', 'Arduino 2022', 'Raspberry Pi 2021', 'Desvendando o 5G'],
  },
];

export default function CompetenciasPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4]">
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <SectionHeader
          badge="Mapa Técnico de Competências"
          title="Habilidades & Evidências Verificáveis"
          description="Visão técnica estruturada de competências em desenvolvimento, inteligência artificial, cibersegurança, nuvem e bancos de dados, associadas às respectivas evidências factuais de formação."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SKILL_GROUPS.map((group) => {
            const IconComponent = group.icon;
            return (
              <Card key={group.category} hoverEffect className="bg-[#192122]/90 border border-[#3a494b] flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-[0.25rem] flex items-center justify-center shrink-0 border border-solid"
                        style={{
                          backgroundColor: `${group.color}15`,
                          borderColor: `${group.color}40`,
                          color: group.color,
                        }}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-lg">{group.category}</CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 pt-2">
                    {/* Lista de Habilidades */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono text-[#849495] uppercase tracking-wider block">
                        Competências Práticas:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {group.skills.map((skill) => (
                          <Badge key={skill} variant="outline">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Evidências de Aprendizado */}
                    <div className="p-3 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] space-y-2">
                      <span className="text-[11px] font-mono text-[#00f2ff] flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Evidências Factuais:
                      </span>
                      <ul className="space-y-1 text-xs text-[#b9cacb]">
                        {group.evidences.map((ev, i) => (
                          <li key={i} className="flex items-start gap-1.5 font-mono text-[11px]">
                            <span className="text-[#00f2ff]">•</span>
                            <span>{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="p-6 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#b9cacb]">
          <div>
            <h4 className="text-sm font-bold text-[#dce4e4]">Quer visualizar os certificados completos com carga horária?</h4>
            <p className="text-xs text-[#b9cacb] mt-0.5">Acesse a aba de formação e consulte todos os 25 comprovantes emitidos pelo SENAI.</p>
          </div>
          <Link href="/formacao">
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Ver Certificados & Formação
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
