# Registro de Riscos Técnicos e Operacionais (Risk Register)

**Data de Atualização:** 2026-10-28  
**Projeto:** Currículo Profissional v3.0 (`curr-culo-v-2-0-8kbn`)

---

## 1. Matriz de Riscos Mapeados e Mitigações

| ID | Risco Técnico / Operacional | Severidade | Probabilidade | Impacto | Estratégia de Mitigação e Controles Aplicados | Status |
|---|---|---|---|---|---|---|
| **RSK-01** | Falso sucesso no contato ou tentativa de envio com remetente não autorizado (`@resend.dev`) | **Crítica** | Baixa | Alto: Perda de contato de recrutadores e clientes | Na fase atual (domínio gratuito `.vercel.app` sem domínio de e-mail próprio), `/contato` opera em modo transparente de abertura do cliente de e-mail (`mailto:elias.re_is@hotmail.com`) com botão **"Enviar e-mail"**, LinkedIn e GitHub diretos. `contactService.ts` bloqueia `MOCK_EMAIL_SERVICE` e remetentes `@resend.dev` em produção | **Mitigado** |
| **RSK-02** | Ausência de variáveis do Upstash Redis na Vercel caso a API `/api/contact` seja acionada diretamente | **Alta** | Baixa | Baixo: Requisições diretas à API recebem HTTP 503 | Política *Fail-Closed* ativa por padrão em produção (retorna HTTP 503 com `Retry-After: 60`), impedindo bypass de rate limit mesmo sem Redis configurado. Guia de conexão gratuita do Upstash documentado em `docs/DEPLOYMENT.md` | **Mitigado (Fail-Closed) / Pendente Conexão Opcional** |
| **RSK-03** | Retrabalho de código ao adquirir domínio próprio no futuro | **Média** | Baixa | Baixo: Esforço de manutenção em múltiplos arquivos | Criado `src/lib/siteConfig.ts` (`getSiteUrl()` e `isContactApiEnabled()`). Basta definir `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_CONTACT_API_ENABLED="true"` nas variáveis da Vercel quando o domínio for adquirido | **Mitigado** |
| **RSK-04** | Bypass de rate limiting em múltiplas instâncias Serverless | **Alta** | Baixa | Médio: Abuso de endpoint `/api/contact` | Script Lua atômico (`EVAL` com `INCR` + `PTTL`/`PEXPIRE`) para Upstash Redis REST, cota de 5 requisições/hora por hash `SHA-256(ip + salt)` e *Fail-Closed* por padrão em produção | **Mitigado** |
| **RSK-05** | Spoofing de cabeçalhos de IP por clientes externos | **Alta** | Baixa | Médio: Evasão de rate limiting por falsificação de cabeçalho | `extractClientIp` prioriza `x-vercel-forwarded-for` e `x-forwarded-for` (primeiro IP válido), com validação estrita IPv4/IPv6 e remoção de cabeçalhos não verificados | **Mitigado** |
| **RSK-06** | Vulnerabilidades em dependências (`npm audit`) | **Crítica** | Baixa | Alto: Riscos de RCE e DoS | Atualizados `next` e `eslint-config-next` para `16.4.3`, `zod` para `^4.6.6` e aplicadas correções em `sharp`, `brace-expansion`, `js-yaml` e `source-map-js`. Resultado atual do `npm audit`: **0 vulnerabilidades (`found 0 vulnerabilities`)** | **Resolvido (0 Vulnerabilidades)** |
| **RSK-07** | Projetos legados na Vercel (`curr-culo-v-2-0` e `curr-culo-v-2-0-bx4q`) gerando checks vermelhos no GitHub | **Baixa** | Certa | Baixo: Ruído visual nos checks do Pull Request | Projeto oficial `curr-culo-v-2-0-8kbn` (`Currículo/frontend`) compila com sucesso. Desvinculação Git dos projetos antigos documentada em `docs/DEPLOYMENT.md` aguardando autorização do proprietário | **Documentado / Aguardando Autorização** |
| **RSK-08** | Limitação de cobertura de testes automatizados de acessibilidade | **Baixa** | Baixa | Baixo: Diferenças em leitores de tela reais | Scripts automatizados verificam semântica HTML, skip-link, `prefers-reduced-motion`, ARIA e `min-h: 44px`, mas não substituem auditoria assistiva manual (NVDA/VoiceOver) | **Risco Residual Documentado** |
