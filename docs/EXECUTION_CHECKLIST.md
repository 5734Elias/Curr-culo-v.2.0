# Checklist de Execução e Homologação — Currículo Profissional v3.0

**Legenda de Status:**
- `[x]` Concluído e comprovado com evidência técnica
- `[ ]` Pendente de ação manual / credencial externa no painel Vercel/Resend
- `[!]` Bloqueado

---

## Fase 1: Diagnóstico e Integridade do Repositório Git
- [x] Verificação da raiz do repositório e subdiretório `Currículo/frontend`
- [x] Sincronização do remoto `origin` (`https://github.com/5734Elias/Curr-culo-v.2.0.git`)
- [x] Branch `fix/technical-audit-remediation` alinhada e sem arquivos órfãos ou segredos
- [x] Pull Request #1 aberto contra `main` (mantido em *Draft* conforme regra de governança)
- [x] Pipeline GitHub Actions (`CI - Portfólio Profissional v3.0`) aprovado

---

## Fase 2: Verificação do Upstash Redis e Rate Limiting
- [x] Implementação de script Lua atômico (`EVAL` com `INCR` + `PTTL` + `PEXPIRE`) em `src/lib/rateLimit.ts`
- [x] Cota configurada em **5 requisições por hora (3600 segundos)** por hash `SHA-256(ip + salt)`
- [x] Política *Fail-Closed* ativa por padrão em produção (retorna HTTP 503 com `Retry-After: 60` quando Redis não está configurado ou está inacessível)
- [x] Extração de IP alinhada ao contrato da Vercel (`x-vercel-forwarded-for` prioritário, `x-forwarded-for` secundário com validação IPv4/IPv6 estrita)
- [x] Testes unitários, de concorrência (`Promise.all`), expiração de TTL e falha de rede aprovados via `npx tsx`
- [x] Teste de execução HTTP real no servidor de produção Next.js (`next start`) comprovando retorno HTTP 503 (*Fail-Closed*) e HTTP 429 (*Rate Limit Exceeded*)
- [ ] **Ação Manual do Proprietário:** Conectar banco Upstash Redis no painel da Vercel (`curr-culo-v-2-0-8kbn` > *Storage*) nos escopos *Preview* e *Production* e executar teste live contra o cluster provisionado

---

## Fase 3: Verificação do Serviço de E-mail (Resend)
- [x] Abstração `src/services/contactService.ts` com bloqueio estrito de `MOCK_EMAIL_SERVICE` em `NODE_ENV === 'production'`
- [x] Tratamento de credencial ausente (`SERVICE_NOT_CONFIGURED` -> HTTP 503) e falha de provedor (`EMAIL_SEND_FAILED` -> HTTP 502) sem falso sucesso
- [ ] **Ação Manual do Proprietário:** Validar domínio de envio próprio no Resend (`DKIM`, `SPF`, `DMARC`) para substituir `portfolio@resend.dev` em produção
- [ ] **Ação Manual do Proprietário:** Cadastrar `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` e `CONTACT_DESTINATION_EMAIL` no projeto Vercel `curr-culo-v-2-0-8kbn` (*Preview* e *Production*) e executar 1 envio controlado de homologação

---

## Fase 4: Homologação Funcional do Formulário (`/contato` e `/api/contact`)
- [x] Validação Zod server-side e client-side com limites estritos (`name`: 2–100, `email`: máx 254, `subject`: 3–150, `message`: 10–2000, `websiteHoneypot`: máx 200, `consent`: obrigatório)
- [x] Honeypot antispam retornando HTTP 200 silencioso quando preenchido por bots sem acionar o Resend
- [x] Interface preserva integralmente os dados digitados pelo visitante quando ocorre erro (HTTP 429, 502, 503 ou falha de rede)
- [x] Botão de contingência `mailto:` gerado dinamicamente com `subject` e `body` contendo nome, e-mail e mensagem preenchidos pelo usuário

---

## Fase 5: Homologação Visual, Responsividade e Acessibilidade
- [x] Compilação e resposta HTTP 200 verificadas em execução real (`next start`) para todas as 14 rotas públicas e metadados (`robots.txt`, `sitemap.xml`)
- [x] Landmarks semânticos (`<main id="main-content">`, `<nav>`, `<footer>`) e Skip Link funcional presentes
- [x] Alternância de tema claro/escuro implementada nativamente em React 19 (`useSyncExternalStore` + `MutationObserver` + `localStorage` em `ThemeToggle.tsx`, sem `next-themes`)
- [x] Regras de `prefers-reduced-motion: reduce`, foco visível (`focus-visible`) e área mínima de toque (`min-h-[44px]`) verificadas
- [x] Ressalva técnica registrada: verificações automatizadas de código e DOM não substituem testes assistivos manuais com leitores de tela (NVDA/VoiceOver)

---

## Fase 6: Organização dos Projetos da Vercel
- [x] Projeto oficial identificado e validado: `curr-culo-v-2-0-8kbn` (`prj_zASS41DERn6OMe5xzoSJ7P4hIxQW`, *Root Directory*: `Currículo/frontend`) -> **Status: Ready / Success**
- [x] Projetos legados diagnosticados sem exclusão: `curr-culo-v-2-0` e `curr-culo-v-2-0-bx4q` (falham por *Root Directory* na raiz `.`)
- [ ] **Ação Manual / Autorização do Proprietário:** Auditar domínios nos projetos legados e desvincular a integração Git (*Settings > Git > Disconnect*) para eliminar checks duplicados no GitHub

---

## Fase 7 a 10: Segurança, Qualidade, Documentação e Pull Request
- [x] Cabeçalhos HTTP validados em runtime (`CSP` sem `unsafe-eval`, `HSTS`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`)
- [x] Auditoria de dependências (`npm audit`) analisada e documentada em `docs/RISK_REGISTER.md`
- [x] Execução limpa de `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test` (7 suítes via `npx tsx`) e `npm run build`
- [x] Documentação atualizada (`DEPLOYMENT.md`, `SECURITY.md`, `TESTING.md`, `RISK_REGISTER.md`, `FINAL_HOMOLOGATION.md`, `EXECUTION_CHECKLIST.md`)
- [x] Evidências publicadas no Pull Request #1 sem execução de merge automático ou deploy não autorizado em produção
