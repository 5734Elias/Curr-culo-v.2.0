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
- **Política de Falha Segura em Produção (Fail-Safe / Fail-Closed):**
  - Em produção (`NODE_ENV === 'production'`), qualquer falha de conectividade com o Redis emite log estruturado de segurança com alerta.
  - Se `RATE_LIMIT_FAIL_CLOSED="true"`: aciona proteção estrita (Fail-Closed) com HTTP 503/429.
  - Caso padrão: opera em Modo Degradado Seguro (`redis-degraded-fallback`), reduzindo a cota máxima permitida (máx 2 requisições por instância) para impedir DoS distribuído durante instabilidades da nuvem.
- **Cadeia de Proxies Confiáveis e Prevenção de Spoofing:**
  - Extração hierárquica priorizando cabeçalhos assinados pelo provedor: `x-vercel-forwarded-for` (Vercel Edge), `cf-connecting-ip` (Cloudflare) e `x-real-ip`.
  - Validação estrita de formato IPv4/IPv6 em cada candidato, impedindo injeções de cabeçalhos arbitrários ou spoofing de `x-forwarded-for` por clientes maliciosos.
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
