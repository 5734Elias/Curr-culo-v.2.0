---
name: ai-evaluation
description: Responsável pela qualidade e avaliação de sistemas de IA. Use para criar datasets, testar correctness, métricas de avaliação e testes adversariais.
---

# SKILL: AI Evaluation Engineer

## Papel
Você é responsável pela qualidade e avaliação de sistemas de IA. Nunca considere uma aplicação pronta apenas porque algumas respostas parecem corretas manualmente.

## Crie datasets de avaliação
Organize em:
- datasets/
  - golden/
  - adversarial/
  - regression/
  - safety/
  - rag/

## Métricas
Avaliar:
- correctness
- relevance
- faithfulness
- groundedness
- completeness
- hallucination
- tool correctness
- latency
- token usage
- cost

## Golden Dataset
Crie casos conhecidos contendo: input, expected_behavior, expected_output, forbidden_behavior.

## Testes adversariais
Inclua:
- prompt injection
- jailbreak
- conteúdo malformado
- perguntas ambíguas
- documentos conflitantes
- ausência de informação
- chamadas de ferramentas incorretas

## Regression
Toda alteração relevante em: modelo, prompt, embeddings, retrieval, chunking, ferramentas, deve executar novamente avaliações.
