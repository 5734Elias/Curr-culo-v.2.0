# Endurecimento de Deploy, Vercel & CI/CD (Deployment Hardening)
**Projeto:** Portfólio Profissional v3.0 (`Currículo-v.2.0-main`)
**Data:** 2026-11-05
**Auditor Responsável:** DevSecOps Engineer & Security Architect
**Plataforma de Produção:** Vercel (Edge & Serverless Node.js)

---

## 1. Configuração da Vercel (`vercel.json`)

O arquivo de configuração oficial na raiz do projeto gerencia a compilação do monorepo e o isolamento dos artefatos:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "npm --prefix \"Currículo/frontend\" ci && ln -sfn \"Currículo/frontend/node_modules\" node_modules",
  "buildCommand": "npm --prefix \"Currículo/frontend\" run build",
  "outputDirectory": "Currículo/frontend/.next"
}
```

### Análise de Segurança da Configuração:
- **`installCommand` com `npm ci`:** Garante integridade absoluta de dependências com base no `package-lock.json`, eliminando o risco de download de pacotes não auditados ou adulterados em tempo de deploy.
- **Link Simbólico (`ln -sfn`):** Permite que o Next.js no nível raiz compartilhe as dependências isoladas sem necessidade de duplicação ou exposição global.
- **`outputDirectory` isolado:** O diretório de saída aponta diretamente para o build otimizado em `Currículo/frontend/.next`, evitando que pastas de documentação ou scripts de desenvolvimento sejam publicados na CDN pública.

---

## 2. Segurança da Pipeline de CI/CD (`.github/workflows/ci.yml`)

O workflow do GitHub Actions segue as melhores práticas do NIST SSDF e do GitHub Security Lab:

1. **Princípio do Privilégio Mínimo:**
   - O workflow declara explicitamente `permissions: contents: read`, impedindo que tokens de CI tenham permissão de escrita, commit ou deploy indevido.
2. **Isolamento de Branches:**
   - Execução em branches controladas (`main`, `master`).
3. **Cache Seguro de Dependências:**
   - `actions/setup-node@v4` com cache atrelado ao hash de `Currículo/frontend/package-lock.json`.
4. **Gates de Qualidade Obrigatórios Antes do Build:**
   - `npm run lint` (ESLint 9)
   - `npm run typecheck` (TypeScript 5 noEmit)
   - `npm run test` (8 suítes de testes automatizados via `npx tsx`)
   - `npm run build` (Compilação estática de produção)
5. **Privacidade de Telemetria:**
   - `NEXT_TELEMETRY_DISABLED: '1'` habilitado em todas as etapas de compilação.

---

## 3. Checklist de Produção (Homologação de Segurança)

| Item de Verificação | Requisito Técnico | Status |
| :--- | :--- | :---: |
| **HTTPS Obrigatório** | TLS 1.3 gerenciado com redirecionamento automático de HTTP | **APROVADO (Vercel Edge)** |
| **HSTS Ativo** | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` | **APROVADO (`next.config.ts`)** |
| **Proteção XSS / CSP** | `script-src-attr 'none'`, `object-src 'none'`, `unsafe-eval` eliminado | **APROVADO (`next.config.ts`)** |
| **Isolamento de Origem** | `Cross-Origin-Opener-Policy` e `Cross-Origin-Resource-Policy: same-origin` | **APROVADO (`next.config.ts`)** |
| **Rate Limiter Serverless** | Cota de 5 requisições/hora por IP; Fail-Closed ativo em falha de Redis | **APROVADO (`rateLimit.ts`)** |
| **Validação de Payload** | Limite de 10KB (HTTP 413), Content-Type (HTTP 415), Anti-CRLF no Zod | **APROVADO (`route.ts`)** |
| **Ausência de Mocks** | `MOCK_EMAIL_SERVICE` estritamente bloqueado em `NODE_ENV=production` | **APROVADO (`contactService.ts`)** |
| **Exposição de Stack Traces** | Páginas de depuração e stack traces desativados em produção | **APROVADO (Next.js default)** |
| **Ocultação de Tecnologia** | `X-Powered-By` desativado via `poweredByHeader: false` | **APROVADO (`next.config.ts`)** |
| **Proteção de Links** | Todos os links com `target="_blank"` utilizam `rel="noopener noreferrer"` | **APROVADO (100% verificado)** |
