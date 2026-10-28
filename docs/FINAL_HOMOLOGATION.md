# Relatório de Homologação Técnica e Operacional — Currículo Profissional v3.0

**Data:** 2026-10-28  
**Repositório:** `https://github.com/5734Elias/Curr-culo-v.2.0`  
**Pull Request:** `https://github.com/5734Elias/Curr-culo-v.2.0/pull/1`  
**Branch de Homologação:** `fix/technical-audit-remediation`  
**Branch Base:** `main`  

---

## 1. Versões Reais das Dependências (`Currículo/frontend/package.json`)

| Pacote | Categoria | Versão Instalada / Declarada |
|---|---|---|
| `next` | Framework Full Stack | `16.3.0` |
| `react` / `react-dom` | Biblioteca UI | `19.2.8` |
| `typescript` | Compilador Estático | `^5` |
| `tailwindcss` / `@tailwindcss/postcss` | Estilização CSS | `^4` |
| `zod` | Validação de Schemas | `^4.4.3` |
| `lucide-react` | Ícones Vetoriais | `^1.31.0` |
| `clsx` / `tailwind-merge` | Utilitários de Classes | `^2.1.1` / `^3.6.0` |
| `eslint` / `eslint-config-next` | Linter Estático | `^9` / `16.3.0` |
| `tsx` | Executor Nativo TypeScript (Testes) | `^4.19.2` |

---

## 2. Arquitetura Implantada e Projeto Vercel Oficial

- **Diretório da Aplicação:** `Currículo/frontend`
- **Modelo de Renderização:**
  - **SSG (Static Site Generation):** 14 páginas estáticas e estudos de caso (`/`, `/sobre`, `/competencias`, `/formacao`, `/curriculo`, `/contato`, `/projetos`, `/projetos/[slug]`, `/robots.txt`, `/sitemap.xml`).
  - **ISR (Incremental Static Regeneration):** `/experiencia` com `revalidate = 86400` (24h) para cálculo dinâmico de tempo de carreira.
  - **Serverless Route Handler:** `POST /api/contact` dinâmico (`ƒ`) com validação Zod, Honeypot, Rate Limiting distribuído e integração Resend.
- **Projeto Vercel Oficial:**
  - **Nome:** `curr-culo-v-2-0-8kbn` (`prj_zASS41DERn6OMe5xzoSJ7P4hIxQW`)
  - **Root Directory:** `Currículo/frontend`
  - **Status de Compilação na Vercel:** **READY / SUCCESS**
  - **Proteção de Preview:** Protegido por *Vercel Authentication* (`HTTP 401` / redirecionamento SSO para acessos não autenticados).
- **Projetos Vercel Legados (Identificados e Preservados):**
  - `curr-culo-v-2-0` (`prj_SK5jGCarJjKsFCZo53gkWyff6pnV`) e `curr-culo-v-2-0-bx4q` (`prj_kmnjQYMtWE2pUnLHvibfuBKss2cm`): falham no passo de build por estarem configurados com *Root Directory* na raiz do repositório (`.`). Não foram excluídos; recomenda-se desvincular a integração Git (*Settings > Git > Disconnect*) após conferência de domínios pelo proprietário.

---

## 3. Status das Integrações Externas (Upstash Redis & Resend)

### 3.1 Resultado dos Testes do Upstash Redis
- **Código e Arquitetura (`src/lib/rateLimit.ts`):**
  - Script Lua atômico (`EVAL`) executando `INCR`, `PTTL` e `PEXPIRE` na mesma operação, garantindo ausência de chaves órfãs sem TTL.
  - Limite configurado: **5 requisições por hora (3600s)** por hash `SHA-256(ip + salt)`.
  - Extração de IP alinhada à topologia real da Vercel (`x-vercel-forwarded-for` prioritário, `x-forwarded-for` secundário com validação estrita IPv4/IPv6).
  - Política *Fail-Closed* ativa por padrão em produção: quando `UPSTASH_REDIS_REST_URL`/`TOKEN` (ou `KV_REST_API_URL`/`TOKEN`) estão ausentes ou inacessíveis, a rota retorna **HTTP 503 (`SERVICE_UNAVAILABLE`)** com cabeçalho `Retry-After: 60`.
