# Guia de Publicação, Operação & Deploy (Vercel & CI/CD)

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
   ├── 4. npm run lint (ESLint 9 + eslint-config-next 16.3.0)
   ├── 5. npm run typecheck (TypeScript 5 tsc --noEmit)
   ├── 6. npm run test (7 baterias de testes executadas via npx tsx)
   └── 7. npm run build (Next.js 16.3.0 build --webpack)
```

Qualquer falha de tipagem, teste, lint ou build bloqueia o pipeline antes da integração na `main`.

---

## 2. Topologia de Projetos na Vercel

### 2.1 Projeto Oficial (Preservado e Ativo)
- **Nome do Projeto:** `curr-culo-v-2-0-8kbn`
- **Project ID:** `prj_zASS41DERn6OMe5xzoSJ7P4hIxQW`
- **Root Directory:** `Currículo/frontend`
- **Framework Preset:** Next.js (`16.3.0`)
- **Build Command:** `npm run build`
- **Install Command:** `npm ci`

### 2.2 Projetos Legados Identificados (Não Excluir sem Autorização)
Foram identificados dois projetos anteriores vinculados ao mesmo repositório GitHub:
1. `curr-culo-v-2-0` (`prj_SK5jGCarJjKsFCZo53gkWyff6pnV`) — *Root Directory* configurado na raiz `.` (falha ao buscar `package.json`).
2. `curr-culo-v-2-0-bx4q` (`prj_kmnjQYMtWE2pUnLHvibfuBKss2cm`) — *Root Directory* configurado na raiz `.` (falha ao buscar `package.json`).

#### Procedimento Seguro para Desvinculação Git dos Projetos Legados (Mediante Autorização do Proprietário)
> **Importante:** Não utilize `exit 0` em *Ignored Build Step* para mascarar falhas de build nem exclua os projetos sem antes auditar domínios anexados.

1. Acesse o painel da [Vercel](https://vercel.com/dashboard) e abra cada projeto legado (`curr-culo-v-2-0` e `curr-culo-v-2-0-bx4q`).
2. Vá em **Settings** > **Domains** e confirme se não há nenhum domínio customizado ativo vinculado a eles que deva ser movido para `curr-culo-v-2-0-8kbn`.
3. Vá em **Settings** > **Environment Variables** e verifique se existe alguma credencial que precise ser copiada para o projeto oficial.
4. Após confirmar que não há dependências ativas, acesse **Settings** > **Git** > seção **Connected Git Repository** e clique em **Disconnect**. Isso interrompe os deployments duplicados nos Pull Requests mantendo o histórico preservado.

---

## 3. Configuração Obrigatória de Serviços Externos na Vercel

Por segurança (*Fail-Closed* por padrão em produção), a rota `POST /api/contact` retorna **HTTP 503 (`SERVICE_UNAVAILABLE`)** enquanto o Redis distribuído e o serviço de e-mail Resend não estiverem configurados no projeto oficial `curr-culo-v-2-0-8kbn`.

### 3.1 Provisionamento e Conexão do Upstash Redis
1. No painel da Vercel, abra o projeto oficial **`curr-culo-v-2-0-8kbn`**.
2. No menu superior, clique na aba **Storage** > botão **Create Database** (ou **Connect Store**).
3. Selecione **Upstash** > **Upstash for Redis** (Serverless Redis) no Vercel Marketplace e siga o fluxo de criação na região mais próxima (ex.: `gru1` São Paulo ou `iad1` US East).
4. Ao conectar o banco ao projeto `curr-culo-v-2-0-8kbn`, marque obrigatoriamente os ambientes **Production** e **Preview**.
5. Vá em **Settings** > **Environment Variables** e confirme que as variáveis foram injetadas (sem expor seus valores):
   - `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (ou `KV_REST_API_URL` e `KV_REST_API_TOKEN`).
6. Adicione também uma variável `RATE_LIMIT_SALT` (string aleatória de 32+ caracteres hexadecimais) nos escopos **Production** e **Preview** para anonimização consistente de IP (LGPD).

### 3.2 Configuração do Resend e Verificação de Domínio DNS
> **Atenção Crítica para Produção:** O remetente padrão `portfolio@resend.dev` (ou `onboarding@resend.dev`) é restrito pelo Resend exclusivamente para testes destinados ao próprio e-mail do titular da conta Resend. Em produção, para receber mensagens e usar `CONTACT_DESTINATION_EMAIL` livremente, é necessário validar um domínio próprio no Resend.

1. Acesse o painel do [Resend](https://resend.com/domains) e clique em **Add Domain** (ex.: `eliasreis.dev` ou subdomínio `mail.seudominio.com.br`).
2. Adicione no provedor DNS do seu domínio os registros fornecidos pelo Resend:
   - **DKIM (`TXT`):** `resend._domainkey` com a chave pública gerada pelo Resend.
   - **SPF (`TXT` e `MX`):** no subdomínio de envio (`send`), autorizando a infraestrutura da Amazon SES/Resend.
   - **DMARC (`TXT` recomendado):** `_dmarc` com valor `v=DMARC1; p=none;`.
3. Clique em **Verify DNS Records** no painel do Resend até que o status mude para **Verified**.
4. Vá em **API Keys** > **Create API Key** (permissão: *Sending access*, restrita ao domínio verificado).
5. No painel da Vercel (`curr-culo-v-2-0-8kbn` > **Settings** > **Environment Variables**), cadastre nos escopos **Production** e **Preview**:
   - `RESEND_API_KEY`: chave secreta gerada (`re_...`).
   - `CONTACT_FROM_EMAIL`: endereço do domínio verificado (ex.: `contato@seudominio.com.br`).
   - `CONTACT_DESTINATION_EMAIL`: caixa postal que receberá os contatos (ex.: `elias.re_is@hotmail.com`).
6. Após salvar as variáveis do Redis e do Resend, acesse a aba **Deployments** na Vercel e execute **Redeploy** no último commit da branch para aplicar as variáveis em execução.

---

## 4. Procedimento de Rollback

Em caso de anomalia operacional após uma publicação:
1. Acesse o projeto `curr-culo-v-2-0-8kbn` na Vercel > aba **Deployments**.
2. Localize o deployment anterior estável.
3. Clique no menu de três pontos (`...`) > **Instant Rollback** para reverter o tráfego imediatamente sem necessidade de nova compilação.
   - Em nível de código Git, o histórico linear permite reversão não destrutiva via `git revert <commit-sha>`.
