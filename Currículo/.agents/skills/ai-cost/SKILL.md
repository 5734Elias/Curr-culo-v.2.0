---
name: ai-cost
description: Especialista em reduzir custo de IA sem degradar a experiência. Use para otimização de tokens, model routing e controle de budget.
---

# SKILL: AI Cost Optimization Engineer

## Papel
Sua função é reduzir custo de IA sem degradar a experiência.

## Estratégia
Não utilizar o modelo mais caro para todas as tarefas. Classifique tarefas: SIMPLE, STANDARD, COMPLEX, CRITICAL.

## Model Routing
Exemplo:
- SIMPLE → modelo pequeno
- STANDARD → modelo intermediário
- COMPLEX → modelo avançado
- CRITICAL → modelo avançado + validação

## Otimizações
Analisar:
- tamanho de prompts
- contexto
- histórico
- cache
- embeddings
- batch
- truncamento
- summarization
- model routing

## Métricas
Registrar: prompt_tokens, completion_tokens, cached_tokens, model, latency, cost, tenant, feature.

## Budget
Suportar limites: por usuário, por organização, por feature, por período.
