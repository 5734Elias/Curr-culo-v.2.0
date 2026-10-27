'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { CyberMatrixBackground, BackgroundVariant } from '@/components/effects/CyberMatrixBackground';
import { Shield, Code, Terminal, Award, CheckCircle, Sparkles, Layers, Cpu } from 'lucide-react';

export default function DesignSystemCatalogPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [bgVariant, setBgVariant] = useState<BackgroundVariant>('letter-glitch');
  const [bgOpacity, setBgOpacity] = useState<number>(0.12);

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1515] text-[#dce4e4] relative overflow-hidden">
      {/* Background Effect Instance for Prototype Testing */}
      <CyberMatrixBackground variant={bgVariant} opacity={bgOpacity} />

      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 relative z-10">
        <SectionHeader
          badge="Catálogo Design System & Protótipo Visual"
          title="Tokens Visuais, Provas Ambientais & Componentes (Google Stitch)"
          description="Demonstração interativa de botões, badges, cards de 3 superfícies, diálogos acessíveis e teste das 3 variações do ambiente Cyber Matrix."
        />

        {/* SEÇÃO DE AVALIAÇÃO DE PROTÓTIPOS VISUAIS (FASE 1) */}
        <section className="p-6 rounded-[0.25rem] bg-[#192122]/90 border border-[#00f2ff]/40 shadow-[0_0_20px_rgba(0,242,255,0.15)] space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3a494b] pb-4">
            <div>
              <span className="text-[11px] font-mono text-[#00f2ff] uppercase tracking-widest block mb-1">
                [ FASE 1: PROVAS VISUAIS ISOLADAS ]
              </span>
              <h3 className="text-xl font-bold text-[#dce4e4] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00f2ff]" />
                Seletor de Variações de Fundo Ambiental
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#b9cacb]">
              <span>Opacidade:</span>
              <input
                type="range"
                min="0.04"
                max="0.25"
                step="0.02"
                value={bgOpacity}
                onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                className="accent-[#00f2ff] cursor-pointer"
              />
              <span className="text-[#00f2ff] font-bold w-12">{Math.round(bgOpacity * 100)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setBgVariant('letter-glitch')}
              className={`p-4 rounded-[0.25rem] text-left transition-all border ${
                bgVariant === 'letter-glitch'
                  ? 'bg-[#00f2ff]/15 border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.3)]'
                  : 'bg-[#151d1e] border-[#3a494b] hover:border-[#849495]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[#00f2ff] uppercase">Variação A (Recomendada)</span>
                <Terminal className="w-4 h-4 text-[#00f2ff]" />
              </div>
              <h4 className="text-sm font-semibold text-[#dce4e4]">Letter Glitch Matrix</h4>
              <p className="text-xs text-[#b9cacb] mt-1">
                Fluxo discreto de glifos profissionais (01, TS, JS, AI, SQL, AWS, SEC, &#123; &#125;, &lt; /&gt;, λ).
              </p>
              <div className="mt-3 pt-2 border-t border-[#3a494b]/60 flex items-center justify-between text-[10px] font-mono text-[#849495]">
                <span>Estilo: Matrix Cyber</span>
                <span>FPS: 30 (Cap)</span>
              </div>
            </button>

            <button
              onClick={() => setBgVariant('threads')}
              className={`p-4 rounded-[0.25rem] text-left transition-all border ${
                bgVariant === 'threads'
                  ? 'bg-[#c0c1ff]/15 border-[#c0c1ff] shadow-[0_0_15px_rgba(192,193,255,0.3)]'
                  : 'bg-[#151d1e] border-[#3a494b] hover:border-[#849495]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[#c0c1ff] uppercase">Variação B</span>
                <Layers className="w-4 h-4 text-[#c0c1ff]" />
              </div>
              <h4 className="text-sm font-semibold text-[#dce4e4]">Threads Tecnológico</h4>
              <p className="text-xs text-[#b9cacb] mt-1">
                Rede de conexões e circuitos com pulsos luminosos de sinal entre nós em malha.
              </p>
              <div className="mt-3 pt-2 border-t border-[#3a494b]/60 flex items-center justify-between text-[10px] font-mono text-[#849495]">
                <span>Estilo: Network Topology</span>
                <span>FPS: 30 (Cap)</span>
              </div>
            </button>

            <button
              onClick={() => setBgVariant('dot-grid')}
              className={`p-4 rounded-[0.25rem] text-left transition-all border ${
                bgVariant === 'dot-grid'
                  ? 'bg-[#74f5ff]/15 border-[#74f5ff] shadow-[0_0_15px_rgba(116,245,255,0.3)]'
                  : 'bg-[#151d1e] border-[#3a494b] hover:border-[#849495]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[#74f5ff] uppercase">Variação C</span>
                <Cpu className="w-4 h-4 text-[#74f5ff]" />
              </div>
              <h4 className="text-sm font-semibold text-[#dce4e4]">Dot Grid Interativo</h4>
              <p className="text-xs text-[#b9cacb] mt-1">
                Matriz de pontos com iluminação radial sutil reativa ao movimento do cursor mouse.
              </p>
              <div className="mt-3 pt-2 border-t border-[#3a494b]/60 flex items-center justify-between text-[10px] font-mono text-[#849495]">
                <span>Estilo: Minimal Mesh</span>
                <span>FPS: 30 (Cap)</span>
              </div>
            </button>
          </div>
        </section>

        {/* Seção 1: Botões */}
        <section className="space-y-6">
          <h3 className="text-lg font-mono text-[#00f2ff] uppercase tracking-wider border-b border-[#3a494b] pb-2">
            1. Botões (Variants, Sizes & States)
          </h3>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary" leftIcon={<Terminal className="w-4 h-4" />}>
              Primary Button
            </Button>
            <Button variant="secondary" leftIcon={<Shield className="w-4 h-4" />}>
              Secondary Button
            </Button>
            <Button variant="outline" rightIcon={<Code className="w-4 h-4" />}>
              Outline Button
            </Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="primary" isLoading>
              Loading...
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 items-center pt-2">
            <Button size="sm" variant="primary">
              Small (sm)
            </Button>
            <Button size="md" variant="primary">
              Medium (md)
            </Button>
            <Button size="lg" variant="primary">
              Large (lg)
            </Button>
          </div>
        </section>

        {/* Seção 2: Badges e Chips */}
        <section className="space-y-6">
          <h3 className="text-lg font-mono text-[#00f2ff] uppercase tracking-wider border-b border-[#3a494b] pb-2">
            2. Badges & Chips Categorizados
          </h3>
          <div className="flex flex-wrap gap-3">
            <Badge category="desenvolvimento">Desenvolvimento</Badge>
            <Badge category="dados">Data Science & SQL</Badge>
            <Badge category="ia">IA Generativa & Agentes</Badge>
            <Badge category="cloud">AWS Cloud</Badge>
            <Badge category="seguranca">Cibersegurança & Pentest</Badge>
            <Badge category="infraestrutura">Infraestrutura & Redes</Badge>
            <Badge category="outros">Metodologias Ágeis</Badge>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Badge variant="cyber">Cyber Accent</Badge>
            <Badge variant="indigo">Electric Indigo</Badge>
            <Badge variant="outline">Outline Badge</Badge>
          </div>
        </section>

        {/* Seção 3: Cards Glassmorphism */}
        <section className="space-y-6">
          <h3 className="text-lg font-mono text-[#00f2ff] uppercase tracking-wider border-b border-[#3a494b] pb-2">
            3. Cards & Containers (Glassmorphism)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card hoverEffect>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge category="ia">IA Generativa</Badge>
                  <span className="text-[11px] font-mono text-[#849495]">2026</span>
                </div>
                <CardTitle className="mt-2">Google Antigravity & AI Foundry</CardTitle>
                <CardDescription>
                  Criação de agentes autônomos com RAG multimodal, observabilidade e prompts estruturados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#b9cacb] leading-relaxed">
                  Demonstração da estrutura de container com fundo escuro (#192122), bordas suaves e foco de luz Cyber Blue no hover.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs font-mono text-[#00f2ff]">STATUS: ATIVO</span>
                <Button size="sm" variant="outline">
                  Ver Detalhes
                </Button>
              </CardFooter>
            </Card>

            <Card activeGlow>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge category="seguranca">Cibersegurança</Badge>
                  <span className="text-[11px] font-mono text-[#849495]">Fortinet</span>
                </div>
                <CardTitle className="mt-2">Perímetro de Defesa Fortigate</CardTitle>
                <CardDescription>
                  Configuração de firewall de menor privilégio, IPS ativo e simulação de testes de pentest.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#b9cacb] leading-relaxed">
                  Card com estado ativo (activeGlow) em Cyber Blue contínuo para destacar itens de alta relevância.
                </p>
              </CardContent>
              <CardFooter>
                <span className="text-xs font-mono text-[#00f2ff]">100% PROTEGIDO</span>
                <Button size="sm" variant="primary">
                  Acessar Case
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Seção 4: Modais & Diálogos */}
        <section className="space-y-6">
          <h3 className="text-lg font-mono text-[#00f2ff] uppercase tracking-wider border-b border-[#3a494b] pb-2">
            4. Modais & Comprovantes Verificáveis
          </h3>
          <div>
            <Button variant="primary" leftIcon={<Award className="w-4 h-4" />} onClick={() => setModalOpen(true)}>
              Abrir Modal de Evidência
            </Button>

            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Certificado SENAI: Desenvolvimento de Aplicações com IA Generativa"
              subtitle="Emitido pelo SENAI em 2026 - Carga Horária: 40 horas"
              footer={
                <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                  Fechar Janela
                </Button>
              }
            >
              <div className="space-y-4 text-xs text-[#b9cacb]">
                <div className="p-4 rounded-[0.25rem] bg-[#151d1e] border border-[#3a494b] space-y-2">
                  <div className="flex items-center gap-2 text-[#00f2ff] font-semibold">
                    <CheckCircle className="w-4 h-4" />
                    <span>Autenticidade e Competências Verificadas</span>
                  </div>
                  <p>
                    Conteúdo programático coberto: Prompts estruturados, Gemini/Imagen, Vertex AI, geração automatizada de código, testes de IA e diretrizes de IA responsável.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
                  <div>
                    <span className="text-[#849495] block">INSTITUIÇÃO:</span>
                    <span className="text-[#dce4e4]">SENAI Suíço-Brasileiro</span>
                  </div>
                  <div>
                    <span className="text-[#849495] block">CARGA HORÁRIA:</span>
                    <span className="text-[#dce4e4]">40 Horas</span>
                  </div>
                </div>
              </div>
            </Modal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