- **Verificação de Credenciais em Execução:**
  - No ambiente local e no runner do GitHub Actions, as variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` **não estão definidas** (por segurança, nenhum `.env` foi versionado).
  - No preview da Vercel (`curr-culo-v-2-0-8kbn`), o acesso externo direto à API sem sessão SSO da Vercel retorna HTTP 401 (*Protected by Vercel Authentication*). Portanto, **não foi possível comprovar conexão live com um cluster Redis real provisionado na conta Vercel**.
  - **Status da Integração Redis:** **Validado em código, mocks atômicos e runtime local (Fail-Closed HTTP 503 e Rate Limit HTTP 429 comprovados); PENDENTE confirmação/conexão das variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` no painel da Vercel.**

### 3.2 Evidências de Envio de E-mail (Resend)
- **Código e Segurança (`src/services/contactService.ts`):**
  - `MOCK_EMAIL_SERVICE` é estritamente bloqueado quando `NODE_ENV === 'production'`.
  - Na ausência de `RESEND_API_KEY`, retorna `{ success: false, notConfigured: true }`, resultando em **HTTP 503 (`SERVICE_NOT_CONFIGURED`)** na rota `/api/contact`.
- **Verificação de Envio Real:**
  - Nenhuma credencial `RESEND_API_KEY` está presente no ambiente de execução local. Consequentemente, **nenhum e-mail real foi disparado contra a API externa do Resend**, respeitando a diretriz de não forjar ou simular conclusão de etapa dependente de credencial do proprietário.
  - Adicionalmente, o remetente padrão de fallback `portfolio@resend.dev` não é adequado para produção aberta, exigindo validação de domínio próprio (`DKIM`, `SPF`, `DMARC`) no painel do Resend e definição de `CONTACT_FROM_EMAIL`.
  - **Status da Integração Resend:** **Validado em código, mocks e runtime local (HTTP 503 transparente + fallback `mailto:`); PENDENTE configuração de `RESEND_API_KEY` e domínio verificado na Vercel/Resend.**

---

## 4. Estado Funcional do Formulário (`/contato` e `/api/contact`)

Testado em execução real contra o servidor de produção Next.js (`next start`):

| Cenário | Resposta HTTP Real | Comportamento da Interface (`src/app/contato/page.tsx`) |
|---|---|---|
| **Sem Redis em Produção (Padrão)** | `503 Service Unavailable` (`Retry-After: 60`) | Exibe alerta de indisponibilidade temporária, **preserva todos os dados digitados** e exibe botão `mailto:` pré-preenchido |
| **Payload Inválido** | `400 Bad Request` (`INVALID_PAYLOAD`) | Exibe mensagens de erro específicas por campo sem apagar o formulário |
| **Honeypot Preenchido (`websiteHoneypot`)** | `200 OK` (`{"success":true,"message":"Mensagem recebida."}`) | Descarta silenciosamente sem acionar o Resend |
| **Sem `RESEND_API_KEY` configurada** | `503 Service Unavailable` (`SERVICE_NOT_CONFIGURED`) | Exibe aviso transparente e botão `mailto:` com nome, assunto e mensagem preenchidos |
| **Limite Excedido** | `429 Too Many Requests` (`Retry-After: 3600`) | Exibe mensagem de limite excedido e botão `mailto:` alternativo |

---

## 5. Separação Estrita das Evidências de Testes

