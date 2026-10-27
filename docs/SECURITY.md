# Políticas de Segurança & Conformidade LGPD

---

## 1. Proteção de Cabeçalhos HTTP (`next.config.ts`)

O arquivo de configuração do Next.js aplica cabeçalhos de segurança obrigatórios para todas as rotas:

```typescript
// Content-Security-Policy (CSP)
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src 'self' https://api.resend.com;
frame-ancestors 'none';
form-action 'self';

// Strict-Transport-Security (HSTS)
max-age=63072000; includeSubDomains; preload

// Outros
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
```

---

## 2. Conformidade LGPD por Design

- **Anonimização de Endereço IP:** O sistema nunca armazena o endereço IP em texto puro. O rate limiter calcula o hash unidirecional `SHA-256(ip + salt)`, impedindo a identificação direta do visitante em caso de inspeção de logs.
- **Minimização de Dados:** O formulário de contato coleta estritamente o necessário (nome, e-mail, assunto e mensagem) com termo explícito de consentimento.
- **Honeypot Anti-Bot:** O campo invisível `websiteHoneypot` descarta silenciosamente submissões automatizadas de robôs sem expor detalhes internos.

---

## 3. Gestão de Segredos e Variáveis de Ambiente

- Arquivos `.env`, `.env.local` e credenciais estão estritamente bloqueados no `.gitignore`.
- O repositório contém apenas `.env.example` documentando chaves públicas sem valores confidenciais.
