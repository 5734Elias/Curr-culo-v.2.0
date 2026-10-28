# Políticas de Segurança & Conformidade LGPD

---

## 1. Proteção de Cabeçalhos HTTP (`next.config.ts`)

O arquivo de configuração do Next.js aplica cabeçalhos de segurança obrigatórios para todas as rotas com conformidade OWASP:

```text
// Content-Security-Policy (CSP)
default-src 'self';
script-src 'self' 'unsafe-inline' (apenas em dev: 'unsafe-eval');
script-src-attr 'none';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src 'self' https://api.resend.com;
object-src 'none';
base-uri 'self';
frame-ancestors 'none';
form-action 'self';
upgrade-insecure-requests;

// Strict-Transport-Security (HSTS)
max-age=63072000; includeSubDomains; preload

// Outros Controles de Defesa em Profundidade
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
```

### Destaques das Atualizações de CSP:
- **Eliminação de `unsafe-eval` em Produção:** `unsafe-eval` foi totalmente eliminado dos builds de produção, permanecendo condicional apenas em desenvolvimento para suporte ao Webpack HMR.
- **Redução de Injeção Inline:** Ativação de `script-src-attr 'none'`, bloqueando a execução de atributos HTML de eventos (`onclick`, `onerror`, etc.), reduzindo substancialmente a superfície de ataque XSS.
- **Isolamento de Objetos e Base:** Adição de `object-src 'none'` e `base-uri 'self'`.
- **Avaliação de Nonce vs. SSG (Static Site Generation):** O uso de Nonce dinâmico via `middleware.ts` impede a geração estática no Next.js App Router (SSG), pois cada requisição geraria um nonce aleatório não presente nos scripts estáticos pré-renderizados em HTML na CDN da Vercel. Mantém-se `script-src-attr 'none'` e eliminação de `unsafe-eval` como modelo de defesa em profundidade compatível com SSG de altíssima performance.

---

## 2. Rate Limiting Compatível com Múltiplas Instâncias Serverless

Em arquiteturas serverless (Vercel, AWS Lambda, Cloudflare Workers), contadores em memória RAM local são voláteis e não são compartilhados entre instâncias.

O rate limiter (`src/lib/rateLimit.ts`) adota arquitetura serverless de alta resiliência:
- **Operação Atômica via Script Lua:** A verificação no Redis (Upstash / Vercel KV) utiliza um script Lua atômico (`EVAL`) que executa `INCR` e define incondicionalmente o `PEXPIRE` na mesma transação atômica. Isso elimina 100% dos riscos de chaves sem TTL ou race conditions em caso de falha de conexão.
- **Política Estrita de Produção (Fail-Closed por Padrão):**
  - **Ausência de Redis em Produção:** Se as variáveis `UPSTASH_REDIS_REST_URL/TOKEN` ou `KV_REST_API_URL/TOKEN` não estiverem configuradas em ambiente de produção, a rota bloqueia preventivamente por Fail-Closed (HTTP 503 com alerta crítico nos logs). O fallback silencioso para memória em produção é proibido por padrão para evitar brechas em ambiente multinstância serverless.
  - **Falha de Conectividade do Redis:** Em produção (`NODE_ENV === 'production'`), qualquer timeout ou erro de rede do cluster Redis resulta em bloqueio seguro imediato (`provider: 'fail-closed'`).
  - **Opt-in Operacional:** Somente se `RATE_LIMIT_ALLOW_DEGRADED_FALLBACK="true"` for configurado expressamente pelo operador, admite-se o modo degradado com cota restritiva (máximo 2 requisições por instância).
- **Topologia de Borda da Vercel e Sanitização de IP:**
  - **`x-vercel-forwarded-for`:** Prioridade para o cabeçalho gerenciado diretamente pela plataforma Vercel (documentado em https://vercel.com/docs/headers/request-headers) contendo o IP real do cliente.
  - **`x-forwarded-for`:** Cabeçalho padrão HTTP inspecionado conforme RFC 7239 / MDN (primeiro nó da cadeia representando o cliente).
  - **Validação Sintática Rigorosa:** Verificação de formato IPv4 e IPv6 descarta injeções maliciosas ou valores inválidos, recorrendo a fallback seguro.
- **Anonimização Criptográfica de IP (LGPD):** O sistema nunca armazena o endereço IP em texto puro. O rate limiter calcula o hash unidirecional `SHA-256(ip + salt)` antes de registrar a chave `ratelimit:contact:<hash>`.

---

## 3. Proteção Antispam (Honeypot) & Integridade de Mensageria

- **Honeypot Silencioso:** O campo invisível `websiteHoneypot` no formulário é validado pelo schema Zod. Quando preenchido por robôs, a requisição é aceita com HTTP 200 `{ success: true, message: "Mensagem recebida." }`, descartando o payload sem alertar o bot nem consumir cotas da API de e-mail.
- **Prevenção de Falso Sucesso em Produção:** O mock de simulação de e-mail (`MOCK_EMAIL_SERVICE`) é estritamente proibido quando `NODE_ENV === 'production'`, assegurando que nenhum falso sucesso seja gerado em ambiente produtivo.
- **Limites Estritos de Payload:**
  - Nome: mínimo 2, máximo 100 caracteres.
  - E-mail: formato válido, máximo 254 caracteres (RFC 5321).
  - Assunto: mínimo 3, máximo 150 caracteres.
  - Mensagem: mínimo 10, máximo 2000 caracteres.

---

## 4. Gestão de Segredos e Variáveis de Ambiente

- Arquivos `.env`, `.env.local` e credenciais estão estritamente bloqueados no `.gitignore`.
- O repositório contém apenas `.env.example` documentando as variáveis necessárias: `RESEND_API_KEY`, `CONTACT_DESTINATION_EMAIL`, `CONTACT_FROM_EMAIL`, `RATE_LIMIT_SALT`, `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.
