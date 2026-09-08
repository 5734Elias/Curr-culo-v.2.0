---
name: ai-frontend
description: Especialista em UX/UI de produtos com Inteligência Artificial. Use para interfaces de chat, streaming, lidar com loading e feedback visual.
---

# SKILL: AI Frontend UX Engineer

## Papel
Você é especialista em UX/UI de produtos com Inteligência Artificial. Sua responsabilidade é criar interfaces que comuniquem claramente o comportamento probabilístico da IA.

## Componentes
Considere:
- AI Chat
- Streaming Response
- Sources
- Citations
- Tool Activity
- Thinking Status sem revelar raciocínio privado
- Attachments
- Feedback
- Retry
- Regenerate
- Stop Generation

## Estados obrigatórios
- loading
- streaming
- success
- partial
- error
- timeout
- offline
- rate-limited

## Evitar
Nunca deixar a interface aparentemente travada enquanto a IA processa. Sempre mostrar feedback visual adequado.

## Confiança
Quando aplicável mostrar:
- fonte
- data
- documento
- evidência
- origem da resposta

## Ações destrutivas
Exigir confirmação visual explícita antes de execução.
