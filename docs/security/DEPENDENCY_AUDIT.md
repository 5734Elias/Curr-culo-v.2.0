# Auditoria de Dependências & Supply Chain (Software Supply Chain Security)
**Projeto:** Portfólio Profissional v3.0 (`Currículo-v.2.0-main`)
**Data:** 2026-11-05
**Auditor Responsável:** DevSecOps Engineer & Security Architect
**Padrões:** OWASP Dependency-Check / Software Bill of Materials (SBOM)

---

## 1. Inventário de Dependências (SBOM - Software Bill of Materials)

### 1.1 Dependências de Produção (`dependencies`)
| Pacote | Versão Fixada | Função | Análise de Segurança & Vulnerabilidades |
| :--- | :--- | :--- | :--- |
| **`next`** | `16.4.3` | Framework Web Full Stack / SSR / SSG | Patched release da série 16; mitiga CVEs de SSRF e request smuggling presentes em versões 14/15 legadas. |
| **`react`** | `19.2.8` | Biblioteca de UI declarativa | Versão estável do React 19; zero vulnerabilidades conhecidas. |
| **`react-dom`** | `19.2.8` | Renderizador DOM do React | Versão estável do React 19; zero vulnerabilidades conhecidas. |
| **`zod`** | `^4.6.6` | Validação e tipagem de schemas em runtime | Biblioteca padrão de mercado para parsing defensivo; zero vulnerabilidades. |
| **`clsx`** | `^2.1.1` | Utilitário para combinação condicional de classes | Utilitário micro-lib sem dependências transitivas; zero vulnerabilidades. |
| **`tailwind-merge`**| `^3.6.0` | Resolução de conflitos de classes Tailwind CSS | Zero vulnerabilidades conhecidas. |
| **`lucide-react`** | `^1.31.0` | Conjunto de ícones SVG limpos e otimizados | Zero vulnerabilidades conhecidas. |

### 1.2 Dependências de Desenvolvimento (`devDependencies`)
| Pacote | Versão | Função | Análise de Segurança |
| :--- | :--- | :--- | :--- |
| **`tailwindcss`** | `^4` | Motor utilitário Tailwind CSS v4 | Compilação CSS de última geração; zero vulnerabilidades. |
| **`@tailwindcss/postcss`** | `^4` | Plugin PostCSS para Tailwind v4 | Zero vulnerabilidades conhecidas. |
| **`typescript`** | `^5` | Compilador estático TypeScript | Ferramenta oficial Microsoft; zero vulnerabilidades. |
| **`tsx`** | `^4.19.2` | Executor nativo TypeScript (ESM) para testes | Substitui Jest/Babel; rápido e sem poluição de dependências legadas. |
| **`eslint`** | `^9` | Linter estático de código | Regras de análise estática de código; zero vulnerabilidades. |
| **`eslint-config-next`** | `16.4.3` | Regras oficiais ESLint para Next.js | Alinhado à versão do Next.js. |
| **`@types/node`** | `^20` | Tipagens estáticas do Node.js v20 | Apenas definições de tipos de desenvolvimento. |
| **`@types/react`** | `^19` | Tipagens estáticas do React 19 | Apenas definições de tipos de desenvolvimento. |
| **`@types/react-dom`** | `^19` | Tipagens estáticas do React DOM 19 | Apenas definições de tipos de desenvolvimento. |

---

## 2. Controles de Integridade de Supply Chain

1. **Lockfile Estrito (`package-lock.json`):**
   - O arquivo `package-lock.json` possui 253KB e especifica hashes criptográficos SHA-512 (`integrity`) para cada pacote e subdependência.
   - O pipeline de CI (`.github/workflows/ci.yml`) executa estritamente `npm ci`, impedindo a instalação de versões divergentes ou atualizações não intencionais durante a compilação.
2. **Scripts de Pós-Instalação (`install-scripts`):**
   - Na instalação de dependências, apenas os scripts nativos de compilação de binários (`esbuild` e `unrs-resolver`) são executados.
   - Nenhuma biblioteca desconhecida ou suspeita executa scripts arbitrários.
3. **Ausência de Pacotes Abandonados ou Depreciados:**
   - A biblioteca `next-themes` (que historicamente apresentava problemas de hidratação ou dependências transitivas complexas) não é utilizada; o tema claro/escuro foi implementado de forma 100% nativa em React 19.

---

## 3. Recomendações Contínuas de Supply Chain
- Manter o Dependabot do GitHub ativado para alertas de vulnerabilidades de novos releases de pacotes.
- Executar periodicamente varreduras locais de auditoria (`npm audit`) ao atualizar dependências.
