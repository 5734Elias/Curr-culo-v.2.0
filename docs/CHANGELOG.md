# Changelog - Portfólio Profissional

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.
O formato baseia-se no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [3.0.0-phase6-8] - 2026-10-27

### Adicionado e Aprimorado
- **Desempenho & Core Web Vitals:** Otimizados avatares com atributos `sizes` e `priority` em Next.js Image, eliminando risco de CLS. Otimizada renderização do Canvas com pausa automática quando a aba está em segundo plano.
- **Suíte Completa de QA (5 Frentes de Testes):** Consolidado comando `npm run test` cobrindo dados de cursos, segurança e LGPD, consistência de fonte única, auditoria de SEO técnico e validação de acessibilidade WCAG 2.2 AA.
- **Pipeline CI/CD (GitHub Actions):** Criado `.github/workflows/ci.yml` configurado para executar validação automatizada em push e pull requests (Checkout, Node 20, Cache, Lint, Typecheck, Test, Build).

## [3.0.0-phase5] - 2026-10-27

### Aprimorado
- **Dados Estruturados Avançados (JSON-LD):** Adicionado schema `@graph` integrando `Person` e `WebSite` no layout global, além de `BreadcrumbList` e `TechArticle` nas páginas de estudo de caso de projetos.
- **Sitemap Canônico Estável:** Substituídas as datas dinâmicas falsas no `sitemap.ts` por data fixa e real da última auditoria, com prioridades semânticas (1.0 na Home, 0.8 nas páginas principais e 0.7 nos projetos).
- **Cards de Mídias Sociais:** Configuradas tags completas de OpenGraph e Twitter Cards (`summary_large_image`).
- **Suíte de Testes de SEO:** Adicionado script automatizado `test-seo-and-routes.mjs` validando indexabilidade, rotas críticas e segurança do robots.txt.

## [3.0.0-phase4] - 2026-10-27

### Aprimorado
- **Módulo Central de Tipos:** Criado `src/types/index.ts` desacoplando as definições de tipos (`ProfileData`, `ProjectCase`, `Course`, `Experience`) de schemas de validação de runtime.
- **Auditoria Cruzada de Dados (Single Source of Truth):** Desenvolvido script de teste `validate-data-consistency.mjs` que valida sincronização entre `PROFILE`, `PROJECTS`, `EXPERIENCES` e `COURSES`.
- **Slugs Canônicos:** Validado formato kebab-case e unicidade de todos os identificadores de projetos.
- **Tipagem Estrita:** Tipado `PROFILE: ProfileData` explicitamente.

## [3.0.0-phase3] - 2026-10-27

### Aprimorado
- **SEO & Metadados Dinâmicos de Projetos:** Implementada a função `generateMetadata` nas rotas dinâmicas `/projetos/[slug]`, gerando títulos, descrições e OpenGraph específicos para cada estudo de caso.
- **Navegação Acessível (Breadcrumbs):** Inserida trilha de navegação breadcrumbs com `<nav aria-label="Breadcrumb">` em cada projeto, com indicação de página atual (`aria-current="page"`).
- **Metadados Semânticos em Páginas Estáticas:** Adicionados metadados específicos para `/competencias`, `/experiencia` e `/sobre`, otimizando a indexabilidade e compartilhamento em redes.
- **Validação de Conteúdo:** Garantida a preservação estrita de dados factuais (sem certificações ou cargos inventados) em consonância com a regra de integridade.

## [3.0.0-phase2] - 2026-10-27

### Adicionado e Aprimorado
- **Tema Claro/Escuro (ThemeToggle):** Implementado botão acessível de alternância de tema no desktop e mobile, com prevenção de FOUC via script no `<head>` e tokens semânticos em `globals.css`.
- **Acessibilidade e WCAG 2.2 AA:**
  - Ajustados alvos de toque em botões (`Button.tsx`) com altura mínima de 44px para mobile.
  - Implementado suporte robusto a `useSyncExternalStore` no `ThemeToggle` evitando renderizações cascata no React 19.
- **Componentes de Feedback Visual:** Criados `LoadingState`, `ErrorState` e `EmptyState` em `src/components/ui/FeedbackStates.tsx`.
- **Estados Vazios em Listagens:** Integrado `EmptyState` à tela de `/projetos` quando nenhum resultado atende ao filtro.

## [3.0.0-phase1] - 2026-10-27

### Corrigido e Aprimorado
- **Falso Sucesso de Contato Eliminado:** Criada a camada de serviço `contactService.ts` com suporte a envio real por e-mail e tratamento transparente de status.
- **Proteção e Privacidade (LGPD):** Implementado `rateLimit.ts` com sanitização de cabeçalhos de proxy e anonimização criptográfica de IP com SHA-256 + salt antes do armazenamento.
- **Headers de Segurança HTTP:** Configurados CSP, HSTS, X-Content-Type-Options, X-Frame-Options (DENY), Referrer-Policy e Permissions-Policy em `next.config.ts`.
- **Single Source of Truth:** Centralizados os dados biográficos e links sociais (LinkedIn) em `src/data/profile.ts`, consumidos diretamente em `layout.tsx`.
- **Acessibilidade:** Adicionado skip link para navegação rápida por teclado.
- **Estabilidade de Build:** Adicionado `--webpack` no comando de build para contornar falha do Turbopack no Windows.
- **Testes Automatizados:** Adicionada suíte de testes `test-security-and-contact.mjs` validando schemas, rate limiter e serviços.

## [3.0.0-baseline] - 2026-10-27

### Adicionado
- Auditoria inicial de baseline (`docs/AUDIT_BASELINE.md`).
- Documentação da arquitetura corrente (`docs/ARCHITECTURE_CURRENT.md`).
- Registro de riscos técnicos e vulnerabilidades (`docs/RISK_REGISTER.md`).
- Plano de implementação estruturado por fases (`docs/IMPLEMENTATION_PLAN.md`).
- Checklist persistente de execução (`docs/EXECUTION_CHECKLIST.md`).

### Identificado
- Falha de falso sucesso na rota de API `/api/contact`.
- Instabilidade do Turbopack com PostCSS/Tailwind v4 no Windows.
- Ausência de headers de segurança HTTP em `next.config.ts`.
- Inconsistência de URL do LinkedIn entre `layout.tsx` e `profile.ts`.
