# Estratégia de Testes Automatizados & QA

---

## 1. Visão Geral da Suíte de Testes

O comando `npm run test` orquestra uma suíte de 7 scripts executados nativamente via **`npx tsx` (TypeScript Execute)**, validando integridade de dados, conformidade técnica, segurança de rotas, acessibilidade WCAG, regressões de auditoria e verificação de serviços sem dependência do Jest:

```text
npm run test
  ├── 1. validate-courses.mjs            (Integridade de dados educacionais)
  ├── 2. test-security-and-contact.mjs   (Segurança de API, Schemas e Rate Limit)
  ├── 3. validate-data-consistency.mjs   (Auditoria cruzada Single Source of Truth)
  ├── 4. test-seo-and-routes.mjs         (Auditoria técnica de SEO e rotas)
  ├── 5. test-ui-accessibility.mjs       (Verificações de Acessibilidade Digital Alinhadas à WCAG 2.2)
  ├── 6. test-audit-regressions.mjs      (Auditoria de Lua atômico, fail-closed e regressões)
  └── 7. test-services-verification.mjs  (Verificação de Upstash Redis, Resend, UI e Next.js 16.3)
```

---

## 2. Cobertura das Suítes

### 2.1 Validação de Cursos (`scripts/validate-courses.mjs`)
- Unicidade estrita de identificadores de cursos.
- Deduplicação determinística.
- Auditoria de soma de carga horária (total auditado: 2.164,5 horas).
- Agrupamento institucional (SENAI, Ka Solution, Fundação Bradesco, etc.).

### 2.2 Segurança & Contato (`scripts/test-security-and-contact.mjs`)
- Schemas Zod: campos obrigatórios, limites de tamanho e sanitização.
- Extração de IP em proxies reversos (`x-forwarded-for`).
- Anonimização criptográfica com salt via SHA-256.
- Bloqueio após 5 tentativas no rate limiter (HTTP 429).
- Prevenção ativa de falso sucesso no serviço de mensagens.

### 2.3 Consistência de Fonte Única (`scripts/validate-data-consistency.mjs`)
- Garantia de que todos os links em projetos apontam para os canais do `PROFILE`.
- Formato kebab-case canônico e unicidade dos slugs de estudos de caso.
- Coerência de métricas e responsabilidades de experiência profissional.

### 2.4 SEO & Rotas (`scripts/test-seo-and-routes.mjs`)
- Bloqueio de indexação da pasta `/api/` e `/design-system` no `robots.ts`.
- Mapeamento das 12 rotas canônicas e projetos no `sitemap.ts`.
- Validação de datas estáveis e prioridades semânticas.

### 2.5 Acessibilidade & UI (`scripts/test-ui-accessibility.mjs`)
- Verificação de regras de `prefers-reduced-motion` no CSS.
- Altura mínima de 44px para botões de toque (Target Size WCAG 2.2).
- Atributos ARIA no `ThemeToggle` e links de navegação.
- Presença de Skip Link (`#main-content`) no layout global.

