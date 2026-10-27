# Registro de Riscos Técnicos (Risk Register)

**Data:** 2026-10-27  
**Projeto:** Portfólio Profissional v3.0  

---

| ID | Risco Técnico | Severidade | Probabilidade | Impacto | Estratégia de Mitigação | Status |
|---|---|---|---|---|---|---|
| **RSK-01** | Falso sucesso no formulário de contato (mensagens não são entregues) | **Crítica** | Alta | Alto: Perda de oportunidades profissionais de recrutadores | Criar camada de serviço com provedor real (Resend/Webhook/Email), fallback gracioso e status de configuração pendente caso falte credencial | Em Correção |
| **RSK-02** | Vulnerabilidades em dependências (`next`, `zod`, `brace-expansion`, etc.) | **Crítica** | Média | Alto: Riscos de DoS e RCE | Atualizar pacotes via `npm audit fix` e validar compatibilidade de build | Planejado |
| **RSK-03** | Falha de Build no Windows com Turbopack em produção | **Alta** | Alta | Médio: Impossibilidade de gerar builds locais consistentes | Configurar o script de build para utilizar `--webpack` garantindo estabilidade multiplataforma | Mitigado |
| **RSK-04** | Rate limiter in-memory bypassado em ambiente Serverless | **Alta** | Alta | Médio: Vulnerabilidade a spam de formulários na Vercel | Implementar token bucket / sliding window com hashing de IP e suporte a armazenamento externo quando configurado | Em Correção |
| **RSK-05** | Ausência de Headers de Segurança HTTP (CSP, HSTS, X-Frame-Options) | **Alta** | Alta | Médio: Exposição a Clickjacking e injeção de scripts não autorizados | Adicionar configuração rigorosa de cabeçalhos no `next.config.ts` | Em Correção |
| **RSK-06** | Inconsistência de perfis e redes sociais (LinkedIn divergente) | **Média** | Alta | Baixo: Link quebrado ou perfil incorreto para recrutadores | Centralizar dados em `src/data/profile.ts` como Fonte Única da Verdade | Em Correção |
| **RSK-07** | Efeitos de Matrix e animações sem suporte a `prefers-reduced-motion` | **Média** | Média | Médio: Problema de acessibilidade (WCAG 2.2 AA) | Adicionar verificação de acessibilidade e redução de movimento nos componentes de efeito | Planejado |
| **RSK-08** | Ausência de suíte de testes automatizados | **Média** | Alta | Médio: Riscos de regressão a cada nova funcionalidade | Implementar testes com Vitest / React Testing Library para componentes e serviços | Planejado |
