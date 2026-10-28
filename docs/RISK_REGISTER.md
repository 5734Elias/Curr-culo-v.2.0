# Registro de Riscos Técnicos (Risk Register)

**Data de Atualização:** 2026-10-28<br>
**Projeto:** Portfólio Profissional v3.0

---

| ID | Risco Técnico | Severidade | Probabilidade | Impacto | Estratégia de Mitigação | Status |
|---|---|---|---|---|---|---|
| **RSK-01** | Falso sucesso no formulário de contato (mensagens não são entregues) | **Crítica** | Baixa | Alto: Perda de oportunidades profissionais de recrutadores | Camada `contactService.ts` com Resend, fallback transparente e proibição estrita de mock em produção | **Mitigado** |
| **RSK-02** | Vulnerabilidades em dependências | **Crítica** | Baixa | Alto: Riscos de DoS e RCE | Pacotes monitorados e compatibilidade de build com Next.js 16.3 e React 19 validada | Em Monitoramento |
| **RSK-03** | Falha de Build no Windows com Turbopack em produção | **Alta** | Baixa | Médio: Impossibilidade de gerar builds locais consistentes | Configurado script de build com `--webpack` garantindo compilação estável multiplataforma | **Mitigado** |
| **RSK-04** | Rate limiter in-memory bypassado em ambiente Serverless | **Alta** | Baixa | Médio: Vulnerabilidade a spam de formulários na Vercel | Implementado suporte nativo a REST Redis distribuído (Upstash/KV) com pipeline atômico e fallback resiliente | **Mitigado** |
| **RSK-05** | Ausência ou fraqueza de Headers de Segurança HTTP (CSP, HSTS) | **Alta** | Baixa | Médio: Exposição a Clickjacking e injeção de scripts não autorizados | CSP rigorosa no `next.config.ts`, `unsafe-eval` eliminado em produção e `script-src-attr 'none'` ativo | **Mitigado** |
| **RSK-06** | Inconsistência de perfis e redes sociais | **Média** | Baixa | Baixo: Link quebrado ou perfil incorreto para recrutadores | Fonte Única da Verdade em `profile.ts` sincronizada e testada em `validate-data-consistency.mjs` | **Mitigado** |
| **RSK-07** | Efeitos de Matrix e animações sem suporte a acessibilidade | **Média** | Baixa | Médio: Problema de acessibilidade e desconforto visual | Suporte nativo a `prefers-reduced-motion` no CSS e alvos mínimos de 44px verificados por testes | **Mitigado** |
| **RSK-08** | Ausência de testes de regressão para segurança e acessibilidade | **Média** | Baixa | Médio: Riscos de regressão técnica silenciosa | Suíte automatizada contínua com 6 baterias de testes em `npm run test` | **Mitigado** |
