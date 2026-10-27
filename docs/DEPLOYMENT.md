# Guia de Publicação & Deploy (Vercel & CI/CD)

---

## 1. Fluxo de Integração Contínua (GitHub Actions)

A cada `git push` nas branches `main` ou `master`, o workflow `.github/workflows/ci.yml` executa automaticamente:

```text
[ Git Push / PR ]
       │
       ▼
[ GitHub Actions Runner (ubuntu-latest) ]
   ├── 1. Checkout do Repositório
   ├── 2. Setup Node.js v20 com cache npm
   ├── 3. npm ci
   ├── 4. npm run lint
   ├── 5. npm run typecheck
   ├── 6. npm run test (Suíte Quíntupla de QA)
   └── 7. npm run build (Geração Estática Next.js)
```

Qualquer falha de tipagem, teste ou lint interrompe o pipeline e impede o deploy de versões com regressão.

---

## 2. Deploy na Vercel

### Configuração Inicial
1. Conecte o repositório GitHub à sua conta na [Vercel](https://vercel.com).
2. Configure as seguintes opções do projeto:
   - **Root Directory:** `Currículo/frontend`
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm ci`

### Variáveis de Ambiente na Vercel
Adicione no painel da Vercel (`Settings` > `Environment Variables`):
- `RESEND_API_KEY`: Chave da API do Resend (para envio real de e-mails de contato).
- `CONTACT_DESTINATION_EMAIL`: E-mail de destino (ex: `elias.re_is@hotmail.com`).
- `CONTACT_FROM_EMAIL`: E-mail remetente autenticado no Resend.
- `RATE_LIMIT_SALT`: Segredo aleatório para cálculo de hash do rate limiter.

---

## 3. Procedimento de Rollback

Na eventualidade de qualquer incidente em produção:
1. Acesse o painel da Vercel em **Deployments**.
2. Localize a versão anterior que obteve validação verde.
3. Clique em **Instant Rollback**. O tráfego será redirecionado imediatamente para a compilação estável anterior.

