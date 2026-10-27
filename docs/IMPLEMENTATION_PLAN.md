# Plano de Implementação - Evolução para Currículo v3.0

**Modo:** Engenharia de Software Autônoma Supervisionada  
**Projeto:** Currículo v2.0 -> Portfólio Profissional v3.0  
**Data:** 2026-10-27  

---

## Fases do Projeto

### Fase 0: Diagnóstico e Baseline (CONCLUÍDO)
- [x] Inventário completo de rotas, dependências, scripts e componentes.
- [x] Verificação de lint (`npm run lint`), typecheck (`npm run typecheck`), testes existentes (`npm run test`) e build de produção (`npm run build`).
- [x] Identificação de vulnerabilidades (`npm audit`) e diagnóstico de Turbopack vs Webpack.
- [x] Emissão dos relatórios de baseline (`AUDIT_BASELINE.md`, `ARCHITECTURE_CURRENT.md`, `RISK_REGISTER.md`).

### Fase 1: Correções Funcionais e Segurança (EM ANDAMENTO)
- [ ] **1.1 Formulário de Contato:**
  - Criar abstração de serviço de mensagens (`src/services/contactService.ts`).
  - Suporte a envio real via provedor (ex.: Resend, Webhook) configurável via variáveis de ambiente.
  - Eliminação de falso sucesso: se o serviço não estiver configurado ou falhar, informar o usuário de forma transparente com fallback (e-mail direto `mailto:`).
  - Proteção antispam robusta (honeypot + sanitização rigorosa de entradas).
- [ ] **1.2 Rate Limiting Seguro:**
  - Sanitização do cabeçalho `x-forwarded-for` (extração do IP de borda real, hashing com salt para privacidade/LGPD).
  - Algoritmo deslizante estruturado para controle de abuso.
- [ ] **1.3 Headers de Segurança HTTP:**
  - Configurar `next.config.ts` com CSP (Content Security Policy), HSTS, X-Content-Type-Options, X-Frame-Options (DENY), Referrer-Policy e Permissions-Policy.
- [ ] **1.4 Resolução de Inconsistências de Dados:**
  - Unificar `src/app/layout.tsx` e `src/data/profile.ts`, garantindo que o LinkedIn e redes sociais usem uma única fonte de dados verdadeira.
- [ ] **1.5 Ajuste de Scripts de Build:**
  - Ajustar o comando `build` no `package.json` para `--webpack` prevenindo o panic do Turbopack no Windows.

### Fase 2: Redesign Premium UI/UX & Acessibilidade
- [ ] Refinar paleta tecnológica escura e adicionar tokens semânticos e modo claro/escuro acessível.
- [ ] Implementar respeito obrigatório a `prefers-reduced-motion` no fundo Matrix e transições.
- [ ] Melhorar contrastes de texto para atendimento irrestrito à WCAG 2.2 AA.
- [ ] Adicionar Skip-to-Content para navegação por teclado.

### Fase 3: Evolução do Conteúdo do Portfólio
- [ ] Refinar a apresentação dos 4 projetos existentes adicionando arquitetura visual, métricas comprovadas e links seguros.
- [ ] Estruturar a página de Competências por domínios técnicos (Backend Java/Spring, Python, Nuvem, IA, Cibersegurança) eliminando porcentagens arbitrárias.
- [ ] Aprimorar a experiência de leitura e impressão do currículo em `/curriculo`.

### Fase 4: Arquitetura, DRY e Refatoração
- [ ] Modularizar a estrutura de pastas seguindo a separação de responsabilidades (services, schemas, components/ui, components/layout).
- [ ] Eliminar qualquer duplicação de texto biográfico ou metadados.

### Fase 5: SEO Técnico Avançado
- [ ] Implementar JSON-LD completo (`Person`, `WebSite`, `BreadcrumbList`) derivado diretamente de `src/data/profile.ts`.
- [ ] Otimizar OpenGraph tags e Twitter Cards para compartilhamento em redes sociais.
- [ ] Validar e aprimorar `sitemap.ts` e `robots.ts`.

### Fase 6: Otimização de Performance
- [ ] Medição de Core Web Vitals (LCP, CLS, INP).
- [ ] Redução de carga inicial de JavaScript e isolamento de Client Components.

### Fase 7: Testes Automatizados e QA
- [ ] Configurar Vitest e React Testing Library para execução de testes unitários e de integração de formulário/schemas.
- [ ] Criar testes para o serviço de contato, rate limiter e schemas Zod.

### Fase 8: CI/CD e Documentação Final
- [ ] Configurar GitHub Actions Workflow para validação contínua (Lint -> Typecheck -> Test -> Build).
- [ ] Atualizar README.md com guia de instalação, arquitetura e variáveis de ambiente documentadas em `.env.example`.

