# Portfólio Profissional v3.0 — Elias Ribeiro dos Reis

> **Plataforma de Demonstração de Engenharia de Software, Arquitetura de Sistemas, Nuvem, Inteligência Artificial & Cibersegurança.**

[![CI - Portfólio Profissional v3.0](https://github.com/5734Elias/Curr-culo-v.2.0/actions/workflows/ci.yml/badge.svg)](https://github.com/5734Elias/Curr-culo-v.2.0/actions/workflows/ci.yml)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![WCAG 2.2 AA](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-success)](#acessibilidade)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Visão Geral

Este projeto é a evolução do currículo digital para uma aplicação web moderna de portfólio de engenharia de software em nível de produção. Construído com arquitetura limpa, segurança rigorosa por padrão, dados estritamente auditados e suporte a temas claro/escuro.

### 🌟 Destaques de Engenharia
- **Design System Tecnológico:** Interface dark mode premium e light mode acessível com alternador instantâneo sem flash visual (FOUC).
- **Segurança Reforçada:** Cabeçalhos HTTP avançados (CSP estrita, HSTS, X-Frame-Options DENY) e conformidade com OWASP.
- **Formulário de Contato Anti-Spam & LGPD:** Proteção com honeypot, rate limiting anonimizado via SHA-256 e eliminação de falso sucesso (integração real com Resend + fallback para e-mail direto).
- **SEO Técnico & Dados Estruturados:** JSON-LD em `@graph` (`Person`, `WebSite`, `BreadcrumbList`, `TechArticle`), sitemap canônico e OpenGraph completo.
- **Acessibilidade Universal (WCAG 2.2 AA):** Suporte nativo a `prefers-reduced-motion`, foco visível para teclado e alvos de toque calibrados para dispositivos móveis (mínimo 44px).
- **QA Automatizado & CI/CD:** Suíte quíntupla de testes cobrindo dados, segurança, consistência de fontes únicas, SEO e acessibilidade, integrada ao GitHub Actions.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias Utilizadas |
|---|---|
| **Framework & SSR** | Next.js 16.3.0 (App Router), React 19.2.8 |
| **Linguagem & Tipagem** | TypeScript 5 (Strict Mode) |
| **Estilização & Design** | Tailwind CSS 4, Lucide React, Glassmorphism, Canvas API |
| **Validação de Dados** | Zod 4.4 |
| **Mensageria & Serviços** | Abstração de E-mail (Resend API HTTPS) |
| **Qualidade & Testes** | ESLint 9, Node Test Runner com TypeScript (TSX) |
| **Automação & Deploy** | GitHub Actions CI, Vercel Ready |

---

## 📂 Estrutura do Repositório

```text
Curr-culo-v.2.0-main/
├── .github/
│   └── workflows/
│       └── ci.yml               # Pipeline de integração contínua (Lint, Test, Build)
├── docs/                        # Documentação técnica e governança
│   ├── ARCHITECTURE.md          # Arquitetura e padrões de engenharia
│   ├── DEVELOPMENT.md           # Guia de desenvolvimento local
│   ├── SECURITY.md              # Políticas de segurança e LGPD
│   ├── TESTING.md               # Estratégia de testes automatizados
│   ├── DEPLOYMENT.md            # Guia de deploy na Vercel
│   ├── SEO.md                   # Estratégia técnica de SEO
│   ├── ACCESSIBILITY.md         # Diretrizes WCAG 2.2 AA
│   ├── AUDIT_BASELINE.md        # Relatório de diagnóstico inicial
│   ├── EXECUTION_CHECKLIST.md   # Checklist de progresso por fases
│   ├── CHANGELOG.md             # Histórico de versões
│   └── adr/                     # Registros de Decisões de Arquitetura
├── Currículo/
│   ├── .agents/                 # Personas de agentes de IA e catálogo de skills
│   └── frontend/                # Aplicação web Next.js
│       ├── src/
│       │   ├── app/             # Rotas do App Router (19 rotas estáticas/SSG/API)
│       │   ├── components/      # UI, Layout, Motion e Efeitos
│       │   ├── data/            # Fonte única de dados (Profile, Projects, Courses)
│       │   ├── lib/             # Utilitários de segurança e rate limit
│       │   ├── schemas/         # Schemas Zod de validação
│       │   ├── services/        # Camada de serviços (ContactService)
│       │   └── types/           # Contratos desacoplados de tipagem
│       ├── scripts/             # Suíte quíntupla de testes automatizados
│       ├── .env.example         # Template seguro de variáveis de ambiente
│       └── package.json
└── README.md
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js:** versão 20.x ou superior recomendada.
- **NPM:** versão 10.x ou superior.

### 1. Clonar e Acessar o Projeto
```bash
git clone https://github.com/5734Elias/Curr-culo-v.2.0.git
cd Curr-culo-v.2.0/Currículo/frontend
```

### 2. Instalar Dependências
```bash
npm ci
```

### 3. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```
*(As variáveis de mensageria são opcionais para desenvolvimento; sem chave da API, o sistema ativa o modo informativo com fallback seguro).*

### 4. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

---

## 🧪 Suíte de Testes & Qualidade

Para executar a validação completa com a suíte quíntupla de testes automatizados:

```bash
# Executa Lint, Checagem de Tipos e Suíte de Testes
npm run lint
npm run typecheck
npm run test
```

A suíte `npm run test` valida:
1. **Dados de Cursos:** Unicidade de IDs e carga horária verificada (2.164,5h).
2. **Segurança & Contato:** Schemas Zod, Rate Limiter e anonimização de IP por SHA-256.
3. **Consistência de Fonte Única:** Sincronização entre `PROFILE`, `PROJECTS` e rotas.
4. **Auditoria de SEO:** Conformidade de robots.txt, sitemap.xml e URLs canônicas.
5. **Acessibilidade:** Diretrizes WCAG 2.2 AA e dimensões de toque para mobile.

---

## 🛡️ Políticas de Segurança & Privacidade

Este projeto implementa o conceito de **Privacy & Security by Design**:
- Nenhum IP de visitante é mantido em texto claro no servidor.
- Proteção nativa contra ataques comuns (XSS, Clickjacking, MIME sniffing, Form spam).
- As mensagens só são declaradas enviadas se houver entrega confirmada pelo provedor.

Consulte [`docs/SECURITY.md`](docs/SECURITY.md) para detalhes completos.

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.

---

**Autor:** [Elias Ribeiro dos Reis](https://www.linkedin.com/in/elias-ribeiro-dos-reis-3b289a43)  
**Portfólio Web:** [https://eliasreis.dev](https://eliasreis.dev)  
**GitHub:** [@5734Elias](https://github.com/5734Elias)

