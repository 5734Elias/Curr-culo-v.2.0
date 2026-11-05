# Plano de Correção e Hardening (Remediation Plan)
**Projeto:** Portfólio Profissional v3.0 (`Currículo-v.2.0-main`)
**Data de Execução:** 2026-11-05
**Estratégia:** Hardening Incremental em Profundidade com Zero Regressões e Preservação da Experiência do Usuário.

---

## 1. Princípios de Execução

1. **Princípio do Privilégio Mínimo e Superfície Mínima:** Reduzir todas as diretivas abertas (como `connect-src` e validações de input) ao estritamente necessário para o funcionamento da página de contato e portfólio.
2. **Defesa em Profundidade:** Aplicar validações tanto no nível do schema sintático (Zod) quanto na camada de serviço (`contactService.ts`) e no processamento da rota HTTP (`route.ts`).
3. **Fail-Closed em Produção:** Garantir que falhas de infraestrutura externa (como ausência ou indisponibilidade de Redis) interrompam preventivamente rotas de escrita, sem expor a infraestrutura a abusos.
4. **Preservação Integral da Arquitetura:**
   - Não adicionar bancos de dados relacionais, autenticação ou sistemas de arquivos que aumentem desnecessariamente a complexidade e a superfície de ataque.
   - Preservar SEO, acessibilidade WCAG 2.1 AA, design cyberpunk e layout responsivo.

---

## 2. Fases de Remediação Executadas

```
[ Fase A: Baseline e Triagem ] ──► [ Fase B: Hardening de API e Input ] ──► [ Fase C: CSP e Headers HTTP ]
                                                                                   │
                                                                                   ▼
[ Fase F: Homologação e Laudo ] ◄── [ Fase E: Validação de Build ] ◄── [ Fase D: Testes Automatizados ]
```

### Fase A: Linha de Base (Baseline) e Triagem
- Instalação e verificação de integridade de dependências (`npm ci`).
- Execução da suíte pré-existente de testes para garantir funcionamento inicial aprovado.
- Mapeamento das 7 vulnerabilidades e gaps de segurança (SEC-001 a SEC-007).

### Fase B: Hardening de Entrada e Segurança de API
- **Validação de Content-Type:** Implementada checagem em `src/app/api/contact/route.ts` exigindo `application/json` (HTTP 415).
- **Proteção contra DoS de Payload:** Cota estrita de 10KB (HTTP 413) aplicada antes e durante o consumo do corpo da requisição.
- **Tratamento de Exceções JSON:** Parser seguro com retorno HTTP 400 (`MALFORMED_JSON`).
- **Prevenção de CRLF Injection:** Inserção de regex anti-quebra de linha no Zod (`name` e `subject`) e sanitização em `contactService.ts`.
- **Modo Strict no Schema Zod:** Bloqueio de campos extras não mapeados (`.strict()`).
- **Mitigação de IP Spoofing:** Ordenação defensiva de cabeçalhos de IP em `src/lib/rateLimit.ts` (`x-vercel-forwarded-for` > `x-real-ip` > `cf-connecting-ip` > `x-forwarded-for`).

### Fase C: Content-Security-Policy & Headers
- Restrição de `connect-src` no cliente para `'self'` (eliminando `https://api.resend.com` do navegador).
- Inclusão de `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin` e `X-DNS-Prefetch-Control: on` em `next.config.ts`.
- Confirmação de `poweredByHeader: false`.

### Fase D: Testes Automatizados de Regressão e Segurança
- Criação da suíte dedicada `Currículo/frontend/scripts/test-cybersecurity-hardening.mjs`.
- Inclusão do novo script no comando `npm test` do `package.json`.
- Execução de testes de concorrência, rate limiting, mitigação de spoofing e validação de 100% dos links externos.

### Fase E: Verificação de Build de Produção
- Execução de `npm run lint` (0 erros, 0 warnings).
- Execução de `npm run typecheck` (0 erros TypeScript).
- Execução de `npm run build` confirmando compilação estática de 19 páginas e rota dinâmica `/api/contact`.

### Fase F: Documentação e Laudo Técnico
- Elaboração dos 10 relatórios técnicos sob `docs/security/`.
