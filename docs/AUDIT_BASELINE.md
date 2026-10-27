# Auditoria de Baseline - Projeto Currículo v2.0 -> v3.0

**Data:** 2026-10-27  
**Responsável Técnico:** Arquiteto de Software Principal  
**Status do Projeto:** Fase 0 - Diagnóstico e Baseline Concluído  

---

## 1. Visão Geral do Repositório

- **Raiz do Repositório:** `Curr-culo-v.2.0-main/`
- **Aplicação Principal:** `Currículo/frontend/`
- **Arquitetura de Agentes:** `Currículo/.agents/` (contém 20 personas de agentes, workflows e catálogo de skills)
- **Legado:** `Currículo/legacy_resume/`

---

## 2. Stack Tecnológica Identificada

| Tecnologia | Versão Instalada | Papel no Projeto | Estado |
|---|---|---|---|
| Next.js | 16.3.0 | Framework Full Stack / App Router | Funcional (Requer `--webpack` no Windows) |
| React | 19.2.8 | Biblioteca de UI | Estável |
| React DOM | 19.2.8 | Renderizador DOM | Estável |
| TypeScript | 5.x | Tipagem Estática | 100% aprovado no `tsc --noEmit` |
| Tailwind CSS | 4.x | Estilização por classes utilitárias | Estável |
| @tailwindcss/postcss | 4.x | Plugin PostCSS para Tailwind v4 | Provoca panic no Turbopack (Windows) |
| Zod | 4.4.3 | Validação de Schemas | Vulnerabilidade de DoS (atualizar para >=4.6.6) |
| Lucide React | 1.31.0 | Ícones do sistema | Estável |
| ESLint | 9.x | Análise estática de código | 100% aprovado sem erros |

---

## 3. Resultados dos Comandos de Baseline

### 3.1 `npm run lint`
- **Comando:** `eslint`
- **Resultado:** **APROVADO (Código 0)**. Nenhuma regra violada no código atual.

### 3.2 `npm run typecheck`
- **Comando:** `tsc --noEmit`
- **Resultado:** **APROVADO (Código 0)**. Tipagem estritamente compatível.

### 3.3 `npm run test`
- **Comando:** `npx tsx scripts/validate-courses.mjs`
- **Resultado:** **APROVADO (Código 0)**.
- **Diagnóstico:** O comando `test` atual executa apenas a integridade estática dos dados de cursos (65 cursos validados, 2164.5 horas). **Não há testes unitários de componentes, nem testes de integração da rota de API, nem testes E2E.**

### 3.4 `npm run build`
- **Turbopack (`next build`):** **FALHA NO WINDOWS**. O Turbopack entra em pânico ao avaliar o loader do PostCSS/Tailwind v4 (`TurbopackInternalError: Failed to write app endpoint /page`).
- **Webpack (`next build --webpack`):** **APROVADO (Código 0)**. Todas as 19 rotas foram compiladas e geradas com sucesso (15 estáticas, 4 SSG, 1 API route dinâmica).
- **Dependência de Fontes:** `next/font/google` tenta buscar `Inter` e `JetBrains Mono` em `fonts.googleapis.com` no build. Em ambientes desconectados, gera erro de resolução de DNS.

---

## 4. Auditoria de Segurança (`npm audit`)

Foram identificadas **6 vulnerabilidades** (1 Crítica, 5 Altas):

| Pacote | Severidade | Vulnerabilidade | Impacto | Ação Recomendada |
|---|---|---|---|---|
| `next` (16.0.0 - 16.4.0) | **CRÍTICA** | GHSA-p293-qw3h-jr36 / GHSA-2xp9-vwfh-vxw4 | RCE não autenticado no Windows / SSRF / Cache Poisoning | Atualizar Next.js para versão corrigida |
| `zod` (<4.6.6) | **ALTA** | GHSA-mrhx-c7xc-m3w5 | Exaustão de memória em validação de coleções aninhadas | Atualizar Zod |
| `brace-expansion` | **ALTA** | GHSA-q2hr-2g5m-vwhr | CPU DoS via expansão quadrática | Executar `npm audit fix` |
| `js-yaml` | **ALTA** | GHSA-2883-xcg3-v3hh | DoS via consumo excessivo de CPU | Executar `npm audit fix` |
| `sharp` | **ALTA** | GHSA-rgj7-g3m4-5g8c / GHSA-wq5f-xc86-pv6w | Vulnerabilidade em bibliotecas gráficas subjacentes | Executar `npm audit fix` |
| `source-map-js` | **ALTA** | GHSA-68fv-2mgg-jv7q | Event-loop DoS via offsets de source map | Executar `npm audit fix` |

---

## 5. Auditoria de Rotas e Endpoints

### 5.1 Rotas Públicas
- `/` - Página Inicial (Hero, Métricas, Projetos em destaque, Cursos em destaque)
- `/competencias` - Matriz de Habilidades Técnicas
- `/contato` - Formulário de Contato
- `/curriculo` - Visualização do Currículo para leitura e impressão
- `/design-system` - Demonstração dos componentes e tokens de UI
- `/experiencia` - Linha do tempo profissional
- `/formacao` - Histórico educacional e certificações
- `/projetos` - Listagem geral de projetos
- `/projetos/[slug]` - Detalhamento dinâmico de projetos (4 slugs: `agente-ia-antigravity-foundry`, `spring-mqttx-iot-library`, `fortinet-cyber-pentest-shield`, `aws-cloud-data-pipeline`)
- `/sobre` - Biografia e trajetória

### 5.2 Endpoints de API
- `/api/contact` (POST):
  - **Problema Crítico de Negócio:** **Falso Sucesso**. O endpoint valida os dados e retorna sucesso, mas **não possui nenhum mecanismo de envio real de mensagem**, perdendo todas as mensagens submetidas.
  - **Armazenamento de Rate Limit:** `Map` em memória global. Em arquitetura serverless (Vercel), a memória é reiniciada entre requisições, tornando o limite inoperante.
  - **Tratamento de IP:** Falta de sanitização robusta contra spoofing de cabeçalhos de proxy.

---

## 6. Inconsistência de Dados (Single Source of Truth)

- **LinkedIn URL:**
  - `src/app/layout.tsx`: `https://www.linkedin.com/in/elias-ribeiro-dos-reis-b7791b291`
  - `src/data/profile.ts`: `https://www.linkedin.com/in/elias-ribeiro-dos-reis-3b289a43`
- **Configurações de Segurança HTTP:**
  - `next.config.ts` está vazio. Não existem cabeçalhos de segurança (CSP, HSTS, X-Content-Type-Options, etc.).