1. **Testes Unitários (`npx tsx`):**
   - `validate-courses.mjs`: 65 cursos únicos, deduplicação e soma exata de 2.164,5 horas.
   - `validate-data-consistency.mjs`: Consistência cruzada do `PROFILE`, 4 slugs de projetos e 7 experiências profissionais.
   - `test-seo-and-routes.mjs`: `robots.ts` e `sitemap.ts` com 12 URLs canônicas.
   - Cálculo dinâmico de datas (`calculateDuration`, `getCurrentYearMonth`) em `test-audit-regressions.mjs`.
2. **Testes com Mocks (`npx tsx`):**
   - `test-security-and-contact.mjs` e `test-audit-regressions.mjs`: Simulação de API REST Upstash (`EVAL` Lua), concorrência com `Promise.all`, expiração de TTL, *Fail-Closed* vs modo degradado opt-in e simulação de envio de e-mail em `NODE_ENV=test`.
   - `test-services-verification.mjs`: Simulação de cluster Redis saudável/indisponível e validação estática da stack Next.js 16.3.0.
3. **Testes Integrados em Execução Real (Servidor Local `next start`):**
   - Inspeção HTTP real de todas as 14 rotas públicas (todas responderam `HTTP 200` com landmark `id="main-content"`).
   - Inspeção real dos cabeçalhos HTTP de segurança (`Content-Security-Policy` sem `unsafe-eval`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`).
   - Testes HTTP `POST /api/contact` reais comprovando retornos `400`, `200` (honeypot), `503` (fail-closed / sem Resend) e `429` (rate limit).
4. **Testes Estáticos de UI e Acessibilidade (`test-ui-accessibility.mjs`):**
   - Verificação de CSS (`prefers-reduced-motion`, `:focus-visible`, `@media print`), `min-h-[44px]` em botões, `ThemeToggle.tsx` nativo em React 19 (`useSyncExternalStore` + `MutationObserver` + `localStorage`) e Skip Link.
5. **Verificações Não Executadas (Dependência de Credenciais / Ambiente Externo):**
   - Execução contra cluster Upstash Redis real na nuvem (ausência de `UPSTASH_REDIS_REST_URL`/`TOKEN` no ambiente local).
   - Disparo real de e-mail via API externa do Resend (ausência de `RESEND_API_KEY` no ambiente local).
   - Auditoria manual assistiva com leitores de tela (NVDA/VoiceOver) e inspeção visual interativa autenticada no preview da Vercel (protegido por *Vercel Authentication* SSO).

---

## 6. Riscos Residuais e Pendências Operacionais

1. **Provisionamento de Variáveis na Vercel (Pendente):** Enquanto `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY` e `CONTACT_FROM_EMAIL` (com domínio DNS verificado) não forem configurados no projeto `curr-culo-v-2-0-8kbn`, o formulário responderá com HTTP 503 (*Fail-Closed*) e direcionará o visitante para o botão `mailto:`.
2. **Advisories de Dependências (`npm audit`):** Mapeadas 6 vulnerabilidades no relatório do npm (`next@16.3.0`, `zod`, `sharp` e pacotes de lint). Os vetores de ataque de Next.js (*Server Actions* e `'use cache'`) e Zod (coleções aninhadas gigantes) não são utilizados na arquitetura do projeto, e a restrição de manter a stack existente (`Next.js 16.3.0`) foi preservada.
3. **Projetos Vercel Legados:** `curr-culo-v-2-0` e `curr-culo-v-2-0-bx4q` permanecem gerando status de falha nos commits até que sua integração Git seja desvinculada manualmente pelo proprietário.

---

## 7. Recomendação Final

- **Qualidade de Código, Arquitetura, Build e Segurança Defensiva:** Aprovados sem regressões (`npm ci`, `lint`, `typecheck`, `test` e `build` com saída 0).
- **Decisão Operacional:** Manter o Pull Request #1 como rascunho (*Draft*) até que o proprietário conecte as variáveis do **Upstash Redis** e do **Resend** no projeto `curr-culo-v-2-0-8kbn` na Vercel e valide 1 envio real no preview, ou autorize expressamente a publicação operando exclusivamente com a contingência `mailto:`.

