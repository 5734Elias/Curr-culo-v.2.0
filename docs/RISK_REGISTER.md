# Registro de Riscos Técnicos e Operacionais (Risk Register)

**Data de Atualização:** 2026-10-28  
**Projeto:** Currículo Profissional v3.0 (`curr-culo-v-2-0-8kbn`)

---

## 1. Matriz de Riscos Mapeados e Mitigações

| ID | Risco Técnico / Operacional | Severidade | Probabilidade | Impacto | Estratégia de Mitigação e Controles Aplicados | Status |
|---|---|---|---|---|---|---|
| **RSK-01** | Falso sucesso no formulário de contato (mensagens descartadas sem ciência do visitante) | **Crítica** | Baixa | Alto: Perda de contato de recrutadores e clientes | `contactService.ts` proíbe `MOCK_EMAIL_SERVICE` quando `NODE_ENV === 'production'`. Na ausência de `RESEND_API_KEY` ou falha externa, retorna HTTP 503/502 e a UI preserva os dados digitados exibindo botão `mailto:` pré-preenchido | **Mitigado em Código / Pendente Chave na Vercel** |
| **RSK-02** | Ausência de variáveis do Upstash Redis e Resend no ambiente Vercel (`Preview` / `Production`) | **Alta** | Média | Alto: Formulário opera em *Fail-Closed* (HTTP 503), exigindo envio manual via `mailto:` | Política *Fail-Closed* impede spam/bypass enquanto o serviço não estiver ativo. Procedimento detalhado em `docs/DEPLOYMENT.md` para conexão do Upstash Redis e Resend na Vercel | **Pendente Ação Manual no Painel Vercel** |
| **RSK-03** | Remetente padrão `portfolio@resend.dev` restrito em produção | **Alta** | Alta (sem DNS) | Médio: Resend rejeita destinatários externos se o domínio de envio não for verificado | Documentado em `docs/DEPLOYMENT.md` o requisito de validação de domínio próprio via registros DNS (`DKIM`, `SPF`, `DMARC`) e configuração de `CONTACT_FROM_EMAIL` | **Pendente Verificação de Domínio DNS** |
| **RSK-04** | Bypass de rate limiting em múltiplas instâncias Serverless | **Alta** | Baixa | Médio: Abuso de cota da API de e-mail | Implementado script Lua atômico (`EVAL` com `INCR` + `PTTL`/`PEXPIRE`) para Upstash Redis REST, cota de 5 requisições/hora por hash `SHA-256(ip + salt)` e *Fail-Closed* (HTTP 503, `Retry-After: 60`) por padrão em produção | **Mitigado em Código** |
| **RSK-05** | Spoofing de cabeçalhos de IP por clientes externos | **Alta** | Baixa | Médio: Evasão de rate limiting por falsificação de cabeçalho | `extractClientIp` prioriza `x-vercel-forwarded-for` (injetado pela borda da Vercel) e `x-forwarded-for` (primeiro IP válido), com validação estrita IPv4/IPv6 e remoção de cabeçalhos de terceiros não verificados (`cf-connecting-ip`, `x-real-ip`) | **Mitigado** |
| **RSK-06** | Vulnerabilidades reportadas em `npm audit` (Next.js 16.3.0, Zod, Sharp e devDependencies) | **Alta** | Baixa | Médio: Potencial exposição caso recursos vulneráveis fossem utilizados | Análise de superfície: (1) Advisories de Next.js 16.3.0 afetam *Server Actions* e diretiva `'use cache'`, recursos **não utilizados** neste projeto (arquitetura SSG + Route Handler único `/api/contact`); (2) Advisory de Zod afeta coleções aninhadas gigantes, não aplicável ao schema plano de 6 campos primitivos; (3) `sharp` processa apenas imagens estáticas locais confiáveis; (4) `brace-expansion`, `js-yaml` e `source-map-js` são exclusivos de `devDependencies` (lint/build) | **Risco Residual Aceito / Monitorado** |
| **RSK-07** | Projetos legados na Vercel (`curr-culo-v-2-0` e `curr-culo-v-2-0-bx4q`) gerando checks vermelhos no GitHub | **Baixa** | Certa | Baixo: Ruído visual nos checks do Pull Request | Identificados os dois projetos com *Root Directory* na raiz `.`. O projeto oficial `curr-culo-v-2-0-8kbn` (`Currículo/frontend`) compila com sucesso. Desvinculação Git documentada aguardando autorização do proprietário | **Documentado / Aguardando Autorização** |
| **RSK-08** | Limitação de cobertura de testes automatizados de acessibilidade | **Baixa** | Baixa | Baixo: Diferenças de renderização em leitores de tela reais | Scripts automatizados verificam semântica HTML, skip-link, `prefers-reduced-motion`, ARIA e `min-h: 44px`, mas não substituem auditoria assistiva manual (NVDA/VoiceOver) | **Risco Residual Documentado** |

---

## 2. Decisões Arquiteturais e Limitações Conhecidas

1. **CSP Compatível com SSG (`script-src 'self' 'unsafe-inline'; script-src-attr 'none'`):**
   - No Next.js App Router com geração estática (SSG), a adoção de *nonces* por requisição exigiria renderização dinâmica em todas as rotas, eliminando o cache estático na CDN. Como mitigação compensatória, `unsafe-eval` é removido em produção, `script-src-attr 'none'` bloqueia handlers inline (`onclick`, `onerror`), `object-src 'none'` e `frame-ancestors 'none'` estão ativos e toda entrada de usuário passa por validação estrita e nunca é interpolada em HTML.
2. **Anonimização de Dados e Retenção Zero em Banco (LGPD):**
   - A aplicação não armazena mensagens ou dados pessoais em banco de dados persistente. O IP do visitante é transformado em hash irreversível `SHA-256(ip + salt)` com TTL máximo de 1 hora apenas para controle de taxa.
