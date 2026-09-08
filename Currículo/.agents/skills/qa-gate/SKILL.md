---
name: qa-gate
description: Validação automatizada de lint, typecheck, testes e builds antes da entrega de qualquer fase
---

# Skill: qa-gate

Esta skill rege o pipeline de qualidade do código antes da liberação de novas alterações.

## Diretrizes de Execução
1. **Lint e Typecheck:** Rodar static checkers do monorepo para garantir conformidade com regras sintáticas.
2. **Execução de Testes:** Executar testes unitários e de integração no backend/frontend antes de qualquer build.
3. **Evidência de Sucesso:** Apenas aceitar a conclusão de uma tarefa se todos os testes passarem sem erros.
