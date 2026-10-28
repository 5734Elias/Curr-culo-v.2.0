# Guia de Publicação, Operação & Plano de Domínio Futuro (Vercel & CI/CD)

---

## 1. Fluxo de Integração Contínua (GitHub Actions)

A cada `git push` ou atualização de Pull Request para `main`, o workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) executa em `ubuntu-latest`:

```text
[ Git Push / Pull Request ]
       │
       ▼
[ GitHub Actions Runner (ubuntu-latest / Node.js 20) ]
   ├── 1. Checkout do Repositório (actions/checkout@v4)
   ├── 2. Setup Node.js v20 com cache npm (Currículo/frontend/package-lock.json)
   ├── 3. npm ci (Instalação limpa e determinística)
   ├── 4. npm run lint (ESLint 9 + eslint-config-next 16.4.3)
   ├── 5. npm run typecheck (TypeScript 5 tsc --noEmit)
   ├── 6. npm run test (7 baterias de testes executadas via npx tsx)
   └── 7. npm run build (Next.js 16.4.3 build --webpack)
```

---

## 2. Publicação Atual no Domínio Gratuito da Vercel (`.vercel.app`)

### 2.1 Projeto Oficial
- **Nome do Projeto:** `curr-culo-v-2-0-8kbn` (`prj_zASS41DERn6OMe5xzoSJ7P4hIxQW`)
- **Domínio Gratuito Padrão:** `https://curr-culo-v-2-0-8kbn.vercel.app`
- **Root Directory:** `Currículo/frontend`
- **Resolução Automática de URLs Canônicas ([`src/lib/siteConfig.ts`](../Currículo/frontend/src/lib/siteConfig.ts)):**
  - `layout.tsx`, `sitemap.ts`, `robots.ts` e `projetos/[slug]/page.tsx` utilizam `getSiteUrl()`, que resolve automaticamente para `NEXT_PUBLIC_SITE_URL`, `VERCEL_PROJECT_PRODUCTION_URL` ou `https://curr-culo-v-2-0-8kbn.vercel.app` com HTTPS forçado (`Strict-Transport-Security`).
- **Fluxo de Contato Atual (Sem Domínio Próprio de E-mail):**
  - Enquanto `NEXT_PUBLIC_CONTACT_API_ENABLED` permanece `"false"` (padrão), a página `/contato` opera em modo direto: exibe o botão principal **"Enviar e-mail"** (`mailto:elias.re_is@hotmail.com`) que abre o aplicativo de e-mail do visitante com assunto e mensagem preparados, acompanhado dos links diretos para LinkedIn e GitHub, sem transmitir dados para servidores externos nem utilizar remetentes `@resend.dev` não verificados.

### 2.2 Configuração do Upstash Redis (Plano Gratuito no Vercel Marketplace)
1. Acesse o painel da [Vercel](https://vercel.com/dashboard) > projeto **`curr-culo-v-2-0-8kbn`**.
2. Abra a aba **Storage** > **Create Database** > selecione **Upstash for Redis** e escolha o plano **Free** (sem custo).
3. Conecte o banco ao projeto marcando os escopos **Production** e **Preview** (injeta `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` ou `KV_REST_API_URL` e `KV_REST_API_TOKEN`).
4. Em **Settings** > **Environment Variables**, adicione opcionalmente `RATE_LIMIT_SALT` (string aleatória de 32+ caracteres).

### 2.3 Projetos Legados na Vercel (`curr-culo-v-2-0` e `curr-culo-v-2-0-bx4q`)
- Mantidos sem exclusão automática. Para interromper os checks de build duplicados nos Pull Requests, após autorização do proprietário: acesse cada projeto legado > confirme em **Settings > Domains** que não há domínio ativo > vá em **Settings > Git > Connected Git Repository** > clique em **Disconnect**.

---

## 3. Plano Futuro para Ativação de Domínio Próprio e Envio Automático (Resend)

A arquitetura em [`src/lib/siteConfig.ts`](../Currículo/frontend/src/lib/siteConfig.ts), [`src/services/contactService.ts`](../Currículo/frontend/src/services/contactService.ts) e [`src/app/api/contact/route.ts`](../Currículo/frontend/src/app/api/contact/route.ts) foi preparada para **evitar retrabalho de código** quando um domínio próprio for adquirido:

1. **Adquirir um domínio próprio:** Registre o domínio desejado (ex.: `Registro.br`, `Cloudflare Registrar` ou `Vercel Domains`).
2. **Conectar o domínio à Vercel:** No projeto `curr-culo-v-2-0-8kbn` > **Settings** > **Domains**, adicione o domínio e aponte os registros `A` (`76.76.21.21`) e `CNAME` (`cname.vercel-dns.com`) conforme instruído pela Vercel.
3. **Validar o domínio no Resend:** Acesse [resend.com/domains](https://resend.com/domains) > **Add Domain** e informe seu domínio (ex.: `seudominio.com.br`).
4. **Configurar os registros DNS do Resend:** No provedor DNS do seu domínio, adicione os registros gerados pelo Resend:
   - **DKIM (`TXT`):** `resend._domainkey`
   - **SPF (`MX` e `TXT`):** no subdomínio `send`
   - **DMARC (`TXT`):** `_dmarc` (`v=DMARC1; p=none;`)
   - Clique em **Verify DNS Records** no Resend até obter status **Verified**.
5. **Definir `CONTACT_FROM_EMAIL` e `RESEND_API_KEY`:** Em `curr-culo-v-2-0-8kbn` > **Settings** > **Environment Variables** (*Production* e *Preview*), defina:
   - `RESEND_API_KEY`: chave gerada em `resend.com/api-keys`.
   - `CONTACT_FROM_EMAIL`: remetente do domínio verificado (ex.: `contato@seudominio.com.br`).
   - `CONTACT_DESTINATION_EMAIL`: `elias.re_is@hotmail.com`.
6. **Ativar o formulário de envio automático:** Nas variáveis de ambiente da Vercel, defina:
   - `NEXT_PUBLIC_CONTACT_API_ENABLED="true"`
7. **Atualizar URLs canônicas, sitemap e metadados:** Nas variáveis de ambiente da Vercel, defina:
   - `NEXT_PUBLIC_SITE_URL="https://seudominio.com.br"`
   - Execute um **Redeploy** na aba **Deployments** da Vercel. O `layout.tsx`, `sitemap.xml`, `robots.txt` e os schemas JSON-LD passarão automaticamente a usar o novo domínio.
8. **Testar o recebimento real:** Envie uma mensagem de teste em `/contato`, verifique o código `HTTP 200`, o `messageId` e o status **Delivered** no painel *Logs* do Resend.

---

## 4. Procedimento de Rollback

1. Acesse o projeto `curr-culo-v-2-0-8kbn` na Vercel > aba **Deployments**.
2. Selecione o deployment estável anterior e clique em **Instant Rollback**.
