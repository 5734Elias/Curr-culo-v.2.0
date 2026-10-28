# Checklist de Execução e Homologação — Currículo Profissional v3.0

**Legenda de Status:**
- `[x]` Concluído e comprovado com evidência técnica
- `[ ]` Opcional / Plano futuro no painel Vercel

---

## Fase 1: Publicação no Domínio Gratuito da Vercel (`.vercel.app`)
- [x] Arquitetura preservada: Next.js 16 (`16.4.3`), React 19 (`19.2.8`), TypeScript 5 e Tailwind CSS v4
- [x] Configuração centralizada `src/lib/siteConfig.ts` apontando por padrão para `https://curr-culo-v-2-0-8kbn.vercel.app`
- [x] `layout.tsx`, `sitemap.ts`, `robots.ts` e `projetos/[slug]/page.tsx` atualizados com `getSiteUrl()` e HTTPS (`HSTS`)
- [x] Preview protegido por *Vercel Authentication* durante a homologação

## Fase 2: Upstash Redis e Rate Limiting
- [x] Script Lua atômico (`EVAL` com `INCR` + `PTTL` + `PEXPIRE`) e limite de 5 requisições/hora por IP anonimizado
- [x] Política *Fail-Closed* ativa por padrão em produção (HTTP 503 com `Retry-After: 60`)
- [ ] **Opcional no Painel Vercel:** Conectar banco Upstash Redis gratuito em `curr-culo-v-2-0-8kbn` > *Storage* (necessário apenas quando ativar o formulário automático via API)

## Fase 3: Adaptação do Contato Sem Domínio Próprio
- [x] Página `/contato` adaptada para envio direto pelo aplicativo de e-mail do visitante (`mailto:elias.re_is@hotmail.com` com assunto e mensagem preparados)
- [x] Botão principal explícito **"Enviar e-mail"** e aviso claro de abertura do cliente de e-mail local sem transmissão de dados a servidores externos
- [x] Links diretos para LinkedIn (`elias-ribeiro-dos-reis-3b289a43`) e GitHub (`5734Elias`) verificados e alinhados ao `PROFILE`
- [x] Módulo Resend (`contactService.ts`) e rota `/api/contact` preservados para ativação futura via `NEXT_PUBLIC_CONTACT_API_ENABLED="true"`, bloqueando remetentes `@resend.dev` não autorizados em produção

## Fase 4: Preparação para Futura Ativação de Domínio Próprio
- [x] Plano de 8 etapas documentado em `docs/DEPLOYMENT.md` (aquisição, DNS na Vercel, validação DKIM/SPF/DMARC no Resend, variáveis `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_CONTACT_API_ENABLED="true"` e `NEXT_PUBLIC_SITE_URL` sem retrabalho de código)

## Fase 5 a 8: Experiência, Segurança (`0 Vulnerabilities`), Validação e CI/CD
- [x] Atualização de segurança compatível (`next@16.4.3`, `eslint-config-next@16.4.3`, `zod@^4.6.6` e subdependências): **`npm audit` com 0 vulnerabilidades**
- [x] Execução limpa de `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test` (7 suítes via `npx tsx`) e `npm run build` (19 rotas)
- [x] Publicação na branch `fix/technical-audit-remediation` e confirmação do GitHub Actions e Vercel Preview sem realizar merge automático na `main`
