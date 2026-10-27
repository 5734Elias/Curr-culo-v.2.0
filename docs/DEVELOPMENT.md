# Guia de Desenvolvimento — Portfólio Profissional v3.0

---

## 1. Ambiente Local

### Requisitos Mínimos
- Node.js 20.x LTS ou superior
- NPM 10.x ou superior

### Comandos do Ciclo de Vida (`package.json`)

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento em `http://localhost:3000` |
| `npm run build` | Compila o projeto em modo produção com Webpack |
| `npm run start` | Inicia o servidor de produção local após o build |
| `npm run lint` | Executa o ESLint 9 para análise estática de código |
| `npm run typecheck` | Executa o compilador TypeScript sem emitir arquivos (`tsc --noEmit`) |
| `npm run test` | Executa a suíte quíntupla de testes automatizados via TSX |

---

## 2. Convenções de Código

- **Linguagem dos Arquivos:** Identificadores técnicos, nomes de componentes, métodos, variáveis e arquivos devem estar em **inglês**. Textos de interface, comentários explicativos e documentações devem estar em **português do Brasil**.
- **Padrão de Nomenclatura:**
  - Componentes React: `PascalCase.tsx` (ex: `ThemeToggle.tsx`)
  - Utilitários e Schemas: `camelCase.ts` (ex: `rateLimit.ts`)
  - Scripts de QA: `kebab-case.mjs` (ex: `test-security-and-contact.mjs`)
- **Padrão de Commits Git:**
  ```text
  tipo: descrição da alteração | YYYY-MM-DD HH:mm
  ```
