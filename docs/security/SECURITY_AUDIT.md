# Relatório de Auditoria de Cibersegurança & Reconhecimento da Aplicação
**Projeto:** Portfólio Profissional v3.0 (`Currículo-v.2.0-main`)
**Data:** 2026-11-05
**Equipe Responsável:** Security Architect, AppSec, DevSecOps, Pentester Ético, Auditor de Código
**Classificação de Risco:** Baixo a Moderado (Aplicação Web Estática com Rota Serverless de Mensageria)
**Normas e Referências:** OWASP ASVS 5.0 (Nível 2 aplicável), OWASP Top 10, OWASP API Security Top 10, CWE Top 25, NIST SSDF, LGPD (Lei 13.709/2018).

---

## 1. Escopo e Inventário da Aplicação

### 1.1 Stack Tecnológica e Versões
- **Framework Web:** Next.js `16.4.3` (App Router com compilador Webpack configurado para estabilidade).
- **Biblioteca de UI:** React `19.2.8` e React DOM `19.2.8`.
- **Validação de Schemas:** Zod `4.6.6` (modo estrito implementado).
- **Estilização:** Tailwind CSS `v4` (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`).
- **Ícones & Design Tokens:** Lucide React `^1.31.0`, Tailwind Merge `^3.6.0`, Clsx `^2.1.1`.
- **Ambiente de Execução e CI:** Node.js v20 LTS / v24 (desenvolvimento), GitHub Actions (`ubuntu-latest`).
- **Suíte de Testes:** TypeScript Execution nativo (`npx tsx`) em 8 suítes automatizadas.

### 1.2 Mapeamento de Rotas e Endpoints
| Rota | Tipo | Visibilidade | Função / Descrição |
| :--- | :--- | :--- | :--- |
| `/` | Estática (SSG) | Pública | Página inicial, Hero, destaques profissionais |
| `/sobre` | Estática (SSG) | Pública | Trajetória profissional e bio |
| `/experiencia` | ISR (`revalidate: 86400`) | Pública | Linha do tempo de experiências profissionais com datas dinâmicas |
| `/projetos` | Estática (SSG) | Pública | Índice geral de cases de engenharia de software |
| `/projetos/[slug]` | Estática (SSG) | Pública | 4 cases técnicos detalhados (`generateStaticParams`) |
| `/competencias` | Estática (SSG) | Pública | Matriz de habilidades técnicas, frameworks e ferramentas |
| `/formacao` | Estática (SSG) | Pública | 65 cursos técnicos e certificações com horas auditadas |
| `/curriculo` | Estática (SSG) | Pública | Visualização para impressão e download de currículo |
| `/design-system` | Estática (SSG) | Pública | Guia de componentes e tokens do tema Cyberpunk/Dark |
| `/contato` | Estática (SSG) | Pública | Formulário de contato e links diretos (WhatsApp/Telegram/E-mail) |
| `/sitemap.xml` | Dinâmica (SEO) | Pública | Índice de 12 URLs canônicas com HTTPS |
| `/robots.txt` | Dinâmica (SEO) | Pública | Regras de indexação (bloqueia `/api/` contra crawlers) |
| `/api/contact` | Serverless (POST) | Pública | Endpoint de validação, rate limiting e disparo de e-mail |

### 1.3 Serviços Externos e Infraestrutura
- **Hospedagem & CDN:** Vercel (Edge Network e Serverless Functions).
- **Rate Limiting Distribuído:** Upstash Redis / Vercel KV via REST API com Script Lua Atômico.
- **Serviço de E-mail:** Resend API (`api.resend.com`) via chamada backend Node.js (opcional, desativado por padrão via `NEXT_PUBLIC_CONTACT_API_ENABLED="false"`).
- **Canais Diretos:** WhatsApp (`wa.me`), Telegram (`t.me`), LinkedIn e GitHub.
- **Banco de Dados:** **NÃO APLICÁVEL** (Aplicação estática/jamstack; não há armazenamento relacional ou NoSQL de dados de visitantes).
- **Autenticação / Sessões:** **NÃO APLICÁVEL** (Não há contas de usuários, login ou painel administrativo).
- **Upload de Arquivos:** **NÃO APLICÁVEL** (Não há funcionalidade de envio ou armazenamento de arquivos por usuários).
- **Pagamentos / Checkout:** **NÃO APLICÁVEL** (Portfólio profissional estritamente institucional).

---

## 2. Mapa da Superfície de Ataque

```
[ Visitante / Atacante na Internet ]
               │
               ▼
   [ Borda Vercel / CDN & WAF ]
      ├── Injeção de cabeçalhos de IP (x-forwarded-for spoofing)
      ├── Ataques de Flood / DoS
      └── Requisições de recursos estáticos pré-renderizados
               │
               ▼
   [ Runtime Serverless: Next.js App Router ]
      ├── Páginas Públicas (XSS, Clickjacking, MIME sniffing mitigados por Headers/CSP)
      └── Endpoint POST /api/contact:
            ├── 1. Extração de IP multi-proxy e sanitização
            ├── 2. Hash unidirecional com salt (SHA-256) [LGPD]
            ├── 3. Rate Limiter Serverless (5 req/hora, Fail-Closed em Prod)
            ├── 4. Validação de Content-Type (application/json)
            ├── 5. Limitação estrita de Payload (10KB máx)
            ├── 6. Parser JSON com tratamento de SyntaxError
            ├── 7. Validação Zod estrita (.strict(), anti-CRLF)
            ├── 8. Honeypot antispam com descarte silencioso
            └── 9. Integração com Resend (segredos isolados no servidor)
```

---

## 3. Classificação dos Controles Auditados

| Requisito / Controle | Classificação | Observação Técnica |
| :--- | :--- | :--- |
| **Proteção contra XSS em atributos inline** | IMPLEMENTADO E TESTADO | `script-src-attr 'none'` no CSP |
| **Eliminação de `unsafe-eval` em Produção** | IMPLEMENTADO E TESTADO | Removido dos builds de produção em `next.config.ts` |
| **Proteção contra Clickjacking** | IMPLEMENTADO E TESTADO | `X-Frame-Options: DENY` e `frame-ancestors 'none'` |
| **Proteção contra MIME Sniffing** | IMPLEMENTADO E TESTADO | `X-Content-Type-Options: nosniff` |
| **HSTS Preload e Subdomínios** | IMPLEMENTADO E TESTADO | `max-age=63072000; includeSubDomains; preload` |
| **Isolamento de Origem Cruzada** | IMPLEMENTADO E TESTADO | `Cross-Origin-Opener-Policy: same-origin` e `CORP` |
| **Rate Limiter Serverless Distribuído** | IMPLEMENTADO E TESTADO | Script Lua atômico no Redis + Fail-Closed em Produção |
| **Anonimização Criptográfica de IP** | IMPLEMENTADO E TESTADO | Hash SHA-256 + salt efêmero/configurado (LGPD) |
| **Validação de Content-Type na API** | IMPLEMENTADO E TESTADO | Rejeição com HTTP 415 para tipos não-JSON |
| **Limite de Tamanho de Requisição (DoS)** | IMPLEMENTADO E TESTADO | Cota máxima de 10KB (HTTP 413) no header e no corpo |
| **Tratamento de JSON Malformado** | IMPLEMENTADO E TESTADO | Retorno HTTP 400 controlado (código `MALFORMED_JSON`) |
| **Prevenção de Email Header Injection** | IMPLEMENTADO E TESTADO | Regex anti-CRLF em `name`/`subject` + sanitização |
| **Prevenção de Falso Sucesso / Mock** | IMPLEMENTADO E TESTADO | Mock bloqueado categoricamente se `NODE_ENV === 'production'` |
| **Mascaramento de Erros de Terceiros** | IMPLEMENTADO E TESTADO | Respostas de provedores externos sanitizadas |
| **Isolamento de Segredos de Servidor** | IMPLEMENTADO E TESTADO | Zero chaves com prefixo `NEXT_PUBLIC_` |
| **Proteção Reverse Tabnabbing** | IMPLEMENTADO E TESTADO | 100% dos links externos possuem `rel="noopener noreferrer"` |
| **Autenticação, Sessões e MFA** | NÃO APLICÁVEL | Sem área de membros ou contas de usuários |
| **Segurança de Banco de Dados** | NÃO APLICÁVEL | Não há banco de dados na aplicação |
| **Upload de Arquivos por Usuários** | NÃO APLICÁVEL | Não há funcionalidade de upload |
| **Gateways de Pagamento** | NÃO APLICÁVEL | Não há transações financeiras |
| **Configuração de Segredos na Nuvem** | DEPENDENTE DE CONFIGURAÇÃO EXTERNA | Requer preenchimento de variáveis no painel Vercel |
